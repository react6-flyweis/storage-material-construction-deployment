import type { AxiosError } from "axios";
import { axiosInstance } from "./axiosInstance";
import type {
  ProjectsApiResponse,
  ProjectDetailsApiResponse,
  CalendarApiResponse,
  DrawingsApiResponse,
  TasksApiResponse,
  DeliveriesApiResponse,
  DeliveriesQueryParams,
  DeliveryFiltersApiResponse,
  DeliveryDetailsApiResponse,
  LabelsApiResponse,
  LabelsQueryParams,
  BundleScanApiResponse,
  BundleScanQueryParams,
  PackingListApiResponse,
  PackingListsQueryParams,
  PackingListDetailApiResponse,
  DispatchVerificationApiResponse,
  DispatchVerificationDetailApiResponse,
  DispatchVerificationQueryParams,
  MaterialRequestsApiResponse,
  MaterialRequestsQueryParams,
  MaterialRequestsFiltersApiResponse,
  MaterialRequest,
  BundleDetailsApiResponse,
  DashboardApiResponse,
  DashboardFiltersApiResponse,
  DashboardQueryParams,
  ConsolidatedBOMApiResponse,
  BuildingDrawingsApiResponse,
  PresignedUrlPayload,
  PresignedUrlApiResponse,
  AttachMediaPayload,
  AttachMediaApiResponse,
  ConstructionMediaQueryParams,
  ConstructionMediaApiResponse,
  ConstructionMediaProject,
  MediaDocument,
  CreateDeliveryPayload,
  CreateDeliveryApiResponse,
  WorkLogsApiResponse,
  GetWorkLogsParams,
} from "../types/projects.types";

export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  hasDelivery?: boolean | number | string;
}

export interface CalendarQueryParams {
  month: number;
  year: number;
  leadId?: string;
  projectId?: string;
}

export const getProjectsApi = (params?: ProjectsQueryParams) => {
  return axiosInstance.get<ProjectsApiResponse>("/construction/projects", { params });
};

export const getProjectDetailsApi = (id: string) => {
  return axiosInstance.get<ProjectDetailsApiResponse>(`/construction/projects/${id}`);
};

export const getCalendarApi = (params: CalendarQueryParams) => {
  return axiosInstance.get<CalendarApiResponse>("/construction/projects/calendar", { params });
};

export const getDrawingsApi = () => {
  return axiosInstance.get<DrawingsApiResponse>("/construction/drawings");
};

export type { ConstructionMediaProject, MediaDocument };

// 1. Presigned URL for media uploads (Step A)
export const getPresignedUrlApi = async (payload: PresignedUrlPayload) => {
  try {
    return await axiosInstance.post<PresignedUrlApiResponse>("/common/upload/presigned-url", payload);
  } catch (err: unknown) {
    const axiosErr = err as AxiosError;
    if (axiosErr?.response?.status === 404) {
      return await axiosInstance.post<PresignedUrlApiResponse>("/upload/presigned-url", payload);
    }
    throw err;
  }
};

// 2. PUT file to S3 (Step B)
export const uploadFileToS3Direct = async (
  uploadUrl: string,
  file: File,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", fileType || "application/octet-stream");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
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
};

// 3. Attach media to lead in Construction panel (Step C)
export const attachConstructionMediaApi = (leadId: string, payload: AttachMediaPayload) => {
  return axiosInstance.post<AttachMediaApiResponse>(`/construction/media/${leadId}`, payload);
};

// Combined 3-step media upload flow
export const uploadConstructionMediaFlow = async ({
  file,
  leadId,
  onProgress,
}: {
  file: File;
  leadId: string;
  onProgress?: (progress: number) => void;
}) => {
  const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
  const mediaType: "photo" | "video" = isVideo ? "video" : "photo";
  const fileType = file.type || (isVideo ? "video/mp4" : "image/jpeg");

  // Step A: Presigned URL
  const presignedRes = await getPresignedUrlApi({
    fileName: file.name,
    fileType,
    folder: "media",
  });

  const uploadData = presignedRes.data.data;
  const uploadUrl = uploadData?.uploadUrl;
  const fileUrl = uploadData?.fileUrl;

  if (!uploadUrl || !fileUrl) {
    throw new Error("Failed to obtain upload URL from server.");
  }

  // Step B: PUT file to S3
  await uploadFileToS3Direct(uploadUrl, file, fileType, onProgress);

  // Step C: Attach to lead in Construction panel
  const attachRes = await attachConstructionMediaApi(leadId, {
    url: fileUrl,
    name: file.name,
    type: mediaType,
  });

  return attachRes.data;
};

// Construction panel — list all projects + photos & videos
export const getConstructionMediaApi = (params?: ConstructionMediaQueryParams) => {
  return axiosInstance.get<ConstructionMediaApiResponse>("/construction/media", { params });
};

// Get one lead's photos & videos
export const getConstructionLeadMediaApi = (leadId: string) => {
  return axiosInstance.get<ConstructionMediaApiResponse>(`/construction/media/${leadId}`);
};

export const getTasksApi = () => {
  return axiosInstance.get<TasksApiResponse>("/construction/tasks");
};

export const getDeliveriesApi = (params?: DeliveriesQueryParams) => {
  return axiosInstance.get<DeliveriesApiResponse>("/construction/deliveries", { params });
};

export const getDeliveryFiltersApi = () => {
  return axiosInstance.get<DeliveryFiltersApiResponse>("/construction/deliveries/filters");
};

export const exportDeliveriesApi = (params?: DeliveriesQueryParams) => {
  return axiosInstance.get("/construction/deliveries/export", {
    params,
    responseType: "blob",
  });
};

export const createDeliveryApi = (payload: CreateDeliveryPayload) => {
  return axiosInstance.post<CreateDeliveryApiResponse>("/construction/deliveries", payload);
};

export type { CreateDeliveryPayload, CreateDeliveryApiResponse };

export const getDashboardFiltersApi = () => {
  return axiosInstance.get<DashboardFiltersApiResponse>("/construction/dashboard/filters");
};

export const getDashboardApi = (params?: DashboardQueryParams) => {
  return axiosInstance.get<DashboardApiResponse>("/construction/dashboard", { params });
};

export const getDeliveryDetailsApi = (deliveryId: string) => {
  return axiosInstance.get<DeliveryDetailsApiResponse>(`/construction/deliveries/${deliveryId}`);
};

export const downloadDeliveryPackingListApi = (deliveryId: string) => {
  return axiosInstance.get(`/construction/deliveries/${deliveryId}/download/packing-list`, {
    responseType: "blob",
  });
};

export const downloadDeliveryBillOfLadingApi = (deliveryId: string) => {
  return axiosInstance.get(`/construction/deliveries/${deliveryId}/download/bill-of-lading`, {
    responseType: "blob",
  });
};



export interface CreateTaskPayload {
  title: string;
  description: string;
  leadId: string | null;
  assignedTo: string | null;
  priority: string;
  status: string;
  dueDate: string;
}

export const createTaskApi = (payload: CreateTaskPayload) => {
  return axiosInstance.post("/construction/tasks", payload);
};

export interface CreateWorkLogPayload {
  leadId: string;
  taskId: string | null;
  date: string;
  progress: number;
  description: string;
  photos: string[];
  issues: string;
}

export const createWorkLogApi = (payload: CreateWorkLogPayload) => {
  return axiosInstance.post("/construction/work-logs", payload);
};

export const getWorkLogsApi = (params?: GetWorkLogsParams) => {
  return axiosInstance.get<WorkLogsApiResponse>("/construction/work-logs", {
    params,
  });
};

export const markDeliveryReceivedApi = (deliveryId: string) => {
  return axiosInstance.post(`/construction/deliveries/${deliveryId}/mark-received`);
};

export const markDeliveryPartialApi = (deliveryId: string, payload?: { notes?: string }) => {
  return axiosInstance.post(`/construction/deliveries/${deliveryId}/mark-partial`, payload);
};

export interface ScanBundlePayload {
  bundleId: string;
  project?: string;
}

export const scanBundleApi = (payload: ScanBundlePayload) => {
  return axiosInstance.post("/construction/deliveries/scan-bundle", payload);
};

export const scanBundleScanApi = (payload: ScanBundlePayload) => {
  return axiosInstance.post("/construction/bundle-scan/scan", payload);
};

export const getLabelsApi = (params?: LabelsQueryParams) => {
  return axiosInstance.get<LabelsApiResponse>("/construction/labels", { params });
};

export const exportLabelsApi = (params?: LabelsQueryParams) => {
  return axiosInstance.get("/construction/labels/export", {
    params,
    responseType: "blob",
  });
};

export const getBundleScansApi = (params?: BundleScanQueryParams) => {
  return axiosInstance.get<BundleScanApiResponse>("/construction/bundle-scan", { params });
};

export const exportBundleScanApi = (params?: BundleScanQueryParams) => {
  return axiosInstance.get("/construction/bundle-scan/export", {
    params,
    responseType: "blob",
  });
};

export const getPackingListsApi = (params?: PackingListsQueryParams) => {
  return axiosInstance.get<PackingListApiResponse>("/construction/packing-lists", { params });
};

export const getPackingListDetailsApi = (packingListId: string) => {
  return axiosInstance.get<PackingListDetailApiResponse>(`/construction/packing-lists/${packingListId}`);
};

export const exportPackingListsApi = (params?: PackingListsQueryParams) => {
  return axiosInstance.get("/construction/packing-lists/export", {
    params,
    responseType: "blob",
  });
};

export const downloadPackingListPdfApi = (packingListId: string) => {
  return axiosInstance.get(`/construction/packing-lists/${packingListId}/download-pdf`, {
    responseType: "blob",
  });
};

export const markPackingListReadyApi = (packingListId: string) => {
  return axiosInstance.post(`/construction/packing-lists/${packingListId}/mark-ready`);
};

export const markPackingListLoadingApi = (packingListId: string) => {
  return axiosInstance.post(`/construction/packing-lists/${packingListId}/mark-loading`);
};

export const markPackingListDispatchApi = (packingListId: string) => {
  return axiosInstance.post(`/construction/packing-lists/${packingListId}/mark-dispatch`);
};

export const getDispatchVerificationApi = (params?: DispatchVerificationQueryParams) => {
  return axiosInstance.get<DispatchVerificationApiResponse>("/construction/dispatch-verification", { params });
};

export const exportDispatchVerificationApi = (params?: DispatchVerificationQueryParams) => {
  return axiosInstance.get("/construction/dispatch-verification/export", {
    params,
    responseType: "blob",
  });
};

export const getDispatchVerificationDetailsApi = (loadId: string) => {
  return axiosInstance.get<DispatchVerificationDetailApiResponse>(`/construction/dispatch-verification/${loadId}`);
};

export const verifyLoadApi = (loadId: string, payload?: { actualWeight?: number }) => {
  return axiosInstance.post(`/construction/dispatch-verification/${loadId}/verify-load`, payload);
};

export const confirmDispatchApi = (loadId: string) => {
  return axiosInstance.post(`/construction/dispatch-verification/${loadId}/confirm-dispatch`);
};

export const getMaterialRequestsApi = (params?: MaterialRequestsQueryParams) => {
  return axiosInstance.get<MaterialRequestsApiResponse>("/construction/material-requests", { params });
};

export const getMaterialRequestsFiltersApi = () => {
  return axiosInstance.get<MaterialRequestsFiltersApiResponse>("/construction/material-requests/filters");
};

export interface ExportMaterialRequestsParams {
  leadId?: string;
  projectId?: string;
  department?: string;
  status?: string;
  requestedBy?: string;
  priority?: string;
  siteLocation?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  fromDate?: string;
  toDate?: string;
  format?: "excel" | "csv";
}

export const exportMaterialRequestsApi = (params?: ExportMaterialRequestsParams, format: "excel" | "csv" = "excel") => {
  const url = format === "csv"
    ? "/construction/material-requests/export/csv"
    : "/construction/material-requests/export";
  return axiosInstance.get(url, {
    params: {
      ...params,
      ...(format === "csv" ? { format: "csv" } : {}),
    },
    responseType: "blob",
  });
};

export const getMaterialRequestDetailsApi = (id: string) => {
  return axiosInstance.get<{ success: boolean; message: string; data: { materialRequest: MaterialRequest } }>(`/construction/material-requests/${id}`);
};

export interface CreateMaterialRequestPayload {
  leadId: string;
  siteLocation: string;
  department: string;
  requestedItems: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
  requiredBy: string;
  priority: string;
}

export const createMaterialRequestApi = (payload: CreateMaterialRequestPayload) => {
  return axiosInstance.post("/construction/material-requests", payload);
};

export interface UpdateMaterialRequestStatusPayload {
  status: string;
  reviewNotes?: string;
}

export const updateMaterialRequestStatusApi = (
  requestId: string,
  payload: UpdateMaterialRequestStatusPayload
) => {
  return axiosInstance.put<{
    success: boolean;
    message: string;
    data?: {
      materialRequest?: MaterialRequest;
      [key: string]: unknown;
    };
  }>(`/construction/material-requests/${requestId}/status`, payload);
};


export const getBundleDetailsApi = (bundleId: string) => {
  return axiosInstance.get<BundleDetailsApiResponse>(`/construction/bundles/${bundleId}`);
};

export const verifyBundleApi = (bundleId: string) => {
  return axiosInstance.post(`/construction/bundles/${bundleId}/verify`);
};

export const markBundleStagedApi = (bundleId: string) => {
  return axiosInstance.post(`/construction/bundles/${bundleId}/mark-staged`);
};

export const markBundleLoadedApi = (bundleId: string) => {
  return axiosInstance.post(`/construction/bundles/${bundleId}/mark-loaded`);
};

export interface MismatchItemPayload {
  itemId?: string;
  partCode?: string;
  description?: string;
  qty?: number;
  receivedQty?: number;
  status?: string;
}

export interface ReportBundleMismatchPayload {
  notes?: string;
  items?: MismatchItemPayload[];
}

export const reportBundleMismatchApi = (bundleId: string, payload: ReportBundleMismatchPayload) => {
  return axiosInstance.post(`/construction/bundles/${bundleId}/report-mismatch`, payload);
};

export const reprintBundleLabelApi = (bundleId: string) => {
  return axiosInstance.post(`/construction/bundles/${bundleId}/reprint-label`);
};

export interface UpdateSiteContactPayload {

  contactName: string;
  contactTitle?: string;
  phone: string;
  email: string;
  availableHours?: string;
  notes?: string;
}

export const updateSiteContactApi = (deliveryId: string, payload: UpdateSiteContactPayload) => {
  return axiosInstance.put(`/construction/deliveries/${deliveryId}/site-contact`, payload);
};

export const getConsolidatedBOMApi = (projectId: string) => {
  return axiosInstance.get<ConsolidatedBOMApiResponse>(`/construction/projects/${projectId}/consolidated-bom`);
};

export const getConsolidatedBOMUrlApi = (projectId: string) => {
  return axiosInstance.get(`/construction/bom/projects/${projectId}/consolidated-url`);
};

export const getProjectDrawingsApi = (projectId: string) => {
  return axiosInstance.get<BuildingDrawingsApiResponse>(`/construction/projects/${projectId}/building-drawings`);
};

export type { BuildingDrawingsApiResponse };

export const getProjectMaterialDeliveriesApi = (leadId: string) => {
  return axiosInstance.get(`/construction/projects/${leadId}/material-deliveries`);
};
