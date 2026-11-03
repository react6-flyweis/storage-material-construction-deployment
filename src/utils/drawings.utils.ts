export type DrawingStatusType = "Pending Review" | "Approved" | "Revision Required" | "Rejected";

export const statusStyles: Record<DrawingStatusType, { bg: string; text: string; border: string }> = {
  "Pending Review": { bg: "bg-[#FEFAE2]", text: "text-[#D97706]", border: "border-[#FEF08A]" },
  "Approved": { bg: "bg-[#DCFCE7]", text: "text-[#16A34A]", border: "border-[#BBF7D0]" },
  "Revision Required": { bg: "bg-[#FFF7ED]", text: "text-[#EA580C]", border: "border-[#FFEDD5]" },
  "Rejected": { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", border: "border-[#FECACA]" },
};

export function normalizeDrawingStatus(status?: string): DrawingStatusType {
  if (!status) return "Pending Review";
  const s = status.toLowerCase().replace(/[-_]/g, " ").trim();
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s.includes("revision") || s.includes("change")) return "Revision Required";
  if (s.includes("pending")) return "Pending Review";
  return "Pending Review";
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function isImageFile(fileName?: string): boolean {
  if (!fileName) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg|heic)$/i.test(fileName);
}

export function isVideoFile(fileName?: string): boolean {
  if (!fileName) return false;
  return /\.(mp4|mov|webm|avi|mkv|ogg)$/i.test(fileName);
}

export function downloadFile(fileUrl: string, name: string): void {
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = name;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
