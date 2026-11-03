import React, { useState, useRef, useMemo } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Upload,
  ChevronDown,
  Loader2,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  // Building2,
  MapPin,
} from "lucide-react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectsApi,
  // getProjectDetailsApi,
  // getProjectDrawingsApi,
  createDeliveryApi,
  type CreateDeliveryPayload,
} from "../../api/projects.api";
import type { CreatedDeliveryData, Project } from "../../types/projects.types";
import { uploadFileToS3 } from "../../lib/upload";

type AddDeliveryDrawerProps = {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  initialDate?: string;
  onSuccess?: (delivery?: CreatedDeliveryData) => void;
};

interface AttachmentItem {
  id: string;
  file: File;
  name: string;
  size: number;
  url?: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface AddDeliveryDrawerContentProps {
  onClose: () => void;
  leadId?: string;
  initialDate?: string;
  onSuccess?: (delivery?: CreatedDeliveryData) => void;
}

function AddDeliveryDrawerContent({
  onClose,
  leadId: initialLeadId,
  initialDate,
  onSuccess,
}: AddDeliveryDrawerContentProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states initialized fresh on mount
  const [title, setTitle] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || "");
  const [sectionLocation, setSectionLocation] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    initialDate || dayjs().format("YYYY-MM-DD")
  );
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Query projects for dropdown (GET /api/construction/projects?page=1&limit=50)
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["construction-projects-list-delivery"],
    queryFn: () => getProjectsApi({ page: 1, limit: 50 }),
  });

  const projects: Project[] = useMemo(() => {
    return projectsData?.data?.data?.projects || [];
  }, [projectsData]);

  /*
  // If initialLeadId is given or project is selected, fetch project details and drawings for suggested locations
  const effectiveLeadId = selectedLeadId || initialLeadId || "";

  const selectedProject = useMemo(() => {
    return projects.find((p) => (p.leadId || p._id) === effectiveLeadId);
  }, [projects, effectiveLeadId]);

  const { data: projectDetailsData } = useQuery({
    queryKey: ["delivery-project-details", effectiveLeadId],
    queryFn: () => getProjectDetailsApi(effectiveLeadId),
    enabled: !!effectiveLeadId,
  });

  const { data: drawingsData } = useQuery({
    queryKey: ["delivery-project-drawings", effectiveLeadId],
    queryFn: () => getProjectDrawingsApi(effectiveLeadId),
    enabled: !!effectiveLeadId,
  });

  // Calculate suggested section/locations based on project location & building drawings
  const suggestedLocations = useMemo(() => {
    const suggestions: string[] = [];

    // Project location from list or details
    const loc =
      projectDetailsData?.data?.data?.project?.location ||
      selectedProject?.location;
    if (loc && loc.trim()) {
      suggestions.push(loc.trim());
    }

    // Building labels from plant drawings
    const buildings = drawingsData?.data?.data?.buildings || [];
    buildings.forEach((b) => {
      const label = b.buildingNumber
        ? `Building ${b.buildingNumber}`
        : b.buildingId
        ? `Building ${b.buildingId}`
        : null;
      if (label && !suggestions.includes(label)) {
        suggestions.push(label);
      }
    });

    return suggestions;
  }, [projectDetailsData, selectedProject, drawingsData]);
  */

  // Mutation to create delivery
  const createDeliveryMutation = useMutation({
    mutationFn: (payload: CreateDeliveryPayload) => createDeliveryApi(payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Delivery added successfully!");
      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ["calendar-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["material-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      if (onSuccess) {
        onSuccess(res.data?.data?.delivery);
      }
      onClose();
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create delivery. Please check required fields.";
      toast.error(msg);
    },
  });

  // Handle file uploads to presigned URL
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    const newItems: AttachmentItem[] = fileArray.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading",
    }));

    setAttachments((prev) => [...prev, ...newItems]);

    // Upload each file via presigned URL with folder: "documents"
    for (const item of newItems) {
      try {
        const fileUrl = await uploadFileToS3(
          item.file,
          "documents",
          (progress) => {
            setAttachments((prev) =>
              prev.map((att) =>
                att.id === item.id ? { ...att, progress } : att
              )
            );
          }
        );

        setAttachments((prev) =>
          prev.map((att) =>
            att.id === item.id
              ? { ...att, status: "completed", url: fileUrl, progress: 100 }
              : att
          )
        );
      } catch (uploadErr) {
        const errorMsg =
          uploadErr instanceof Error ? uploadErr.message : "Upload failed";
        setAttachments((prev) =>
          prev.map((att) =>
            att.id === item.id
              ? {
                  ...att,
                  status: "error",
                  error: errorMsg,
                }
              : att
          )
        );
        toast.error(`Failed to upload ${item.name}`);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const isUploading = attachments.some((att) => att.status === "uploading");

  // Validate and submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!selectedLeadId) {
      newErrors.leadId = "Please select a project";
    }

    if (!deliveryDate) {
      newErrors.deliveryDate = "Please choose a delivery date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isUploading) {
      toast.error("Please wait for all attachments to finish uploading");
      return;
    }

    // Filter successful uploaded attachment URLs
    const completedUrls = attachments
      .filter((att) => att.status === "completed" && att.url)
      .map((att) => att.url as string);

    const payload: CreateDeliveryPayload = {
      title: title.trim() || undefined,
      leadId: selectedLeadId,
      sectionLocation: sectionLocation.trim() || undefined,
      deliveryDate,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      attachments: completedUrls.length > 0 ? completedUrls : undefined,
    };

    createDeliveryMutation.mutate(payload);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Add Delivery</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Schedule a material shipment for a construction site
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Form Content */}
      <form
        id="add-delivery-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
      >
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Delivery Information
          </h3>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="delivery-title"
              className="text-xs font-bold text-gray-700 tracking-wide"
            >
              Title <span className="text-gray-400 font-normal">(Recommended)</span>
            </label>
          </div>
          <input
            id="delivery-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Primary Frame Steel"
            className="w-full h-11 border border-gray-200 rounded-xl px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Project Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="delivery-project"
              className="text-xs font-bold text-gray-700 tracking-wide"
            >
              Project <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="relative">
            <select
              id="delivery-project"
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                if (errors.leadId) {
                  setErrors((prev) => ({ ...prev, leadId: "" }));
                }
              }}
              disabled={isLoadingProjects}
              className={`w-full h-11 border rounded-xl px-4 pr-10 outline-none appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium bg-white cursor-pointer ${
                errors.leadId ? "border-red-400" : "border-gray-200"
              } ${selectedLeadId ? "text-gray-900" : "text-gray-400"}`}
            >
              <option value="">
                {isLoadingProjects ? "Loading projects..." : "Select Project"}
              </option>
              {projects.map((proj) => {
                const id = proj.leadId || proj._id;
                const label =
                  proj.projectName ||
                  `${proj.buildingType || "Project"} (${proj.jobId || id})`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              {isLoadingProjects ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
          {errors.leadId && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.leadId}
            </p>
          )}
        </div>

        {/* Section / Location */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="delivery-section-location"
              className="text-xs font-bold text-gray-700 tracking-wide"
            >
              Section / Location{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
          </div>
          <div className="relative">
            <input
              id="delivery-section-location"
              type="text"
              value={sectionLocation}
              onChange={(e) => setSectionLocation(e.target.value)}
              placeholder="e.g. Building A - Front Elevation"
              className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-9 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
            />
            <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Suggested quick-fill pills if project has location or buildings */}
          {/*
          {suggestedLocations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-gray-400 font-medium mr-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-gray-400" />
                Suggested:
              </span>
              {suggestedLocations.map((loc, idx) => (
                <button
                  type="button"
                  key={`${loc}-${idx}`}
                  onClick={() => setSectionLocation(loc)}
                  className={`px-2 py-0.5 rounded-md text-xs border transition-colors cursor-pointer ${
                    sectionLocation === loc
                      ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
          */}
        </div>

        {/* Delivery Date */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="delivery-date"
              className="text-xs font-bold text-gray-700 tracking-wide"
            >
              Delivery Date <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                if (errors.deliveryDate) {
                  setErrors((prev) => ({ ...prev, deliveryDate: "" }));
                }
              }}
              className={`w-full h-11 border rounded-xl px-4 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-900 bg-white ${
                errors.deliveryDate ? "border-red-400" : "border-gray-200"
              }`}
            />
            <CalendarIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.deliveryDate && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.deliveryDate}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="delivery-description"
              className="text-xs font-bold text-gray-700 tracking-wide"
            >
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
          </div>
          <textarea
            id="delivery-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Structural steel delivery for phase 1"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="delivery-notes"
              className="text-xs font-bold text-gray-700 tracking-wide"
            >
              Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
          </div>
          <textarea
            id="delivery-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Requires forklift for unloading"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700 tracking-wide">
              Attachments <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            {attachments.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                {attachments.length} file{attachments.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Hidden native input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFileUpload(e.target.files);
                e.target.value = "";
              }
            }}
          />

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) {
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group ${
              isDragging
                ? "border-blue-500 bg-blue-50/50"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50/60"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-1">
              <span className="text-blue-600 font-bold">Click to upload</span> or drag and drop
            </p>
            <p className="text-[11px] text-gray-400">
              Documents, packing slips, drawings, photos (PDF, PNG, JPG)
            </p>
          </div>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">
                          {formatFileSize(item.size)}
                        </span>
                        {item.status === "uploading" && (
                          <span className="text-[10px] text-blue-600 font-medium">
                            Uploading {item.progress}%
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 inline" /> Uploaded
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3 inline" /> {item.error || "Failed"}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {item.status === "uploading" && (
                        <div className="w-full bg-gray-200 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Footer */}
      <div className="p-5 border-t border-gray-100 flex items-center gap-3 bg-white">
        <button
          type="button"
          onClick={onClose}
          disabled={createDeliveryMutation.isPending}
          className="flex-1 h-11 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="add-delivery-form"
          disabled={createDeliveryMutation.isPending || isUploading}
          className="flex-1 h-11 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {createDeliveryMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <span>Save Delivery</span>
          )}
        </button>
      </div>
    </>
  );
}

export default function AddDeliveryDrawer({
  open,
  onClose,
  leadId,
  initialDate,
  onSuccess,
}: AddDeliveryDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white z-70 w-full max-w-130 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {open && (
          <AddDeliveryDrawerContent
            onClose={onClose}
            leadId={leadId}
            initialDate={initialDate}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </>
  );
}
