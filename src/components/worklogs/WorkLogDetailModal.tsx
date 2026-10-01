import { useState } from "react";
import Modal from "../common/Modal";
import type { WorkLogItem } from "../../types/projects.types";
import { X, ExternalLink } from "lucide-react";
import PhotoLightboxModal from "./PhotoLightboxModal";

interface WorkLogDetailModalProps {
  open: boolean;
  onClose: () => void;
  log: WorkLogItem | null;
}

export default function WorkLogDetailModal({
  open,
  onClose,
  log,
}: WorkLogDetailModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!log) return null;

  const projectName =
    typeof log.leadId === "object" && log.leadId !== null
      ? log.leadId.projectName || "Unnamed Project"
      : "Project";

  const jobId =
    typeof log.leadId === "object" && log.leadId !== null
      ? log.leadId.jobId
      : undefined;

  const taskTitle =
    typeof log.taskId === "object" && log.taskId !== null
      ? log.taskId.title
      : null;

  const authorName =
    typeof log.loggedBy === "object" && log.loggedBy !== null
      ? log.loggedBy.name || log.loggedBy.email || "Field Team"
      : typeof log.loggedBy === "string"
      ? log.loggedBy
      : "Field Team";

  const authorEmail =
    typeof log.loggedBy === "object" && log.loggedBy !== null
      ? log.loggedBy.email
      : undefined;

  const progress = typeof log.progress === "number" ? log.progress : 0;
  const photos = log.photos || [];

  const formattedDate = (() => {
    try {
      const d = new Date(log.date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // fallback
    }
    return log.date;
  })();

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        containerClassName="max-h-[95vh] max-w-[550px] overflow-auto scroll-hide p-0"
      >
        <div className="lg:px-6 px-4 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">
            Work Log Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 text-sm text-[#111827]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Date</p>
              <p className="font-semibold text-gray-800 mt-1">{formattedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Progress</p>
              <p className="font-semibold text-emerald-600 mt-1">{progress}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Project</p>
              <p className="font-semibold text-gray-800 mt-1">
                {projectName} {jobId ? `(${jobId})` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Linked Task</p>
              <p className="font-semibold text-gray-800 mt-1">
                {taskTitle || "None / General Work"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-medium">Work Description</p>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-[8px] text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
              {log.description || "No description provided."}
            </div>
          </div>

          {log.issues && (
            <div>
              <p className="text-xs text-gray-500 font-medium">Issues / Notes</p>
              <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-amber-900 whitespace-pre-wrap text-sm leading-relaxed">
                {log.issues}
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">
                Photos ({photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((src, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="relative group rounded-[8px] overflow-hidden aspect-video bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition"
                  >
                    <img
                      src={src}
                      alt={`Site photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Logged by: <strong className="text-gray-700">{authorName}</strong>{" "}
              {authorEmail && `(${authorEmail})`}
            </span>
          </div>
        </div>

        <div className="px-6 py-3 border-t bg-[#F9FAFB] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-[#F3F4F6] text-[#111827] text-sm hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Lightbox for Photos */}
      <PhotoLightboxModal
        open={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        photos={photos}
        initialIndex={selectedPhotoIndex ?? 0}
        title={`${projectName} Photo`}
      />
    </>
  );
}
