import CloseIcon from "../assets/closeicon.svg";
import DownloadIcon from "../assets/downloadicon.svg";
import PendingImg from "../assets/drawingpreview.png";
import ApprovedImg from "../assets/approvedimg.png";
import RevisionImg from "../assets/revisionimg.png";
import Modal from "./common/Modal";

export interface DrawingCommentUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface DrawingComment {
  _id?: string;
  text?: string;
  comment?: string;
  commentedBy?: string | DrawingCommentUser | null;
  commentedByCustomer?: DrawingCommentUser | null;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DrawingPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  fileId: string;
  file: {
    id: string;
    name: string;
    size?: string;
    status: string;
    key?: string;
    type?: string;
    rejectionReason?: string;
    customerSuggestions?: string;
    comments?: DrawingComment[];
    uploadedAt?: string;
  } | null;
  project?: {
    name: string;
    code: string;
    uploadedBy: string;
    location: string;
    updatedOn: string;
  } | null;
};

export default function DrawingPreviewModal({
  open,
  onClose,
  fileId,
  file,
  project,
}: DrawingPreviewModalProps) {
  const currentStatus = file?.status || fileId;
  const isPdf = Boolean(
    file?.type === "drawing" ||
    file?.name?.toLowerCase().endsWith(".pdf") || 
    file?.key?.toLowerCase().includes(".pdf")
  );
  const isVideo = Boolean(
    file?.type === "video" ||
    file?.name?.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv|ogg)$/i) ||
    file?.key?.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv|ogg)/i)
  );

  const getImageSrc = () => {
    if (file?.key && (file.key.startsWith("http") || file.key.startsWith("blob:"))) {
      return file.key;
    }
    if (currentStatus === "Approved") return ApprovedImg;
    if (currentStatus === "Revision Required" || currentStatus === "Revision") return RevisionImg;
    return PendingImg;
  };

  const handleDownload = () => {
    if (file?.key) {
      const a = document.createElement("a");
      a.href = file.key;
      a.download = file.name || "drawing";
      a.target = "_blank";
      a.click();
    }
  };

  const getLatestCommentText = () => {
    if (file?.comments && file.comments.length > 0) {
      const sorted = [...file.comments].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      return sorted[0]?.text || sorted[0]?.comment || "";
    }
    return file?.customerSuggestions || "";
  };

  const customerSuggestionText = getLatestCommentText();

  const getStatusBadgeStyle = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("approved")) {
      return "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]";
    }
    if (s.includes("revision") || s.includes("required") || s.includes("rejected")) {
      return "bg-[#FFF7ED] text-[#FF9409] border-[#FFEDD5]";
    }
    if (s.includes("pending")) {
      return "bg-[#FEFAE2] text-[#F0CC16] border-[#FEFAE2]";
    }
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getDisplayStatusText = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("rejected")) {
      return "Revision Requested";
    }
    return status || "Pending";
  };

  const hasRevision =
    (currentStatus &&
      (currentStatus.toLowerCase().includes("revision") ||
        currentStatus.toLowerCase().includes("required") ||
        currentStatus.toLowerCase().includes("rejected"))) ||
    Boolean(file?.rejectionReason) ||
    Boolean(customerSuggestionText);

  return (
    <Modal
      open={open}
      onClose={onClose}
      containerClassName="max-w-[1100px] max-h-[95vh] rounded-2xl overflow-auto scroll-hide"
    >
        <div className="lg:px-6 px-3 py-4 border-b flex md:items-center items-start justify-between gap-2">
          <div className="flex md:flex-row flex-col justify-start gap-4 md:items-center">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-[#111827]">
                {file?.name || project?.name || "Architectural Plans"}
              </h2>
              <p className="text-sm text-[#6B7280]">{project?.code || "—"}</p>
            </div>

            <div className="flex flex-wrap items-center lg:gap-10 gap-3 text-sm text-[#111827]">
              <div>
                <p className="text-[#6B7280] max-w-[200px] min-w-[100px]">Location</p>
                <p>{project?.location || "—"}</p>
              </div>
              <div>
                <p className="text-[#6B7280] max-w-[200px] min-w-[100px]">Last Updated</p>
                <p>{project?.updatedOn || "—"}</p>
              </div>
            </div>
          </div>

          <img
            src={CloseIcon}
            className="w-4 cursor-pointer mt-2 md:mt-0"
            onClick={onClose}
            alt="Close"
          />
        </div>

        <div className="bg-[#F9FAFB] flex justify-center items-center lg:px-6 px-3 py-4 w-full min-h-[550px]">
          {isVideo && file?.key ? (
            <video
              src={file.key}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-lg shadow-sm"
            />
          ) : isPdf && file?.key ? (
            <iframe
              src={`${file.key}#toolbar=0`}
              title={file?.name || "PDF Preview"}
              className="w-full h-[70vh] rounded-lg border border-gray-200"
            />
          ) : (
            <img
              src={getImageSrc()}
              alt={file?.name || "drawing preview"}
              className="max-h-[70vh] w-full object-contain"
            />
          )}
        </div>

        {/* Footer / Action Section as in Plant Panel */}
        <div className="lg:px-6 px-4 py-4 border-t space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <img src={DownloadIcon} className="brightness-[10]" alt="" />
              Download
            </button>

            {currentStatus && (
              <div className="flex items-center gap-3 ml-auto flex-wrap">
                {project?.updatedOn && (
                  <p className="text-gray-600 text-xs md:text-sm font-normal">
                    {project.updatedOn}
                  </p>
                )}
                <span
                  className={`px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-medium border ${getStatusBadgeStyle(
                    currentStatus
                  )}`}
                >
                  {getDisplayStatusText(currentStatus)}
                </span>
              </div>
            )}
          </div>

          {/* Revision Messages Section */}
          {hasRevision && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <h3 className="text-sm md:text-base font-bold text-gray-900">Revision Message</h3>
                <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                  {file?.rejectionReason || "—"}
                </p>
              </div>
              <div className="space-y-2 border-l-0 md:border-l border-gray-200 md:pl-6">
                <h3 className="text-sm md:text-base font-bold text-gray-900">Customer Suggestions</h3>
                <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                  {customerSuggestionText || "—"}
                </p>
              </div>
            </div>
          )}
        </div>
    </Modal>
  );
}
