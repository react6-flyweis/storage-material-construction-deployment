import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getProjectDetailsApi,
  getMaterialRequestDetailsApi,
} from "../../api/projects.api";
import type {
  Delivery,
  Task,
  MaterialRequest,
} from "../../types/projects.types";
import Modal from "../common/Modal";

interface ExtendedRequestUser {
  userId: string;
  name: string;
  role?: string;
}

interface ExtendedMaterialRequest extends Omit<MaterialRequest, "requestedBy"> {
  notes?: string;
  remarks?: string;
  requestedBy: ExtendedRequestUser;
}

type MaterialRequestDetailsModalProps = {
  open: boolean;
  projectId?: string | null;
  request?: MaterialRequest | null;
  onClose: () => void;
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return { date: "-", time: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "-", time: "" };

  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Format to match the image, e.g. "May 19,2025" (no space after comma)
  return {
    date: date.replace(", ", ","),
    time,
  };
};

const formatStatus = (status: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getStatusBadgeClass = (status: string) => {
  const lowercaseStatus = status?.toLowerCase() || "";
  if (
    [
      "delivered",
      "deal_closed",
      "dispatched",
      "ready_for_delivery",
      "approved",
    ].includes(lowercaseStatus)
  ) {
    return "bg-green-50 text-green-700";
  }
  if (
    [
      "in_transit",
      "fabrication_started",
      "quality_inspection",
      "proposal_sent",
    ].includes(lowercaseStatus)
  ) {
    return "bg-blue-50 text-blue-700";
  }
  if (
    [
      "scheduled",
      "negotiation",
      "packing_bundling",
      "requirements_gathered",
      "pending",
    ].includes(lowercaseStatus)
  ) {
    return "bg-[#FFFDF5] text-[#D97706]";
  }
  return "bg-gray-50 text-gray-700";
};

const getPriorityClass = (priority: string) => {
  const p = priority?.toLowerCase() || "";
  if (p === "high") return "bg-[#FEF2F2] text-[#EF4444]";
  if (p === "medium") return "bg-[#FFF7ED] text-[#F97316]";
  return "bg-[#EFF6FF] text-[#3B82F6]";
};

export default function MaterialRequestDetailsModal({
  open,
  projectId,
  request,
  onClose,
}: MaterialRequestDetailsModalProps) {
  // Only query project details if we don't have a direct request and have a projectId
  const shouldFetchProject = !request && !!projectId && open;

  const {
    data: projectDetailsData,
    isLoading: isProjectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => getProjectDetailsApi(projectId!),
    enabled: shouldFetchProject,
  });

  // Query material request details if request is passed
  const shouldFetchRequest = !!request?._id && open;

  const {
    data: requestDetailsData,
    isLoading: isRequestLoading,
    error: requestError,
  } = useQuery({
    queryKey: ["material-request-details", request?._id],
    queryFn: () => getMaterialRequestDetailsApi(request!._id),
    enabled: shouldFetchRequest,
  });

  const responseData = projectDetailsData?.data?.data;
  const project = responseData?.project;
  const deliveries = responseData?.deliveries || [];
  const tasks = responseData?.tasks || [];

  // Fallback to list request if fetch fails or is not yet complete
  const rawRequest = requestDetailsData?.data?.data?.materialRequest || request;
  const fetchedRequest = rawRequest as ExtendedMaterialRequest | null;

  const requestDateObj = fetchedRequest
    ? formatDateTime(fetchedRequest.requestDate)
    : { date: "-", time: "" };
  const requiredByObj = fetchedRequest
    ? formatDateTime(fetchedRequest.requiredBy)
    : { date: "-", time: "" };

  const isLoading = shouldFetchProject ? isProjectLoading : isRequestLoading;
  const error = shouldFetchProject ? projectError : requestError;

  return (
    <Modal open={open} onClose={onClose} containerClassName="max-w-[580px] p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-[17px] font-bold text-gray-900">
          {request
            ? "Material Request Details"
            : "Project & Construction Details"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto px-8 py-6 custom-scrollbar flex-1">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="animate-pulse space-y-6 py-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          </div>
        ) : error && !fetchedRequest ? (
          <div className="text-center py-10 text-red-500 font-medium">
            Failed to load details. Please try again.
          </div>
        ) : request ? (
          /* Material Request Specific Details View */
          fetchedRequest ? (
            <div>
              {/* Top Status Badge */}
              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-sm font-semibold capitalize ${getStatusBadgeClass(fetchedRequest.status)}`}
                >
                  {fetchedRequest.status}
                </span>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-12 gap-y-6 gap-x-4 mb-8">
                {/* Column 1: Request ID */}
                <div className="col-span-8">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Request ID
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {fetchedRequest.requestId}
                  </p>
                </div>

                {/* Column 2: Priority */}
                <div className="col-span-4 flex flex-col items-start">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Priorty
                  </p>
                  <span
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize ${getPriorityClass(fetchedRequest.priority)}`}
                  >
                    {fetchedRequest.priority}
                  </span>
                </div>

                {/* Row 2 */}
                {/* Column 1: Project / Site */}
                <div className="col-span-8">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Project / Site
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {fetchedRequest.project?.projectName ||
                      fetchedRequest.project?.jobId ||
                      "N/A"}
                  </p>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    {fetchedRequest.siteLocation || "-"}
                  </p>
                </div>

                {/* Column 2: Status */}
                <div className="col-span-4">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Status
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-semibold capitalize ${getStatusBadgeClass(fetchedRequest.status)}`}
                  >
                    {fetchedRequest.status}
                  </span>
                </div>

                {/* Row 3 */}
                {/* Column 1: Requested By */}
                <div className="col-span-4">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Requested By
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {fetchedRequest.requestedBy?.name || "-"}
                  </p>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    {fetchedRequest.requestedBy?.role || "Site Engineer"}
                  </p>
                </div>

                {/* Column 2: Request Date */}
                <div className="col-span-4">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Request Date
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {requestDateObj.date}
                  </p>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    {requestDateObj.time}
                  </p>
                </div>

                {/* Column 3: Required By */}
                <div className="col-span-4">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Required By
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {requiredByObj.date}
                  </p>
                </div>
              </div>

              {/* Requested Items */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Requested Items ({fetchedRequest.requestedItems.length})
                </h3>
                {fetchedRequest.requestedItems.length === 0 ? (
                  <p className="text-xs text-gray-500">No items specified.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-bold text-gray-900 border-b border-gray-100">
                          <th className="pb-3 pr-4 font-bold w-8 text-gray-450">
                            #
                          </th>
                          <th className="pb-3 pr-4 font-bold">
                            Item Description
                          </th>
                          <th className="pb-3 pr-4 font-bold">Unit</th>
                          <th className="pb-3 pr-4 font-bold">Requested Qty</th>
                          <th className="pb-3 font-bold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {fetchedRequest.requestedItems.map((item, index) => (
                          <tr key={index} className="text-xs">
                            <td className="py-3 text-gray-400 pr-4">
                              {index + 1}
                            </td>
                            <td className="py-3 text-gray-500 font-semibold pr-4">
                              {item.name}
                            </td>
                            <td className="py-3 text-gray-500 pr-4 capitalize">
                              {item.unit}
                            </td>
                            <td className="py-3 text-gray-500 font-semibold pr-4">
                              {item.quantity?.toLocaleString()}
                            </td>
                            <td className="py-3 text-gray-400">
                              {item.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Request Notes */}
              <div className="mt-8 pt-4">
                <h4 className="text-xs font-bold text-gray-900 mb-2">
                  Request Notes
                </h4>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {fetchedRequest.notes ||
                    fetchedRequest.remarks ||
                    "Additional materials required for columns ans slab casting on ground floor."}
                </p>
              </div>

              {/* Attachments */}
              {/* <div className="mt-8 pt-4">
                <h4 className="text-xs font-bold text-gray-900 mb-4">Attachment (2)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 leading-tight">Material_List_xisx</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">12KB</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

       
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg text-red-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 leading-tight">Site_Drawing.Pdf</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">2.4 MB</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div> */}

              {/* Action Button */}
              <div className="mt-8 flex justify-center pt-4">
                <button className="px-12 py-2.5 border border-red-200 rounded-lg text-red-500 font-bold text-sm bg-white hover:bg-red-50/50 transition-colors">
                  Cancel Request
                </button>
              </div>
            </div>
          ) : null
        ) : !project ? (
          <div className="text-center py-10 text-gray-500 font-medium">
            No project details found.
          </div>
        ) : (
          /* Project Details View */
          <div>
            {/* Status Badge */}
            <div className="mb-6 mt-2">
              <span
                className={`px-3 py-1 rounded-md text-sm font-semibold ${getStatusBadgeClass(project.lifecycleStatus)}`}
              >
                {formatStatus(project.lifecycleStatus)}
              </span>
            </div>

            {/* Grid Details */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Project ID
                </p>
                <p className="text-base font-bold text-gray-900">
                  {project.jobId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Building Type
                </p>
                <p className="text-base font-bold text-gray-900 capitalize">
                  {project.buildingType || "-"}
                </p>
              </div>

              <div className="col-span-1">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Project / Site Name
                </p>
                <p className="text-base font-bold text-gray-900">
                  {project.projectName ||
                    `${project.buildingType || "Project"} - ${project.location || "Site"}`}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {project.location || "No location listed"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Buildings Count
                </p>
                <p className="text-base font-bold text-gray-900">
                  {project.numberOfBuildings ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  End Date
                </p>
                <p className="text-base font-bold text-gray-900">
                  {formatDateTime(project.endDate).date}
                </p>
              </div>
              {project.customerId && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Customer
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {project.customerId.firstName}{" "}
                    {project.customerId.lastName || ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {project.customerId.email}
                  </p>
                </div>
              )}
            </div>

            {/* Deliveries */}
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Deliveries ({deliveries.length})
              </h3>
              {deliveries.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No deliveries scheduled for this project.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pr-4">Delivery #</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {deliveries.map((delivery: Delivery) => (
                        <tr key={delivery._id} className="text-sm">
                          <td className="py-3 text-gray-900 font-semibold">
                            {delivery.deliveryNumber}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(delivery.status)}`}
                            >
                              {formatStatus(delivery.status)}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500">
                            {formatDateTime(delivery.deliveryDate).date}
                          </td>
                          <td className="py-3 text-gray-500 truncate max-w-[200px]">
                            {delivery.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Tasks ({tasks.length})
              </h3>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No tasks assigned to this project.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pr-4">Task Title</th>
                        <th className="pb-3 pr-4">Priority</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tasks.map((task: Task) => (
                        <tr key={task._id} className="text-sm">
                          <td className="py-3 text-gray-900 font-semibold pr-4">
                            {task.title}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${getPriorityClass(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(task.status)}`}
                            >
                              {formatStatus(task.status)}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500">
                            {formatDateTime(task.dueDate).date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
