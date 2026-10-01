import React, { useState } from "react";
import type { WorkLogItem } from "../../types/projects.types";
import {
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ImageIcon,
} from "lucide-react";
import PhotoLightboxModal from "./PhotoLightboxModal";

interface WorkLogsTableProps {
  logs: WorkLogItem[];
  onViewDetails: (log: WorkLogItem) => void;
}

export default function WorkLogsTable({
  logs,
  onViewDetails,
}: WorkLogsTableProps) {
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openPhotos = (photos: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setLightboxPhotos(photos);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Linked Task</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4 min-w-[200px]">Description</th>
                <th className="py-3.5 px-4">Photos</th>
                <th className="py-3.5 px-4">Issues / Notes</th>
                <th className="py-3.5 px-4">Logged By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {logs.map((log) => {
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

                const d = new Date(log.date);
                const dateStr = !isNaN(d.getTime())
                  ? d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : log.date;

                return (
                  <tr
                    key={log._id}
                    onClick={() => onViewDetails(log)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{dateStr}</span>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{projectName}</span>
                      </div>
                      {jobId && (
                        <span className="text-[11px] text-gray-400">
                          #{jobId}
                        </span>
                      )}
                    </td>

                    {/* Linked Task */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {taskTitle ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 max-w-[170px] truncate">
                          <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{taskTitle}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          General
                        </span>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden shrink-0">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {progress}%
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <p className="line-clamp-2 text-xs text-gray-600 max-w-[280px]">
                        {log.description || "—"}
                      </p>
                    </td>

                    {/* Photos */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {photos.length > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => openPhotos(photos, e)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Issues / Notes */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.issues ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 max-w-[160px] truncate">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{log.issues}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Logged By */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600">
                      <span className="font-medium text-gray-800 truncate max-w-[120px] block">
                        {authorName}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(log);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox for Photos in Table View */}
      <PhotoLightboxModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={lightboxPhotos}
      />
    </>
  );
}
