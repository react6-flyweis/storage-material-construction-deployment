import { axiosInstance } from "./axiosInstance";
import type { ProjectsApiResponse, ProjectDetailsApiResponse, CalendarApiResponse, DrawingsApiResponse, TasksApiResponse, DeliveriesApiResponse, DeliveryDetailsApiResponse, LabelsApiResponse, LabelsQueryParams, BundleScanApiResponse, BundleScanQueryParams, PackingListApiResponse, PackingListsQueryParams, PackingListDetailApiResponse, DispatchVerificationApiResponse, DispatchVerificationDetailApiResponse, DispatchVerificationQueryParams, MaterialRequestsApiResponse, MaterialRequestsQueryParams, MaterialRequest, BundleDetailsApiResponse, DashboardApiResponse } from "../types/projects.types";

export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
}

export interface CalendarQueryParams {
  month: number;
  year: number;
  leadId?: string;
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

export const getTasksApi = () => {
  return axiosInstance.get<TasksApiResponse>("/construction/tasks");
};

export const getDeliveriesApi = () => {
  return axiosInstance.get<DeliveriesApiResponse>("/construction/deliveries");
};

export const getDashboardApi = () => {
  return axiosInstance.get<DashboardApiResponse>("/construction/dashboard");
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

export const getBundleScansApi = (params?: BundleScanQueryParams) => {
  return axiosInstance.get<BundleScanApiResponse>("/construction/bundle-scan", { params });
};

export const getPackingListsApi = (params?: PackingListsQueryParams) => {
  return axiosInstance.get<PackingListApiResponse>("/construction/packing-lists", { params });
};

export const getPackingListDetailsApi = (packingListId: string) => {
  return axiosInstance.get<PackingListDetailApiResponse>(`/construction/packing-lists/${packingListId}`);
};

export const exportPackingListsApi = () => {
  return axiosInstance.get("/construction/packing-lists/export", {
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









