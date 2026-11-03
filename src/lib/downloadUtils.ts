import type { AxiosResponse } from "axios";

/**
 * Extracts filename from Content-Disposition header if available.
 * Handles both RFC 5987 (filename*=utf-8''...) and standard (filename="...") formats.
 */
export function getFilenameFromContentDisposition(
  contentDisposition?: string,
  defaultFilename = "export.xlsx"
): string {
  if (!contentDisposition) return defaultFilename;

  const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const regularMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (regularMatch && regularMatch[1]) {
    return regularMatch[1].trim();
  }

  return defaultFilename;
}

/**
 * Triggers a browser file download from a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads a file from an Axios response configured with responseType: 'blob'.
 */
export function downloadFileFromResponse(
  response: AxiosResponse<Blob | ArrayBuffer | any>,
  fallbackFilename: string
) {
  const contentDisposition =
    response.headers?.["content-disposition"] || response.headers?.["Content-Disposition"];
  const filename = getFilenameFromContentDisposition(contentDisposition, fallbackFilename);

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

  triggerBlobDownload(blob, filename);
}
