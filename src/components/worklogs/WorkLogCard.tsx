import React, { useState } from "react";
import type { WorkLogItem } from "../../types/projects.types";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  User,
  ArrowRight,
} from "lucide-react";
import PhotoLightboxModal from "./PhotoLightboxModal";

interface WorkLogCardProps {
  log: WorkLogItem;
  onViewDetails: (log: WorkLogItem) => void;
}

export default function WorkLogCard({ log, onViewDetails }: WorkLogCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Formatting helpers
  const projectName =
    typeof log.leadId === "object" && log.leadId !== null
      ? log.leadId.projectName || "Project"
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

  const progress = typeof log.progress === "number" ? log.progress : 0;
  const photos = log.photos || [];

  const dateObj = new Date(log.date);
  const isValidDate = !isNaN(dateObj.getTime());

  const dayNumber = isValidDate
    ? dateObj.toLocaleDateString("en-US", { day: "2-digit" })
    : "";
  const monthName = isValidDate
    ? dateObj.toLocaleDateString("en-US", { month: "short" })
    : "";
  const weekday = isValidDate
    ? dateObj.toLocaleDateString("en-US", { weekday: "short" })
    : "";

  const openLightboxAt = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        onClick={() => onViewDetails(log)}
        className="group relative bg-white rounded-2xl border border-gray-100 hover:border-blue-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
      >
        {/* Subtle top indicator bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity"
        />

        <div>
          {/* Card Top: Date Badge, Project & Task Badges */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Date Block */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-14 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center border border-blue-100 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">
                  {monthName}
                </span>
                <span className="text-lg font-extrabold leading-none my-0.5">
                  {dayNumber}
                </span>
                <span className="text-[9px] text-gray-500 font-medium">
                  {weekday}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    <span>{projectName}</span>
                  </span>

                  {jobId && (
                    <span className="text-[11px] font-medium text-gray-400">
                      #{jobId}
                    </span>
                  )}
                </div>

                {taskTitle ? (
                  <p className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-blue-600 bg-blue-50/60 px-2 py-0.5 rounded-md border border-blue-100">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    <span className="line-clamp-1">{taskTitle}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-400 italic">
                    General Site Work
                  </p>
                )}
              </div>
            </div>

            {/* Progress Badge */}
            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span>{progress}%</span>
                <span className="text-[10px] font-normal opacity-80">done</span>
              </div>
            </div>
          </div>

          {/* Progress Mini Bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          {/* Work Description */}
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-4 font-normal">
            {log.description || "No description provided."}
          </p>

          {/* Issue Callout Banner if present */}
          {log.issues && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="line-clamp-2">
                <span className="font-bold mr-1">Issue/Delay:</span>
                <span>{log.issues}</span>
              </div>
            </div>
          )}

          {/* Photos Thumbnails Row */}
          {photos.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                {photos.slice(0, 3).map((photoSrc, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => openLightboxAt(idx, e)}
                    className="relative w-16 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 hover:opacity-90 transition cursor-pointer shadow-2xs group/img"
                  >
                    <img
                      src={photoSrc}
                      alt="Thumbnail"
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200"
                    />
                  </div>
                ))}

                {photos.length > 3 && (
                  <button
                    onClick={(e) => openLightboxAt(3, e)}
                    className="w-14 h-14 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex flex-col items-center justify-center border border-gray-200 transition cursor-pointer"
                  >
                    <span>+{photos.length - 3}</span>
                    <span className="text-[10px] text-gray-500 font-normal">more</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Author + Details Link */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-[10px]">
              <User className="w-3 h-3" />
            </div>
            <span className="font-medium text-gray-600 truncate max-w-[140px]">
              {authorName}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(log);
            }}
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Lightbox for Photos */}
      <PhotoLightboxModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={photos}
        initialIndex={activePhotoIdx}
        title={`${projectName} Site Photo`}
      />
    </>
  );
}
