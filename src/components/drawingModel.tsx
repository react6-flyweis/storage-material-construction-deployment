import { useEffect, useMemo, useRef, useState } from "react";
import UploadIcon from "../assets/uploadicon copy.svg";
import CloseIcon from "../assets/closeicon.svg";
import CustomSelect from "./common/CustomSelect";
import Modal from "./common/Modal";
import {
  uploadConstructionMediaFlow,
  getProjectsApi,
} from "../api/projects.api";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

const maxMediaSizeMB = 200;

export type DrawingModelProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmit?: (data: {
    file: File;
    projectCode: string;
    projectName: string;
    leadId: string;
    mediaType: "photo" | "video";
    fileUrl?: string;
  }) => void;
  defaultLeadId?: string;
  projectList?: {
    leadId: string;
    projectId?: string;
    projectName: string;
  }[];
};

export default function DrawingModel({
  open,
  onClose,
  onSuccess,
  onSubmit,
  defaultLeadId,
  projectList,
}: DrawingModelProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const shouldFetchProjects =
    open && (!projectList || projectList.length === 0);
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["construction-projects-list"],
    queryFn: () => getProjectsApi({ limit: 100 }),
    enabled: shouldFetchProjects,
  });

  // Clean up object url preview on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const activeProjects = useMemo(() => {
    if (projectList && projectList.length > 0) {
      return projectList;
    }
    return (projectsData?.data?.data?.projects || []).map((p) => ({
      leadId: p.leadId || p._id,
      projectId: p.jobId || p._id,
      projectName: p.projectName || "Unnamed Project",
    }));
  }, [projectList, projectsData]);

  const targetLeadId =
    selectedLeadId || defaultLeadId || activeProjects[0]?.leadId || "";

  const projectFilterOptions = useMemo(() => {
    return activeProjects.map((p) => ({
      label: `${p.projectName} (${p.projectId || p.leadId})`,
      value: p.leadId,
    }));
  }, [activeProjects]);

  if (!open) return null;

  const isVideo = file
    ? file.type.startsWith("video/") ||
      /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name)
    : false;

  const handleFile = (selectedFile: File) => {
    setError(null);

    const isVid =
      selectedFile.type.startsWith("video/") ||
      /\.(mp4|mov|avi|webm|mkv)$/i.test(selectedFile.name);
    const isImg =
      selectedFile.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg|heic)$/i.test(selectedFile.name);

    if (!isVid && !isImg) {
      setError(
        "Only photos (JPG, PNG, WEBP, etc.) and videos (MP4, MOV, WEBM, etc.) are allowed.",
      );
      return;
    }

    if (selectedFile.size > maxMediaSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum allowed ${maxMediaSizeMB}MB limit.`);
      return;
    }

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    setFile(selectedFile);
    if (isImg) {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      setFilePreview(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setError(null);
    setUploadProgress(0);
    setUploadStep("");
    setSelectedLeadId("");
  };

  const handleModalClose = () => {
    if (isUploading) return;
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a photo or video to upload");
      return;
    }

    if (!targetLeadId) {
      setError("Please select a project to attach this media to");
      return;
    }

    const currentProject = activeProjects.find(
      (p) => p.leadId === targetLeadId,
    );
    const mediaType: "photo" | "video" = isVideo ? "video" : "photo";

    setIsUploading(true);
    setError(null);
    setUploadProgress(5);
    setUploadStep("Requesting secure upload URL...");

    try {
      setUploadStep("Uploading file to cloud storage...");
      const result = await uploadConstructionMediaFlow({
        file,
        leadId: targetLeadId,
        onProgress: (percent) => {
          setUploadProgress(Math.max(10, Math.min(95, percent)));
        },
      });

      setUploadProgress(100);
      setUploadStep("Attaching media to project...");

      toast.success(
        `${mediaType === "video" ? "Video" : "Photo"} uploaded successfully!`,
      );

      if (onSubmit) {
        onSubmit({
          file,
          projectCode: currentProject?.projectId || targetLeadId,
          projectName: currentProject?.projectName || "Project",
          leadId: targetLeadId,
          mediaType,
          fileUrl: result?.data?.document?.url,
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      handleReset();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to upload file. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      containerClassName="max-w-[540px] w-full p-0"
    >
      <div className="lg:px-6 px-4 py-4 border-b flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">
            Upload Photos & Videos
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Attach site progress photos and walkthrough videos to this project
          </p>
        </div>
        {!isUploading && (
          <img
            src={CloseIcon}
            alt="Close"
            className="w-3.5 cursor-pointer opacity-70 hover:opacity-100 transition"
            onClick={handleModalClose}
          />
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Project Selector */}
        <div>
          <label className="text-sm font-medium text-[#111827] mb-1.5 block">
            Target Project <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            title="Select Project"
            options={projectFilterOptions}
            value={targetLeadId}
            onChange={(val) => {
              setSelectedLeadId(val);
              setError(null);
            }}
            width="100%"
            searchable
            disabled={isUploading || isLoadingProjects}
            loading={isLoadingProjects}
          />
        </div>

        {/* Drag and Drop Box */}
        <div>
          <label className="text-sm font-medium text-[#111827] mb-1.5 block">
            Media File (Photo or Video) <span className="text-red-500">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 transition ${
              isUploading
                ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                : "border-[#D1D5DB] hover:border-[#3F63E1] bg-[#F9FAFB] cursor-pointer"
            }`}
            onClick={() => {
              if (!isUploading) inputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#3F63E1]">
                  <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Supports Photos (JPG, PNG, WEBP) & Videos (MP4, MOV, WEBM)
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Max size: {maxMediaSizeMB} MB
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-[#3F63E1] text-white px-5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                >
                  Select File
                </button>
              </>
            ) : (
              <div className="w-full flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 text-left">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
                    {isVideo ? "VIDEO" : "FILE"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#111827] truncate">
                      {file.name}
                    </p>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        isVideo
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isVideo ? "Video" : "Photo"}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
                  >
                    Change
                  </button>
                )}
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleChange}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-blue-900">{uploadStep}</span>
              <span className="font-semibold text-blue-700">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#3F63E1] h-full transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="text-[11px] text-[#6B7280] bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <span className="font-medium text-[#374151]">Note:</span> Site
          attachments and media (photos & videos) are uploaded directly from
          this panel. Construction and structural drawings are managed via
          engineering releases.
        </div>
      </div>

      <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-xl">
        <button
          type="button"
          disabled={isUploading}
          onClick={handleModalClose}
          className="px-5 py-2 rounded-lg bg-white border border-[#D1D5DB] text-sm text-[#374151] hover:bg-gray-100 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isUploading || !file || !targetLeadId}
          onClick={handleSubmit}
          className="px-6 py-2 rounded-lg bg-[#3F63E1] text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Uploading...</span>
            </>
          ) : (
            <span>Upload Media</span>
          )}
        </button>
      </div>
    </Modal>
  );
}
