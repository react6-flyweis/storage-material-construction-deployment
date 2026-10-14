import React, { useState, useRef } from "react";
import { Calendar, Camera, X, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/common/Modal";
import SuccessModal from "@/components/common/SuccessModal";
import type { ProjectConstructionTaskItem } from "./types";
import { updateProjectStepApi, createTaskApi } from "@/api/projects.api";

interface AddConstructionTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAddTask?: (task: ProjectConstructionTaskItem) => void;
  leadId?: string;
  projectId?: string;
}

const COMMON_CONSTRUCTION_STEPS = [
  "Site Preparation & Foundation",
  "Steel Structure Erection",
  "Roofing Installation",
  "Secondary Framing Installation",
  "Wall Cladding & Sheeting",
  "Insulation Installation",
  "Door & Window Installation",
  "Trim, Flashing & Gutters",
  "Interior Partitions & Concrete Slab",
  "Final Inspection & Handover",
];

export const AddConstructionTaskModal: React.FC<
  AddConstructionTaskModalProps
> = ({ open, onClose, onAddTask, leadId, projectId }) => {
  const queryClient = useQueryClient();
  const effectiveLeadId = leadId || projectId;

  const [step, setStep] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estEndDate, setEstEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const estEndDateInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setStep("");
    setStartDate("");
    setEstEndDate("");
    setDescription("");
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setIsSubmitting(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...photoFiles, ...files];
    setPhotoFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index]);
      return updated.filter((_, i) => i !== index);
    });
  };

  const formatToDisplayDate = (val: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step.trim()) return;

    setIsSubmitting(true);
    try {
      const stepKey = step
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      if (effectiveLeadId) {
        try {
          await updateProjectStepApi(effectiveLeadId, stepKey, {
            status: "in_progress",
            startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
            expectedCompletion: estEndDate ? new Date(estEndDate).toISOString() : null,
            notes: description.trim(),
            percentComplete: 0,
            completionPct: 0,
          });
        } catch {
          try {
            await createTaskApi({
              title: step.trim(),
              description: description.trim(),
              leadId: effectiveLeadId,
              assignedTo: null,
              priority: "medium",
              status: "in_progress",
              dueDate: estEndDate ? new Date(estEndDate).toISOString() : new Date().toISOString(),
            });
          } catch (taskErr) {
            console.warn("Task API fallback notice:", taskErr);
          }
        }
      }

      // Invalidate queries to get fresh data from server (NO local state mutation!)
      await queryClient.invalidateQueries({ queryKey: ["construction-phases"] });
      await queryClient.invalidateQueries({ queryKey: ["project-details"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (effectiveLeadId) {
        await queryClient.refetchQueries({ queryKey: ["construction-phases", effectiveLeadId] });
      }

      if (onAddTask) {
        onAddTask({
          id: stepKey || `task-${Date.now()}`,
          stepKey,
          title: step.trim(),
          startDate: formatToDisplayDate(startDate) || "Scheduled",
          estEndDate: formatToDisplayDate(estEndDate) || "TBD",
          status: "in_progress",
          statusLabel: "In Progress",
          statusBadgeColor: "blue",
          description: description.trim(),
          photos: photoPreviews,
        });
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        open={open && !showSuccessModal}
        onClose={handleModalClose}
        containerClassName="p-0 max-w-lg max-h-[90vh] overflow-y-auto"
      >
      {/* Modal Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Add Task</h3>
        <button
          type="button"
          onClick={handleModalClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Step Input */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Step
          </label>
          <input
            type="text"
            list="step-suggestions"
            value={step}
            onChange={(e) => setStep(e.target.value)}
            placeholder="Site Preparation & Foundat..."
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 placeholder:text-gray-400 transition"
          />
          <datalist id="step-suggestions">
            {COMMON_CONSTRUCTION_STEPS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Start Date & EST End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Start Date
            </label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                try {
                  startDateInputRef.current?.showPicker?.();
                } catch {
                  // Fallback
                }
              }}
            >
              <input
                ref={startDateInputRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white pr-10 cursor-pointer transition"
              />
              <Calendar className="w-4 h-4 text-gray-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              EST End Date
            </label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                try {
                  estEndDateInputRef.current?.showPicker?.();
                } catch {
                  // Fallback
                }
              }}
            >
              <input
                ref={estEndDateInputRef}
                type="date"
                value={estEndDate}
                onChange={(e) => setEstEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 bg-white pr-10 cursor-pointer transition"
              />
              <Calendar className="w-4 h-4 text-gray-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Work Description */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Work Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work completed today..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-900 placeholder:text-gray-400 resize-none transition"
          />
        </div>

        {/* Upload Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Upload Photos
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png, image/jpeg, image/jpg"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center mb-2 transition">
              <Camera className="w-6 h-6 text-gray-500 group-hover:text-blue-600 stroke-[1.5]" />
            </div>
            <p className="text-sm text-gray-600 font-medium group-hover:text-blue-700">
              Click to upload photos or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              PNG,JPG up to 10MB each
            </p>
          </div>

          {/* Uploaded Photos Previews */}
          {photoPreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photoPreviews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={url}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(idx);
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleModalClose}
            className="px-6 py-2.5 rounded-xl bg-[#E5E7EB] hover:bg-gray-300 text-gray-800 text-sm font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !step.trim()}
            className="px-8 py-2.5 rounded-xl bg-brand-accent hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <span>Add</span>
            )}
          </button>
        </div>
      </form>
    </Modal>

    <SuccessModal
      open={showSuccessModal}
      title="Task Added Successfully"
      onClose={() => {
        setShowSuccessModal(false);
        handleModalClose();
      }}
    />
  </>
  );
};
