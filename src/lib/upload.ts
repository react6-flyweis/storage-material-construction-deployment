import { axiosInstance } from "@/api/axiosInstance";

export interface PresignedUrlResponseData {
  uploadUrl: string;
  fileUrl: string;
  key?: string;
}

export async function uploadFileToS3(
  file: File,
  folder: string = "chat-attachments",
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Request presigned URL from backend
  const response = await axiosInstance.post<{
    success?: boolean;
    message?: string;
    data?: PresignedUrlResponseData;
    uploadUrl?: string;
    fileUrl?: string;
  }>("/upload/presigned-url", {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    folder,
  });

  const payload = response.data?.data || response.data;
  const uploadUrl = payload?.uploadUrl;
  const fileUrl = payload?.fileUrl;

  if (!uploadUrl || !fileUrl) {
    throw new Error("Failed to retrieve upload URL from server.");
  }

  // 2. Upload file directly to S3 using uploadUrl
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during S3 upload."));
    };

    xhr.send(file);
  });

  return fileUrl;
}
