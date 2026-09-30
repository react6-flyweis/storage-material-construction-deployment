import CloseIcon from "../assets/closeicon.svg";
import DownloadIcon from "../assets/downloadicon.svg";
import LinkIcon from "../assets/linkicon.svg";
import PendingImg from "../assets/drawingpreview.png";
import ApprovedImg from "../assets/approvedimg.png";
import RevisionImg from "../assets/revisionimg.png";
import Modal from "./common/Modal";

type DrawingPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  fileId: string;
  file: {
    id: string;
    name: string;
    size: string;
    status: string;
    key?: string;
    type?: string;
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
                <p className="text-[#6B7280] max-w-[200px] min-w-[100px]">Uploaded By</p>
                <p>{project?.uploadedBy || "—"}</p>
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
            alt=""
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

        <div className="lg:px-6 px-3 py-4 flex sm:flex-row flex-col gap-3 sm:justify-between items-end sm:items-center border-t">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-1.5 rounded-full w-fit hover:bg-blue-700 transition"
          >
            <img src={DownloadIcon} className="brightness-[10]" alt="" />
            Download
          </button>

          <div className="flex gap-3 items-center">
            {currentStatus !== "Pending Review" && currentStatus !== "Pending" && (
              <>
                <p className="text-black text-sm">{project?.updatedOn || "—"}</p>
              </>
            )}
            {currentStatus !== "Approved" && (
              <button className="bg-[#F59E0B] text-white px-6 py-1 rounded-full">
                {currentStatus === "Revision Required" || currentStatus === "Revision"
                  ? "Sent for Revision"
                  : "Revision Required"}
              </button>
            )}
            {currentStatus !== "Revision Required" && currentStatus !== "Revision" && (
              <button className="bg-[#22C55E] text-white px-6 py-1 rounded-full">
                {currentStatus === "Approved" ? "Approved" : "Approve"}
              </button>
            )}
          </div>
        </div>
        {(currentStatus === "Pending Review" || currentStatus === "Pending") && (
          <div className="lg:px-6 px-3 py-3 border-t flex sm:gap-4 gap-2 items-center">
            <div className="h-[40px] border rounded-lg flex items-center gap-1 flex-1 sm:px-4 px-2">
              <input
                placeholder="Type your Comment..."
                className="flex-1 outline-none"
              />
              <img src={LinkIcon} alt="" />
            </div>
            <button className="bg-[#2563EB] text-white sm:px-6 px-3 py-2 h-10 rounded-lg">
              Send <span className="hidden sm:inline-block">Comment</span>
            </button>
          </div>
        )}
    </Modal>
  );
}
