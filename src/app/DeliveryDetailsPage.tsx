import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Truck,
  Building2,
  Download,
  FileText,
  Package,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Layers,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getDeliveryDetailsApi,
  getProjectDetailsApi,
  getProjectMaterialDeliveriesApi,
  downloadDeliveryPackingListApi,
  downloadDeliveryBillOfLadingApi,
} from "@/api/projects.api";
import type { ConstructionDelivery } from "@/types/projects.types";

const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  scheduled: { bg: "bg-[#E6F0FF]", text: "text-[#155DFC]", dot: "bg-[#155DFC]", label: "Scheduled" },
  material_prepared: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", dot: "bg-[#4F46E5]", label: "Material Prepared" },
  loaded: { bg: "bg-[#FDF4FF]", text: "text-[#C026D3]", dot: "bg-[#C026D3]", label: "Loaded" },
  picked_up: { bg: "bg-[#FFF7ED]", text: "text-[#EA580C]", dot: "bg-[#EA580C]", label: "Picked Up" },
  in_transit: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", dot: "bg-[#2563EB]", label: "In Transit" },
  staged: { bg: "bg-[#FEFCE8]", text: "text-[#CA8A04]", dot: "bg-[#CA8A04]", label: "Staged" },
  dispatched_to_site: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", dot: "bg-[#059669]", label: "Dispatched To Site" },
  delivered: { bg: "bg-[#E6FFEF]", text: "text-[#00C853]", dot: "bg-[#00C853]", label: "Delivered" },
  partial_received: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", dot: "bg-[#D97706]", label: "Partial Received" },
  received: { bg: "bg-[#E6FFEF]", text: "text-[#00C853]", dot: "bg-[#00C853]", label: "Received" },
  confirmed: { bg: "bg-[#E6FFEF]", text: "text-[#00C853]", dot: "bg-[#00C853]", label: "Confirmed" },
};

const formatDateTime = (dateStr?: string | null, timeStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${dateFormatted}${timeStr ? `, ${timeStr}` : ""}`;
  } catch {
    return dateStr;
  }
};

const getPocInitials = (name?: string | null) => {
  if (!name || name === "-") return "POC";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "POC"
  );
};

export default function DeliveryDetailsPage() {
  const navigate = useNavigate();
  const { id: paramId, deliveryId: paramDeliveryId } = useParams<{ id?: string; deliveryId?: string }>();
  const [searchParams] = useSearchParams();

  // Route can be /delivery-details/:id or /projects/:id/material-delivery or /projects/:id/delivery-details/:deliveryId
  const isMaterialDeliveryRoute = window.location.pathname.includes("/material-delivery");
  const projectId = isMaterialDeliveryRoute ? paramId : "";
  const initialDeliveryId = paramDeliveryId || (!isMaterialDeliveryRoute ? paramId : "") || searchParams.get("id") || "";

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. If on /projects/:id/material-delivery, fetch project's material deliveries via GET /api/construction/projects/:leadId/material-deliveries
  const {
    data: projectDeliveriesRes,
    isLoading: isProjectDeliveriesLoading,
  } = useQuery({
    queryKey: ["project-material-deliveries", projectId],
    queryFn: () => getProjectMaterialDeliveriesApi(projectId!),
    enabled: Boolean(isMaterialDeliveryRoute && projectId),
    retry: false,
  });

  // Parse list of deliveries returned from the project material-deliveries endpoint
  const rawProjectDeliveries = projectDeliveriesRes?.data?.data || projectDeliveriesRes?.data;
  const projectDeliveriesList: ConstructionDelivery[] = Array.isArray(rawProjectDeliveries?.deliveries)
    ? rawProjectDeliveries.deliveries
    : Array.isArray(rawProjectDeliveries)
    ? rawProjectDeliveries
    : rawProjectDeliveries?.delivery
    ? [rawProjectDeliveries.delivery]
    : rawProjectDeliveries?.deliveryId
    ? [rawProjectDeliveries]
    : [];

  const firstProjectDelivery: ConstructionDelivery | undefined = projectDeliveriesList[0];

  // Also query project details as fallback
  const { data: projectRes } = useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => getProjectDetailsApi(projectId!),
    enabled: Boolean(isMaterialDeliveryRoute && projectId && !isProjectDeliveriesLoading && projectDeliveriesList.length === 0),
    retry: false,
  });

  // Resolve the delivery ID (from URL, or from the project material-deliveries response)
  const resolvedDeliveryId =
    initialDeliveryId ||
    firstProjectDelivery?.deliveryId ||
    (firstProjectDelivery as any)?._id ||
    projectRes?.data?.data?.deliveries?.[0]?._id ||
    (!isMaterialDeliveryRoute ? paramId : "") ||
    "";

  // 2. Fetch single delivery details via GET /api/construction/deliveries/:deliveryId
  const { data: deliveryRes, isLoading: isDeliveryLoading } = useQuery({
    queryKey: ["delivery-details", resolvedDeliveryId],
    queryFn: () => getDeliveryDetailsApi(resolvedDeliveryId),
    enabled: Boolean(resolvedDeliveryId),
    retry: 1,
  });

  const delivery: ConstructionDelivery | undefined =
    deliveryRes?.data?.data?.delivery ||
    firstProjectDelivery ||
    (projectRes?.data?.data?.deliveries?.find(
      (d) => d._id === resolvedDeliveryId || d.deliveryNumber === resolvedDeliveryId
    ) as unknown as ConstructionDelivery) ||
    (projectRes?.data?.data?.deliveries?.[0] as unknown as ConstructionDelivery);

  const activeDownloadId = delivery?.deliveryId || (delivery as any)?._id || resolvedDeliveryId;

  // Download mutations
  const downloadPackingListMutation = useMutation({
    mutationFn: () => downloadDeliveryPackingListApi(activeDownloadId),
    onSuccess: (res) => {
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PackingList_${delivery?.deliveryNumber || activeDownloadId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Packing list downloaded successfully.");
    },
    onError: () => {
      showToast("Failed to download packing list.");
    },
  });

  const downloadBillOfLadingMutation = useMutation({
    mutationFn: () => downloadDeliveryBillOfLadingApi(activeDownloadId),
    onSuccess: (res) => {
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BillOfLading_${delivery?.deliveryNumber || activeDownloadId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Bill of lading downloaded successfully.");
    },
    onError: () => {
      showToast("Failed to download bill of lading.");
    },
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/delivery-tracking");
    }
  };

  const isLoading =
    (isMaterialDeliveryRoute ? isProjectDeliveriesLoading : isDeliveryLoading) && !delivery;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 max-w-7xl mx-auto px-4">
        <Loader2 className="w-9 h-9 text-[#2563EB] animate-spin" />
        <p className="text-sm font-bold text-gray-600">Loading delivery details...</p>
      </div>
    );
  }

  if (!delivery && !isLoading) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          {isMaterialDeliveryRoute ? "No Material Delivery Found" : "Delivery Not Found"}
        </h2>
        <p className="text-sm text-gray-500">
          {isMaterialDeliveryRoute
            ? "There are currently no confirmed or scheduled material deliveries for this project."
            : "The requested delivery details could not be found or loaded."}
        </p>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isMaterialDeliveryRoute ? "Back to Project" : "Go Back"}</span>
        </button>
      </div>
    );
  }

  const statusHistory = (delivery as any)?.statusHistory || [];
  const activeStatus =
    delivery?.status || (statusHistory.length > 0 ? statusHistory[statusHistory.length - 1]?.status : null) || "scheduled";

  const normStatus = (activeStatus || "").toLowerCase().replace(/[\s-]+/g, "_");
  const currentBadge = statusStyles[normStatus] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-500",
    label: activeStatus ? activeStatus.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Scheduled",
  };

  const formattedStatusText = activeStatus
    ? activeStatus.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
    : "-";

  interface StatusStep {
    label: string;
    status: "current" | "completed";
    timestamp?: string;
  }

  const steps: StatusStep[] =
    statusHistory.length > 0
      ? statusHistory.map((item: any, idx: number): StatusStep => {
          const isCurrent = idx === statusHistory.length - 1;
          return {
            label: item.status ? item.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "-",
            status: isCurrent ? "current" : "completed",
            timestamp: item.changedAt,
          };
        })
      : activeStatus
      ? [
          {
            label: formattedStatusText,
            status: "current",
            timestamp: undefined,
          },
        ]
      : [];

  const del = delivery as any;

  const deliveryNumber = del?.deliveryNumber || del?.deliveryId || resolvedDeliveryId || "-";
  const projectName = del?.project?.projectName || del?.project?.jobId || projectRes?.data?.data?.project?.projectName || "-";
  const receivingPoc = del?.receivingPoc || del?.siteContact?.contactName || del?.pocName || "-";
  const pocPhone = del?.pickupContactPhone || del?.siteContact?.phone || del?.pocPhone || del?.carrier?.phone || "-";
  const pocTitle = del?.siteContact?.contactTitle || "Site Receiving Lead";
  const deliveryDate = formatDateTime(del?.schedule?.deliveryDate || del?.deliveryDate, null);
  const timeWindow = del?.schedule?.deliveryTime || del?.schedule?.timings || "-";
  const siteAddress = del?.deliveryLocation || del?.project?.location || "-";
  const originAddress = del?.pickupLocation || "-";
  const description = del?.description?.trim() || "-";
  const materialType = del?.materialType?.trim() || "-";
  const pickupDate = formatDateTime(del?.schedule?.pickupDate, null);
  const pickupTime = del?.schedule?.pickupTime || "-";
  const stagingArea = del?.stagingArea || "-";
  const formattedWeight = del?.loadWeight ? `${Number(del.loadWeight).toLocaleString()} lbs` : "-";
  const packageCount = del?.packageCount ? `${del.packageCount} Packages` : "-";
  const loadingEquipment = del?.loadingEquipment?.length ? del.loadingEquipment.join(", ") : "-";
  const notes = del?.notes || (del?.loadingEquipment?.length ? `Loading equipment required: ${del.loadingEquipment.join(", ")}` : "No special instructions provided.");
  const carrierDriver = del?.carrier?.driverName || (typeof del?.carrier === "string" ? del.carrier : "-");
  const carrierPhone = del?.carrier?.driverPhone || del?.carrier?.phone || "-";
  const carrierEmail = del?.carrier?.email || "-";
  const truckNumber = del?.carrier?.truckNumber || "-";

  const etaText = del?.schedule?.deliveryTime
    ? `ETA ${del.schedule.deliveryTime}`
    : del?.schedule?.timings
    ? del.schedule.timings
    : null;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Delivery Details
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentBadge.bg} ${currentBadge.text}`}
              >
                {currentBadge.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {deliveryNumber} {description !== "-" ? `• ${description}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => downloadPackingListMutation.mutate()}
            disabled={downloadPackingListMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {downloadPackingListMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <Download className="w-4 h-4 text-gray-500" />
            )}
            <span>Packing List</span>
          </button>
          <button
            type="button"
            onClick={() => downloadBillOfLadingMutation.mutate()}
            disabled={downloadBillOfLadingMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {downloadBillOfLadingMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Bill of Lading</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Delivery Flow Banner */}
          <div className="bg-[#F0F9FF] border border-[#BEE3F8]/60 rounded-2xl p-5 shadow-xs">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Delivery Flow
            </p>
            <div className="flex items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-[#3182CE] rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origin</p>
                  <p className="text-sm font-bold text-gray-900 leading-snug truncate" title={originAddress}>
                    {originAddress}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-gray-300 shrink-0">
                <span className="w-8 border-t border-dashed border-gray-300" />
                <ArrowRight className="w-5 h-5 text-blue-500" />
                <span className="w-8 border-t border-dashed border-gray-300" />
              </div>

              <div className="flex items-center gap-3 min-w-0 text-right sm:text-left">
                <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destination</p>
                  <p className="text-sm font-bold text-gray-900 leading-snug truncate" title={siteAddress}>
                    {siteAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Overview Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Delivery Overview
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentBadge.bg} ${currentBadge.text}`}
              >
                {currentBadge.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{projectName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Receiving POC</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{receivingPoc}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Date</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{deliveryDate}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time Window / ETA</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{timeWindow}</span>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Site Delivery Address</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{siteAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
              Delivery Information
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Package className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{description}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Material Type</p>
                  <p className="text-sm font-semibold text-gray-900">{materialType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pickup Date</p>
                  <p className="text-sm font-semibold text-gray-900">{pickupDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pickup Time</p>
                  <p className="text-sm font-semibold text-gray-900">{pickupTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carrier & Material Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Carrier Information */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Carrier & Driver</span>
              </h3>
              <p className="text-base font-bold text-gray-900">
                {carrierDriver !== "-" ? carrierDriver : "Assigned Carrier"}
              </p>
              <div className="space-y-2 text-xs font-medium text-gray-600">
                {truckNumber !== "-" && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-[10px]">Truck:</span>
                    <span className="font-bold text-gray-800">{truckNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{carrierPhone}</span>
                </div>
                {carrierEmail !== "-" && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{carrierEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Load & Material Metrics */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Load & Quantity</span>
              </h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-400 uppercase text-[11px]">Load Weight:</span>
                  <span className="font-bold text-gray-900">{formattedWeight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-400 uppercase text-[11px]">Package Count:</span>
                  <span className="font-bold text-gray-900">{packageCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-400 uppercase text-[11px]">Staging Area:</span>
                  <span className="font-bold text-gray-900">{stagingArea}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Site Instructions & Equipment */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
              Site Coordination & Instructions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-gray-500" />
                  <span>Required Loading Equipment</span>
                </p>
                <p className="font-medium text-gray-800">{loadingEquipment}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase text-[11px]">Special Instructions / Notes</p>
                <p className="font-medium text-gray-800 italic">{notes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column / Sidebar */}
        <div className="space-y-6">
          {/* Delivery Status Card - Strictly read-only, NO update option */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Delivery Status
            </h2>
            <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${currentBadge.dot}`} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{formattedStatusText}</p>
                  {etaText && (
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{etaText}</p>
                  )}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentBadge.bg} ${currentBadge.text}`}
              >
                {currentBadge.label}
              </span>
            </div>
            {stagingArea !== "-" && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="font-semibold text-gray-400 uppercase text-[11px]">Staging Area</span>
                <span className="font-bold text-gray-900">{stagingArea}</span>
              </div>
            )}
          </div>

          {/* Receiving Point of Contact Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Receiving Point of Contact
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                {getPocInitials(receivingPoc)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{receivingPoc}</p>
                <p className="text-xs text-gray-500 font-medium">{pocTitle}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-600 font-medium">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{pocPhone}</span>
            </div>
          </div>

          {/* Documents & Downloads */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Documents & Downloads
            </h2>

            {/* Download Packing List */}
            <button
              type="button"
              onClick={() => downloadPackingListMutation.mutate()}
              disabled={downloadPackingListMutation.isPending}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs text-left cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-800">
                  Download Packing List
                </span>
              </div>
              {downloadPackingListMutation.isPending && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
            </button>

            {/* Download Bill of Lading */}
            <button
              type="button"
              onClick={() => downloadBillOfLadingMutation.mutate()}
              disabled={downloadBillOfLadingMutation.isPending}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs text-left cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-800">
                  Download Bill of Lading (BOL)
                </span>
              </div>
              {downloadBillOfLadingMutation.isPending && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
            </button>
          </div>

          {/* Status History Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Status History
            </h2>
            {steps.length > 0 ? (
              <div className="space-y-4 relative pl-4 border-l-2 border-blue-100 ml-2">
                {steps
                  .slice()
                  .reverse()
                  .map((step, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <div
                        className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                          step.status === "current"
                            ? "bg-blue-600 ring-4 ring-blue-50"
                            : "bg-emerald-500 ring-4 ring-emerald-50"
                        }`}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-900">{step.label}</p>
                        {step.status === "current" && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      {step.timestamp && (
                        <p className="text-[11px] text-gray-400">
                          {formatDateTime(step.timestamp)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No status history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
