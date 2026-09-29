import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Eye,
  ArrowDown,
  FileText,
  Upload,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjectDetailsApi, getProjectDrawingsApi } from "@/api/projects.api";
import filePdfIcon from "@/assets/pdficon.svg";
import {
  type DrawingStatusType,
  statusStyles,
  normalizeDrawingStatus,
  formatDateTime,
  isImageFile,
  downloadFile,
} from "@/utils/drawings.utils";

export interface DrawingItem {
  id: string;
  name: string;
  version: string;
  versionNumber: number;
  status: DrawingStatusType;
  rawStatus: string;
  rejectionReason?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  reviewedAt?: string;
  uploadedBy?: string;
  location?: string;
  type: "drawing" | "photo";
}

export interface BuildingDrawingGroup {
  buildingId: string;
  buildingNumber: number;
  status: DrawingStatusType;
  drawings: DrawingItem[];
}

export default function ProjectDrawingsPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectId = paramId || searchParams.get("id") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Local state to store uploaded drawings on the fly
  const [localBuildings, setLocalBuildings] = useState<BuildingDrawingGroup[]>([]);

  // Fetch project details
  const { data: projectRes } = useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => getProjectDetailsApi(projectId),
    enabled: Boolean(projectId),
  });

  // Fetch drawings from API
  const { data: drawingsRes, isLoading: isDrawingsLoading } = useQuery({
    queryKey: ["project-drawings", projectId],
    queryFn: () => getProjectDrawingsApi(projectId),
    enabled: Boolean(projectId),
    retry: false,
  });

  const projectData = projectRes?.data?.data?.project;
  const projectName = projectData?.projectName || projectData?.jobId || "Project";

  // Merge API data with local uploads
  const allBuildings = useMemo(() => {
    const apiBuildingsData = drawingsRes?.data?.data?.buildings;
    if (Array.isArray(apiBuildingsData)) {
      if (apiBuildingsData.length === 0 && localBuildings.length > 0) {
        return localBuildings;
      }
      return apiBuildingsData.map((b) => ({
        buildingId: b.buildingId || `bldg-${b.buildingNumber}`,
        buildingNumber: b.buildingNumber || 1,
        status: normalizeDrawingStatus(b.latestDrawingStatus),
        drawings: (b.drawings || []).map((d) => {
          const isImg = isImageFile(d.fileName);
          const normStatus = normalizeDrawingStatus(d.status);
          return {
            id: d._id || d.fileUrl,
            name: d.fileName || "Drawing",
            version: `Version ${d.versionNumber ?? 1}`,
            versionNumber: d.versionNumber ?? 1,
            status: normStatus,
            rawStatus: d.status,
            rejectionReason: d.rejectionReason || "",
            fileUrl: d.fileUrl || "",
            thumbnailUrl: isImg ? d.fileUrl : undefined,
            uploadedAt: d.uploadedAt || "",
            reviewedAt: d.reviewedAt || "",
            uploadedBy: d.uploadedBy || "Engineer",
            location: projectData?.location || "Site Yard",
            type: "drawing" as const,
          };
        }),
      }));
    }
    return localBuildings;
  }, [drawingsRes, localBuildings, projectData]);

  const availableBuildingNumbers = useMemo(() => {
    const set = new Set(allBuildings.map((b) => b.buildingNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [allBuildings]);

  const handleOpenDrawing = (item: DrawingItem) => {
    setSelectedDrawing(item);
    setIsViewModalOpen(true);
  };

  const handleUploadSubmit = (buildingNumber: number, file: File, type: "drawing" | "photo") => {
    const newDrawing: DrawingItem = {
      id: crypto.randomUUID(),
      name: file.name,
      version: "Version 1",
      versionNumber: 1,
      status: "Pending Review",
      rawStatus: "pending_review",
      fileUrl: URL.createObjectURL(file),
      thumbnailUrl: isImageFile(file.name) ? URL.createObjectURL(file) : undefined,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Current User",
      location: projectData?.location || "Main Site",
      type,
    };

    setLocalBuildings((prev) => {
      const exists = prev.find((b) => b.buildingNumber === buildingNumber);
      if (exists) {
        return prev.map((b) =>
          b.buildingNumber === buildingNumber
            ? { ...b, drawings: [newDrawing, ...b.drawings] }
            : b
        );
      }
      return [
        ...prev,
        {
          buildingId: `bldg-${buildingNumber}`,
          buildingNumber,
          status: "Pending Review",
          drawings: [newDrawing],
        },
      ];
    });

    setIsUploadModalOpen(false);
    setIsSuccessOpen(true);
  };

  return (
    <div className="space-y-6 pb-14 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(`/projects/${projectId}`);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {projectName} - Drawings
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Drawing/Photos</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search drawings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
          />
        </div>

        {/* Status Tabs / Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-gray-100/80 p-1 rounded-lg">
          {["all", "Pending Review", "Approved", "Revision Required", "Rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === st
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {st === "all" ? "All" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isDrawingsLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Loading building drawings...</p>
        </div>
      )}

      {/* Empty State when no buildings */}
      {!isDrawingsLoading && allBuildings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 shadow-xs space-y-3">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No Drawings Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No building drawings or photos have been uploaded for this project yet.
          </p>
        </div>
      )}

      {/* Buildings Sections */}
      {!isDrawingsLoading && (
        <div className="space-y-6">
          {allBuildings.map((building) => {
            const filteredDrawings = building.drawings.filter((d: DrawingItem) => {
              const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesFilter = activeFilter === "all" || d.status === activeFilter;
              return matchesSearch && matchesFilter;
            });

            const drawingsList = filteredDrawings.filter((d: DrawingItem) => d.type === "drawing");
            const photosList = filteredDrawings.filter((d: DrawingItem) => d.type === "photo");

            const overallBadge = statusStyles[building.status] || {
              bg: "bg-gray-100",
              text: "text-gray-700",
              border: "border-gray-200",
            };

            return (
              <div
                key={building.buildingId}
                className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 shadow-xs space-y-5"
              >
                {/* Building Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Building {building.buildingNumber}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${overallBadge.bg} ${overallBadge.text} ${overallBadge.border}`}
                    >
                      {building.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {building.drawings.length} total {building.drawings.length === 1 ? "file" : "files"}
                  </span>
                </div>

                {filteredDrawings.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    No drawings match the current filter.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Drawings Subsection */}
                    {drawingsList.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Drawings ({drawingsList.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {drawingsList.map((file: DrawingItem) => {
                            const badge = statusStyles[file.status] || {
                              bg: "bg-gray-100",
                              text: "text-gray-600",
                              border: "border-gray-200",
                            };
                            return (
                              <div
                                key={file.id}
                                className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-xs relative hover:border-blue-200 transition-all flex flex-col justify-between"
                              >
                                {/* Floating status pill */}
                                <div className="absolute -top-2.5 right-3 z-10">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                                  >
                                    {file.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3.5">
                                  {file.thumbnailUrl ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                                      <img
                                        src={file.thumbnailUrl}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                      <img src={filePdfIcon} alt="PDF" className="w-6 h-6" />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 pr-1">
                                    <h5 className="text-sm font-bold text-gray-900 truncate" title={file.name}>
                                      {file.name}
                                    </h5>
                                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                      {file.version}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => downloadFile(file.fileUrl, file.name)}
                                      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors cursor-pointer"
                                      title="Download"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDrawing(file)}
                                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-full transition-colors cursor-pointer"
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Rejection reason pill if rejected */}
                                {file.status === "Rejected" && file.rejectionReason && (
                                  <div
                                    className="mt-2.5 pt-2 border-t border-red-100 flex items-center gap-1.5 text-[11px] text-red-600 font-medium"
                                    title={file.rejectionReason}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                    <span className="truncate">Reason: {file.rejectionReason}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Photos Subsection (if any uploaded as photos) */}
                    {photosList.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Photos ({photosList.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {photosList.map((file: DrawingItem) => {
                            const badge = statusStyles[file.status] || {
                              bg: "bg-gray-100",
                              text: "text-gray-600",
                              border: "border-gray-200",
                            };
                            return (
                              <div
                                key={file.id}
                                className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-xs relative hover:border-blue-200 transition-all flex flex-col justify-between"
                              >
                                <div className="absolute -top-2.5 right-3 z-10">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                                  >
                                    {file.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3.5">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-100">
                                    <img
                                      src={file.thumbnailUrl || file.fileUrl}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0 pr-1">
                                    <h5 className="text-sm font-bold text-gray-900 truncate" title={file.name}>
                                      {file.name}
                                    </h5>
                                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                      {file.version}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => downloadFile(file.fileUrl, file.name)}
                                      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors cursor-pointer"
                                      title="Download"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDrawing(file)}
                                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-full transition-colors cursor-pointer"
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {file.status === "Rejected" && file.rejectionReason && (
                                  <div
                                    className="mt-2.5 pt-2 border-t border-red-100 flex items-center gap-1.5 text-[11px] text-red-600 font-medium"
                                    title={file.rejectionReason}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                    <span className="truncate">Reason: {file.rejectionReason}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Drawing Modal */}
      {isViewModalOpen && selectedDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-gray-900">{selectedDrawing.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      statusStyles[selectedDrawing.status]?.bg || "bg-gray-100"
                    } ${statusStyles[selectedDrawing.status]?.text || "text-gray-700"} ${
                      statusStyles[selectedDrawing.status]?.border || "border-gray-200"
                    }`}
                  >
                    {selectedDrawing.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                  <span className="font-semibold text-gray-700">{selectedDrawing.version}</span>
                  <span>•</span>
                  <span>Location: {selectedDrawing.location || "Site Yard"}</span>
                  <span>•</span>
                  <span>Uploaded: {formatDateTime(selectedDrawing.uploadedAt)}</span>
                  {selectedDrawing.reviewedAt && (
                    <>
                      <span>•</span>
                      <span>Reviewed: {formatDateTime(selectedDrawing.reviewedAt)}</span>
                    </>
                  )}
                  {selectedDrawing.uploadedBy && (
                    <>
                      <span>•</span>
                      <span>By ID: {selectedDrawing.uploadedBy}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rejection Note inside Modal if Rejected */}
            {selectedDrawing.status === "Rejected" && selectedDrawing.rejectionReason && (
              <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-red-800">Drawing Rejected</h5>
                  <p className="text-xs text-red-700 mt-0.5 font-medium">
                    Reason: {selectedDrawing.rejectionReason}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Body Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC] flex items-center justify-center min-h-[350px]">
              {selectedDrawing.thumbnailUrl ||
              selectedDrawing.type === "photo" ||
              isImageFile(selectedDrawing.fileUrl || selectedDrawing.name) ? (
                <img
                  src={selectedDrawing.fileUrl}
                  alt={selectedDrawing.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-full h-[60vh] bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center p-6 text-center">
                  <FileText className="w-16 h-16 text-blue-600 mb-3" />
                  <h4 className="text-base font-bold text-gray-900 mb-1">{selectedDrawing.name}</h4>
                  <p className="text-xs text-gray-500 max-w-sm mb-4">
                    PDF Document Preview. Click download below to save and inspect the full high-res structural sheets.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadFile(selectedDrawing.fileUrl, selectedDrawing.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Download Full PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => downloadFile(selectedDrawing.fileUrl, selectedDrawing.name)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
                <span>Download File</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Drawing Modal */}
      {isUploadModalOpen && (
        <UploadDrawingModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadSubmit}
          availableBuildings={availableBuildingNumbers}
        />
      )}

      {/* Success Toast / Notification */}
      {isSuccessOpen && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span className="text-sm font-semibold">Drawing uploaded successfully!</span>
          <button
            type="button"
            onClick={() => setIsSuccessOpen(false)}
            className="p-1 hover:bg-emerald-700 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function UploadDrawingModal({
  isOpen,
  onClose,
  onSubmit,
  availableBuildings = [1, 2],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (buildingNumber: number, file: File, type: "drawing" | "photo") => void;
  availableBuildings?: number[];
}) {
  const buildingOptions = availableBuildings.length > 0 ? availableBuildings : [1];
  const [buildingNumber, setBuildingNumber] = useState<number>(buildingOptions[0]);
  const [fileType, setFileType] = useState<"drawing" | "photo">("drawing");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onSubmit(buildingNumber, selectedFile, fileType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Upload Drawing or Photos</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
              Select Building
            </label>
            <select
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {buildingOptions.map((num) => (
                <option key={num} value={num}>
                  Building {num}
                </option>
              ))}
              <option value={Math.max(...buildingOptions, 0) + 1}>
                New Building {Math.max(...buildingOptions, 0) + 1}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
              File Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFileType("drawing")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  fileType === "drawing"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Drawing (PDF/PNG)
              </button>
              <button
                type="button"
                onClick={() => setFileType("photo")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  fileType === "photo"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Site Photo (JPG/PNG)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
              Choose File
            </label>
            <input
              type="file"
              accept={fileType === "drawing" ? ".pdf,image/*" : "image/*"}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              required
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              Upload Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
