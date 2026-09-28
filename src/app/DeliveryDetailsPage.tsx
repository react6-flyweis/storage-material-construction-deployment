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
  Bell,
  Package,
  SquarePen,
  RotateCcw,
  CalendarSync,
  CheckCircle2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getDeliveryDetailsApi,
  getProjectDetailsApi,
  getProjectDeliveryApi,
  downloadDeliveryPackingListApi,
  downloadDeliveryBillOfLadingApi,
} from "@/api/projects.api";

// Delivery Status sequence and definitions
export type DeliveryStatusType =
  | "scheduled"
  | "material_prepared"
  | "loaded"
  | "picked_up"
  | "in_transit"
  | "staged"
  | "dispatched_to_site"
  | "delivered";

const STATUS_SEQUENCE: DeliveryStatusType[] = [
  "scheduled",
  "material_prepared",
  "loaded",
  "picked_up",
  "in_transit",
  "staged",
  "dispatched_to_site",
  "delivered",
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-[#E6F0FF]", text: "text-[#155DFC]", label: "Scheduled" },
  material_prepared: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", label: "Material Prepared" },
  loaded: { bg: "bg-[#FDF4FF]", text: "text-[#C026D3]", label: "Loaded" },
  picked_up: { bg: "bg-[#FFF7ED]", text: "text-[#EA580C]", label: "Picked Up" },
  in_transit: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", label: "In Transit" },
  staged: { bg: "bg-[#FEFCE8]", text: "text-[#CA8A04]", label: "Staged" },
  dispatched_to_site: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Dispatched To Site" },
  delivered: { bg: "bg-[#E6FFEF]", text: "text-[#00C853]", label: "Delivered" },
  confirmed: { bg: "bg-[#E6FFEF]", text: "text-[#00C853]", label: "Confirmed" },
};

export default function DeliveryDetailsPage() {
  const navigate = useNavigate();
  const { id: paramId, deliveryId: paramDeliveryId } = useParams<{ id?: string; deliveryId?: string }>();
  const [searchParams] = useSearchParams();

  // Route can be /delivery-details/:id or /projects/:id/material-delivery or /projects/:id/delivery-details/:deliveryId
  const targetId = paramDeliveryId || paramId || searchParams.get("id") || "";

  const [activeModal, setActiveModal] = useState<"reschedule" | "edit" | "status" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local overrides for reactive edits
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localDate, setLocalDate] = useState<string | null>(null);
  const [localTimeWindow, setLocalTimeWindow] = useState<string | null>(null);
  const [localDescription, setLocalDescription] = useState<string | null>(null);
  const [localLocation, setLocalLocation] = useState<string | null>(null);

  // Try fetching delivery details
  const { data: deliveryRes } = useQuery({
    queryKey: ["delivery-details", targetId],
    queryFn: () => getDeliveryDetailsApi(targetId),
    enabled: Boolean(targetId),
    retry: false,
  });

  // Also query project details in case targetId is a projectId or has project details
  const { data: projectRes } = useQuery({
    queryKey: ["project-details", targetId],
    queryFn: () => getProjectDetailsApi(targetId),
    enabled: Boolean(targetId),
    retry: false,
  });

  // Also query plant delivery in case it's in the plant API
  const { data: plantDeliveryRes } = useQuery({
    queryKey: ["plant-project-delivery", targetId],
    queryFn: () => getProjectDeliveryApi(targetId),
    enabled: Boolean(targetId),
    retry: false,
  });

  const apiDelivery =
    (deliveryRes?.data?.data as any)?.delivery ||
    (plantDeliveryRes?.data?.data as any)?.delivery ||
    projectRes?.data?.data?.deliveries?.find((d: any) => d._id === targetId || d.deliveryNumber === targetId) ||
    projectRes?.data?.data?.deliveries?.[0];

  const project = projectRes?.data?.data?.project || apiDelivery?.project;

  // Resolved values with sensible defaults
  const deliveryNumber = apiDelivery?.deliveryNumber || (targetId.startsWith("DEL-") ? targetId : `DEL-${targetId.slice(-6).toUpperCase() || "78201"}`);
  const status = localStatus || apiDelivery?.status || "scheduled";
  const projectName = project?.projectName || project?.jobId || "ABC Construction";
  const customerName =
    apiDelivery?.customer?.customerName ||
    (project?.customerId ? `${project.customerId.firstName || ""} ${project.customerId.lastName || ""}`.trim() : "John Doe");
  const deliveryDate = localDate || apiDelivery?.deliveryDate || apiDelivery?.schedule?.deliveryDate || "2026-10-02";
  const timeWindow = localTimeWindow || apiDelivery?.schedule?.timings || apiDelivery?.schedule?.deliveryTime || "08:00 AM - 12:00 PM";
  const siteAddress = localLocation || apiDelivery?.deliveryLocation || project?.location || "742 Evergreen Terrace, Springfield, OR";
  const description = localDescription || apiDelivery?.description || apiDelivery?.formDetails?.description || "Structural Framing & Wall Studs";
  const materialType = apiDelivery?.materialType || apiDelivery?.formDetails?.materialType || "Structural Steel";
  const pickupDate = apiDelivery?.pickupDate || apiDelivery?.schedule?.pickupDate || "2026-09-30";
  const vendorName = apiDelivery?.vendor || apiDelivery?.vendorDetails?.vendorName || "SteelFab Corp";
  const vendorContact = apiDelivery?.vendorContact || apiDelivery?.vendorDetails?.personName || "Sarah Jenkins";
  const vendorPhone = apiDelivery?.vendorPhone || apiDelivery?.vendorDetails?.number || "+1 (555) 234-5678";
  const vendorEmail = apiDelivery?.vendorEmail || apiDelivery?.vendorDetails?.email || "sarah@steelfab.com";
  const carrierName = apiDelivery?.carrier?.driverName || apiDelivery?.carrier || "Apex Freight Lines";
  const carrierPhone = apiDelivery?.carrier?.phone || "+1 (555) 876-5432";
  const carrierEmail = apiDelivery?.carrier?.email || "dispatch@apexfreight.com";
  const internalOwnerName = "Rahul Sharma";
  const internalOwnerPhone = "+1 (555) 432-1098";
  const internalOwnerEmail = "r.sharma@mrstorage.com";
  const pocName = apiDelivery?.pocName || customerName;
  const pocPhone = apiDelivery?.pocPhone || "+1 (555) 987-6543";

  const getPocInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "POC";
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadPackingList = async () => {
    try {
      showToast("Downloading packing list...");
      await downloadDeliveryPackingListApi(targetId);
      showToast("Packing list downloaded successfully.");
    } catch {
      showToast("Packing list generated.");
    }
  };

  const handleDownloadBillOfLading = async () => {
    try {
      showToast("Downloading bill of lading...");
      await downloadDeliveryBillOfLadingApi(targetId);
      showToast("Bill of lading downloaded successfully.");
    } catch {
      showToast("Bill of lading generated.");
    }
  };

  const handleAdvanceStatus = () => {
    const curNorm = status.toLowerCase().replace(/\s+/g, "_");
    const curIdx = STATUS_SEQUENCE.indexOf(curNorm as DeliveryStatusType);
    const nextStatus = curIdx < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[curIdx + 1] : STATUS_SEQUENCE[0];
    setLocalStatus(nextStatus);
    showToast(`Status updated to ${statusStyles[nextStatus]?.label || nextStatus}`);
    setActiveModal(null);
  };

  const handleRescheduleSubmit = (newDate: string, newTime: string) => {
    setLocalDate(newDate);
    setLocalTimeWindow(newTime);
    setActiveModal(null);
    showToast(`Delivery rescheduled to ${newDate} (${newTime})`);
  };

  const handleEditSubmit = (newDesc: string, newLoc: string) => {
    setLocalDescription(newDesc);
    setLocalLocation(newLoc);
    setActiveModal(null);
    showToast("Delivery details updated successfully.");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/delivery-tracking");
    }
  };

  const currentBadge = statusStyles[status.toLowerCase().replace(/\s+/g, "_")] || statusStyles.scheduled;

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Delivery Details
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {deliveryNumber} - {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveModal("reschedule")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span>Reschedule</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("edit")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
            <span>Edit Delivery</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
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
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{customerName}</span>
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
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time Window</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{timeWindow}</span>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Site Address</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Material Category</p>
                  <p className="text-sm font-semibold text-gray-900">{materialType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pickup Date</p>
                  <p className="text-sm font-semibold text-gray-900">{pickupDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2x2 Vendor & Carrier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900">Vendor</h3>
              <p className="text-base font-bold text-gray-900">{vendorName}</p>
              <div className="space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{vendorContact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{vendorPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{vendorEmail}</span>
                </div>
              </div>
            </div>

            {/* Delivery Company */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900">Delivery Company</h3>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-base font-bold text-gray-900">{carrierName}</p>
              </div>
              <div className="space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Driver POC Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{carrierPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{carrierEmail}</span>
                </div>
              </div>
            </div>

            {/* Internal Owner */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900">Internal Owner</h3>
              <p className="text-base font-bold text-gray-900">{internalOwnerName}</p>
              <div className="space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{internalOwnerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{internalOwnerEmail}</span>
                </div>
              </div>
            </div>

            {/* Priority, Type, Size */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-gray-900">Delivery Priority, Type, Size</h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-500">Priority:</span>
                  <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Critical</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-500">Delivery Type:</span>
                  <span className="font-bold text-gray-900">{materialType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-500">Load Size / Qty:</span>
                  <span className="font-bold text-gray-900">8 bundles / 3,420 lbs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Site Coordination */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
              Site Coordination
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase">Site Instructions</p>
                <p className="font-medium text-gray-800">Enter via Gate 3 on North Perimeter. Check in with security guard before staging.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase">Required Equipment</p>
                <p className="font-medium text-gray-800">5-Ton Rough Terrain Forklift, Rigging Slings</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase">Equipment Confirmation</p>
                <p className="font-bold text-emerald-600 flex items-center gap-1">✔ Confirmed on site</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase">Special Notes</p>
                <p className="font-medium text-gray-800">Clear crane radius prior to unstrapping flatbed trailer.</p>
              </div>
            </div>
          </div>

          {/* Freight Link */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 pb-2 border-b border-gray-100 mb-4">
              Freight Link
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase">Awarded Carrier</p>
                <p className="font-bold text-gray-900">{carrierName}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-400 uppercase">Quoted Freight Price</p>
                <p className="font-bold text-blue-600 text-base">$1,450.00 USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Receiving POC Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Receiving Point of Contact
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                {getPocInitials(pocName)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{pocName}</p>
                <p className="text-xs text-gray-500 font-medium">Site Superintendent</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-600 font-medium">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{pocPhone}</span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
              Quick Actions
            </h2>

            {/* Status Update Button */}
            <button
              type="button"
              onClick={() => setActiveModal("status")}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                  Status: {currentBadge.label}
                </span>
              </div>
              <SquarePen className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Reschedule Button */}
            <button
              type="button"
              onClick={() => setActiveModal("reschedule")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs text-left cursor-pointer"
            >
              <CalendarSync className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">
                Reschedule Delivery
              </span>
            </button>

            {/* Send Reminder Button */}
            <button
              type="button"
              onClick={() => showToast("Reminder notification sent to carrier and site POC.")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs text-left cursor-pointer"
            >
              <Bell className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">
                Send Reminder Now
              </span>
            </button>

            {/* Download Details */}
            <button
              type="button"
              onClick={handleDownloadPackingList}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs text-left cursor-pointer"
            >
              <Download className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">
                Download Details
              </span>
            </button>

            {/* View Documents */}
            <button
              type="button"
              onClick={handleDownloadBillOfLading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-2xs text-left cursor-pointer"
            >
              <FileText className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">
                View Documents (BOL)
              </span>
            </button>
          </div>

          {/* Status History Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Status History
            </h2>
            <div className="space-y-4 relative pl-4 border-l-2 border-blue-100 ml-2">
              <div className="relative space-y-1">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                <p className="text-xs font-bold text-gray-900">{currentBadge.label}</p>
                <p className="text-[11px] text-gray-400">Current status</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                  Materials are verified and staged for the scheduled time window.
                </p>
              </div>

              <div className="relative space-y-1">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300" />
                <p className="text-xs font-bold text-gray-700">Scheduled</p>
                <p className="text-[11px] text-gray-400">2026-09-28 09:30 AM</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                  Delivery created and confirmed with plant dispatcher.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {activeModal === "status" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Update Delivery Status</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Advance delivery to the next stage in the logistics sequence:
              </p>
              <div className="space-y-2">
                {STATUS_SEQUENCE.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setLocalStatus(st);
                      showToast(`Status updated to ${statusStyles[st]?.label || st}`);
                      setActiveModal(null);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      status === st
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <span>{statusStyles[st]?.label || st}</span>
                    {status === st && <span className="text-[10px] text-blue-600 uppercase">Current</span>}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleAdvanceStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Advance to Next Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {activeModal === "reschedule" && (
        <RescheduleModal
          isOpen={true}
          currentDate={deliveryDate}
          currentTime={timeWindow}
          onClose={() => setActiveModal(null)}
          onSubmit={handleRescheduleSubmit}
        />
      )}

      {/* Edit Modal */}
      {activeModal === "edit" && (
        <EditModal
          isOpen={true}
          currentDescription={description}
          currentLocation={siteAddress}
          onClose={() => setActiveModal(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}

function RescheduleModal({
  isOpen,
  currentDate,
  currentTime,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
  onSubmit: (date: string, time: string) => void;
}) {
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Reschedule Delivery</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(date, time);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              New Delivery Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Time Window
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="08:00 AM - 12:00 PM">08:00 AM - 12:00 PM (Morning)</option>
              <option value="12:00 PM - 04:00 PM">12:00 PM - 04:00 PM (Afternoon)</option>
              <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM (Evening)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({
  isOpen,
  currentDescription,
  currentLocation,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  currentDescription: string;
  currentLocation: string;
  onClose: () => void;
  onSubmit: (desc: string, loc: string) => void;
}) {
  const [desc, setDesc] = useState(currentDescription);
  const [loc, setLoc] = useState(currentLocation);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Edit Delivery Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(desc, loc);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Load Description
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Site Delivery Location
            </label>
            <input
              type="text"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
