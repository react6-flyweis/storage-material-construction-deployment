import { useState, useMemo } from "react";
import SearchIcon from "../assets/searchIcon.svg";
import PlusIcon from "../assets/plusicon.svg";
import PdfIcon from "../assets/pdficon.svg";
import EyeIcon from "../assets/EyeIcon.svg";
import DownloadIcon from "../assets/downloadicon.svg";
import DrawingModel from "../components/drawingModel";
import DrawingPreviewModal from "../components/drawingPreviewModel";
import { useSearch } from "../context/SearchContext";
import SuccessModal from "../components/common/SuccessModal";
import { useQuery } from "@tanstack/react-query";
import { getDrawingsApi, getConstructionMediaApi } from "../api/projects.api";
import { Film, ImageIcon, FileText } from "lucide-react";

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  status: string;
  key?: string;
  type?: "photo" | "video" | "drawing" | string;
  uploadedAt?: string;
};

type UnifiedProject = {
  leadId: string;
  name: string;
  code: string;
  uploadedBy: string;
  location: string;
  updatedOn: string;
  photoCount: number;
  videoCount: number;
  mediaFiles: UploadedFile[];
  drawingFiles: UploadedFile[];
  allFiles: UploadedFile[];
};

const statusStyle: Record<string, string> = {
  "Pending Review": "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  "Revision Required": "bg-red-100 text-red-600",
  Drawing: "bg-blue-100 text-blue-700",
  Contract: "bg-purple-100 text-purple-700",
  Approval: "bg-green-100 text-green-700",
  photo: "bg-blue-50 text-blue-700 border border-blue-200",
  video: "bg-purple-50 text-purple-700 border border-purple-200",
};

function formatLocation(loc: unknown): string {
  if (!loc) return "—";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && loc !== null) {
    const obj = loc as Record<string, unknown>;
    const parts = [obj.address, obj.city, obj.state].filter(Boolean);
    if (parts.length > 0) return parts.map(String).join(", ");
    if (obj.name && typeof obj.name === "string") return obj.name;
  }
  return "—";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-GB");
  } catch {
    return dateStr;
  }
}

export default function DrawingAttachment() {
  const [openDrawingPreviewModel, setDrawingPreviewModel] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<{
    name: string;
    code: string;
    uploadedBy: string;
    location: string;
    updatedOn: string;
  } | null>(null);

  const { search } = useSearch();
  const [localSearch, setLocalSearch] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [openDrawingModel, setDrawingModel] = useState(false);
  const [uploadTargetLeadId, setUploadTargetLeadId] = useState<string>("");

  // Tab & media filtering: "media" | "drawings" | "all"
  const [activeTab, setActiveTab] = useState<"media" | "drawings" | "all">(
    "media",
  );
  const [mediaTypeFilter, setMediaTypeFilter] = useState<
    "all" | "photo" | "video"
  >("all");

  // Query 1: Construction Media API (GET /api/construction/media)
  const {
    data: mediaData,
    isLoading: isMediaLoading,
    refetch: refetchMedia,
  } = useQuery({
    queryKey: ["construction-media", mediaTypeFilter, localSearch],
    queryFn: () =>
      getConstructionMediaApi({
        type: mediaTypeFilter === "all" ? undefined : mediaTypeFilter,
        search: localSearch || undefined,
      }),
  });

  // Query 2: Drawings list (GET /api/construction/drawings - unchanged)
  const {
    data: drawingsData,
    isLoading: isDrawingsLoading,
    refetch: refetchDrawings,
  } = useQuery({
    queryKey: ["drawings"],
    queryFn: getDrawingsApi,
  });

  const isLoading = isMediaLoading || isDrawingsLoading;

  // Process and unify projects from both endpoints
  const unifiedProjects = useMemo(() => {
    const projectMap = new Map<string, UnifiedProject>();

    // 1. Ingest media projects (GET /api/construction/media)
    const mediaProjects = mediaData?.data?.data?.projects || [];
    for (const mp of mediaProjects) {
      const key = mp.leadId || mp.projectId || "unknown";
      const mediaList: UploadedFile[] = (mp.documents || []).map((doc) => ({
        id: doc._id || crypto.randomUUID(),
        name: doc.name || "Untitled Media",
        size: doc.size || "-",
        status:
          doc.approvalStatus || (doc.type === "video" ? "Video" : "Photo"),
        key: doc.url,
        type: doc.type as "photo" | "video",
        uploadedAt: doc.uploadedAt,
      }));

      projectMap.set(key, {
        leadId: mp.leadId || "",
        name: mp.projectName || "Project —",
        code: mp.projectId || mp.leadId || "—",
        uploadedBy: "Site Construction",
        location: formatLocation(mp.location),
        updatedOn: formatDate(mp.lastUpdate),
        photoCount: mp.photoCount || (mp.photos ? mp.photos.length : 0),
        videoCount: mp.videoCount || (mp.videos ? mp.videos.length : 0),
        mediaFiles: mediaList,
        drawingFiles: [],
        allFiles: [...mediaList],
      });
    }

    // 2. Ingest drawings projects (GET /api/construction/drawings)
    const drawingProjects = drawingsData?.data?.data?.projects || [];
    for (const dp of drawingProjects) {
      const key = dp.leadId || dp.projectId || dp.projectName;
      const drawingList: UploadedFile[] = (dp.documents || []).map((d) => ({
        id: d._id || crypto.randomUUID(),
        name: d.name || "Drawing",
        size: "-",
        status: d.type
          ? d.type.charAt(0).toUpperCase() + d.type.slice(1)
          : "Approved",
        key: d.url,
        type: "drawing",
        uploadedAt: d.uploadedAt,
      }));

      if (projectMap.has(key)) {
        const existing = projectMap.get(key)!;
        existing.drawingFiles = drawingList;
        existing.allFiles = [...existing.mediaFiles, ...drawingList];
        if (dp.uploadedBy && existing.uploadedBy === "Site Construction") {
          existing.uploadedBy = dp.uploadedBy;
        }
      } else {
        projectMap.set(key, {
          leadId: dp.leadId || "",
          name: dp.projectName || "Project —",
          code: dp.projectId || dp.leadId || "—",
          uploadedBy: dp.uploadedBy || "Engineering Team",
          location: formatLocation(dp.location),
          updatedOn: formatDate(dp.lastUpdate),
          photoCount: 0,
          videoCount: 0,
          mediaFiles: [],
          drawingFiles: drawingList,
          allFiles: [...drawingList],
        });
      }
    }

    return Array.from(projectMap.values());
  }, [mediaData, drawingsData]);

  // Available projects for Upload modal selector
  const projectListForUpload = useMemo(() => {
    return unifiedProjects.map((p) => ({
      leadId: p.leadId || p.code,
      projectId: p.code,
      projectName: p.name,
    }));
  }, [unifiedProjects]);

  // Filter projects by search query and active tab
  const filteredProjects = useMemo(() => {
    const query = `${search} ${localSearch}`.trim().toLowerCase();

    return unifiedProjects
      .map((project) => {
        // Choose which files to display based on active tab
        let filesToShow: UploadedFile[] = [];
        if (activeTab === "media") {
          filesToShow = project.mediaFiles;
          if (mediaTypeFilter === "photo") {
            filesToShow = filesToShow.filter((f) => f.type === "photo");
          } else if (mediaTypeFilter === "video") {
            filesToShow = filesToShow.filter((f) => f.type === "video");
          }
        } else if (activeTab === "drawings") {
          filesToShow = project.drawingFiles;
        } else {
          filesToShow = project.allFiles;
        }

        if (!query) {
          return { ...project, displayFiles: filesToShow };
        }

        const projectMatch =
          project.name.toLowerCase().includes(query) ||
          project.code.toLowerCase().includes(query) ||
          project.uploadedBy.toLowerCase().includes(query) ||
          project.location.toLowerCase().includes(query) ||
          project.updatedOn.toLowerCase().includes(query);

        const matchedFiles = filesToShow.filter((file) =>
          file.name.toLowerCase().includes(query),
        );

        if (projectMatch) {
          return { ...project, displayFiles: filesToShow };
        }

        if (matchedFiles.length > 0) {
          return {
            ...project,
            displayFiles: matchedFiles,
          };
        }

        return null;
      })
      .filter(Boolean) as (UnifiedProject & { displayFiles: UploadedFile[] })[];
  }, [unifiedProjects, search, localSearch, activeTab, mediaTypeFilter]);

  const handleOpenUploadModal = (leadId?: string) => {
    setUploadTargetLeadId(leadId || "");
    setDrawingModel(true);
  };

  const handleUploadSuccess = () => {
    refetchMedia();
    refetchDrawings();
    setSuccessOpen(true);
  };

  const handleDirectDownload = (fileUrl?: string, fileName?: string) => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Compute total counts for tabs
  const totalMediaCount = useMemo(() => {
    return unifiedProjects.reduce((acc, p) => acc + p.mediaFiles.length, 0);
  }, [unifiedProjects]);

  const totalDrawingCount = useMemo(() => {
    return unifiedProjects.reduce((acc, p) => acc + p.drawingFiles.length, 0);
  }, [unifiedProjects]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
              Drawings & Attachments
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              View engineering drawings and upload site progress photos & videos
              for active projects.
            </p>
          </div>

          {/* Primary Action: Upload Photos & Videos (Construction Panel uploads media only) */}
          <button
            onClick={() => handleOpenUploadModal()}
            className="bg-[#3F63E1] h-[40px] flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
          >
            <img src={PlusIcon} alt="" className="w-4 h-4" />
            Upload Photos & Videos
          </button>
        </div>

        {/* Main Tabs (Outside of card) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB] gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-white text-[#3F63E1] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Files
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "all"
                    ? "bg-blue-50 text-[#3F63E1]"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {totalMediaCount + totalDrawingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "media"
                  ? "bg-white text-[#3F63E1] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Photos & Videos
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "media"
                    ? "bg-blue-50 text-[#3F63E1]"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {totalMediaCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("drawings")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "drawings"
                  ? "bg-white text-[#3F63E1] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              Drawings
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "drawings"
                    ? "bg-blue-50 text-[#3F63E1]"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {totalDrawingCount}
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Box */}
        <div className="rounded-[10px] bg-white border border-[#E5E7EB] shadow-sm overflow-hidden">
          {/* Subheader & Filters: Search in left, internal tab only in photos & videos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 lg:px-6 py-3.5 border-b border-gray-100 bg-[#FAFAFA]">
            {/* Left: Search input */}
            <div className="flex gap-2 items-center px-3 border border-[#D1D5DB] rounded-lg h-[38px] bg-white w-full sm:w-[280px]">
              <img src={SearchIcon} alt="" className="w-4 h-4 opacity-60" />
              <input
                type="text"
                placeholder="Search leads, projects, files..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="text-xs sm:text-sm outline-none w-full"
              />
            </div>

            {/* Right: Internal Tab / sub-filters only when on Photos & Videos */}
            <div className="flex items-center gap-2">
              {activeTab === "media" ? (
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter("all")}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      mediaTypeFilter === "all"
                        ? "bg-white text-gray-900 shadow-xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter("photo")}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                      mediaTypeFilter === "photo"
                        ? "bg-white text-blue-600 shadow-xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter("video")}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                      mediaTypeFilter === "video"
                        ? "bg-white text-purple-600 shadow-xs font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    Videos
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Project List */}
          <div className="space-y-6 px-4 lg:px-6 py-6">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.leadId || idx}
                className="rounded-xl p-5 sm:p-6 border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition"
              >
                {/* Project Header */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start mb-5 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900">
                        {project.name}
                      </h2>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
                        {project.code}
                      </span>
                      {project.photoCount > 0 && (
                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {project.photoCount}{" "}
                          {project.photoCount === 1 ? "Photo" : "Photos"}
                        </span>
                      )}
                      {project.videoCount > 0 && (
                        <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {project.videoCount}{" "}
                          {project.videoCount === 1 ? "Video" : "Videos"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Project-level Upload Button */}
                  <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                        Location
                      </p>
                      <p className="text-gray-900 font-medium mt-0.5">
                        {project.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                        Last Updated
                      </p>
                      <p className="text-gray-900 font-medium mt-0.5">
                        {project.updatedOn}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenUploadModal(project.leadId)}
                      className="border border-[#3F63E1] text-[#3F63E1] hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <img
                        src={PlusIcon}
                        alt=""
                        className="w-3 h-3 filter invert sepia saturate-[50] hue-rotate-[200deg]"
                      />
                      Add Media
                    </button>
                  </div>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-gray-500">
                    {activeTab === "media"
                      ? "Site Photos & Videos"
                      : activeTab === "drawings"
                        ? "Engineering & Fabrication Drawings"
                        : "Project Attachments & Drawings"}
                  </p>
                  <span className="text-xs text-gray-500">
                    {project.displayFiles.length}{" "}
                    {project.displayFiles.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* File / Media Grid */}
                {project.displayFiles.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50">
                    <p className="text-xs text-gray-500">
                      No{" "}
                      {activeTab === "drawings"
                        ? "drawings"
                        : "photos or videos"}{" "}
                      available for this project.
                    </p>
                    <button
                      onClick={() => handleOpenUploadModal(project.leadId)}
                      className="mt-2 text-xs font-semibold text-[#3F63E1] hover:underline"
                    >
                      + Upload photo or video for this project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.displayFiles.map((file) => {
                      const isVideoFile =
                        file.type === "video" ||
                        Boolean(
                          file.name
                            ?.toLowerCase()
                            .match(/\.(mp4|mov|webm|avi|mkv)$/),
                        );
                      const isPhotoFile =
                        file.type === "photo" ||
                        Boolean(
                          file.name
                            ?.toLowerCase()
                            .match(/\.(jpg|jpeg|png|webp|gif|svg)$/),
                        );

                      return (
                        <div
                          key={file.id}
                          className="relative group flex flex-col justify-between rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm p-4 transition"
                        >
                          {/* File Header */}
                          <div className="flex items-start gap-3">
                            {/* Icon or Thumbnail */}
                            <div className="min-w-10 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                              {isPhotoFile && file.key ? (
                                <img
                                  src={file.key}
                                  alt={file.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      "none";
                                  }}
                                />
                              ) : isVideoFile ? (
                                <div className="w-full h-full bg-purple-100 text-purple-700 flex items-center justify-center rounded-lg">
                                  <Film className="w-5 h-5" />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-red-50 text-red-600 flex items-center justify-center rounded-lg">
                                  <img
                                    src={PdfIcon}
                                    alt="PDF"
                                    className="w-5 h-5"
                                  />
                                </div>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0 pr-12">
                              <p
                                className="text-sm font-semibold text-gray-900 truncate"
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>
                                  {file.size !== "-"
                                    ? file.size
                                    : isVideoFile
                                      ? "Video"
                                      : isPhotoFile
                                        ? "Photo"
                                        : "Drawing"}
                                </span>
                                {file.uploadedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{formatDate(file.uploadedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions & Status */}
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                statusStyle[file.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {file.status}
                            </span>

                            <div className="flex items-center gap-2">
                              {file.key && (
                                <button
                                  type="button"
                                  title="Download"
                                  onClick={() =>
                                    handleDirectDownload(file.key, file.name)
                                  }
                                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                                >
                                  <img
                                    src={DownloadIcon}
                                    alt="Download"
                                    className="w-4 h-4"
                                  />
                                </button>
                              )}

                              <button
                                type="button"
                                title="Preview"
                                onClick={() => {
                                  setSelectedFile(file);
                                  setSelectedProject({
                                    name: project.name,
                                    code: project.code,
                                    uploadedBy: project.uploadedBy,
                                    location: project.location,
                                    updatedOn: project.updatedOn,
                                  });
                                  setSelectedFileId(file.key ?? file.id);
                                  setDrawingPreviewModel(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                              >
                                <img
                                  src={EyeIcon}
                                  alt="Preview"
                                  className="w-4 h-4"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading ? (
              <div className="text-center py-12 space-y-3">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#3F63E1]" />
                <p className="text-sm text-gray-500">
                  Loading projects and attachments...
                </p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  No projects found
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Try adjusting your search criteria or upload photos/videos for
                  a project.
                </p>
                <button
                  onClick={() => handleOpenUploadModal()}
                  className="mt-4 bg-[#3F63E1] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Upload Photos & Videos
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Upload Media Modal (Photos & Videos Only) */}
      <DrawingModel
        open={openDrawingModel}
        onClose={() => setDrawingModel(false)}
        onSuccess={handleUploadSuccess}
        defaultLeadId={uploadTargetLeadId}
        projectList={projectListForUpload}
      />

      {/* Success Modal */}
      <SuccessModal
        open={successOpen}
        title="Photo/Video Uploaded Successfully"
        onClose={() => setSuccessOpen(false)}
      />

      {/* Preview Modal for Photos, Videos, and Drawings */}
      <DrawingPreviewModal
        open={openDrawingPreviewModel}
        fileId={selectedFileId ?? ""}
        onClose={() => {
          setDrawingPreviewModel(false);
          setSelectedFile(null);
          setSelectedProject(null);
        }}
        file={selectedFile}
        project={selectedProject}
      />
    </>
  );
}
