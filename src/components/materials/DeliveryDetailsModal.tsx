import React, { useState } from "react";
import { X, Truck, Package, MapPin, Calendar, Phone, Check, ArrowRight, Download, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDeliveryDetailsApi, downloadDeliveryPackingListApi, downloadDeliveryBillOfLadingApi } from "../../api/projects.api";
import Modal from "../common/Modal";
import SuccessModal from "../common/SuccessModal";

type DeliveryDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  deliveryId?: string | null;
};

const formatDateTime = (dateStr?: string | null, timeStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${dateFormatted}${timeStr ? `, ${timeStr}` : ""}`;
  } catch {
    return dateStr;
  }
};

export default function DeliveryDetailsModal({ open, onClose, deliveryId }: DeliveryDetailsModalProps) {
  const [successModalTitle, setSuccessModalTitle] = useState<string | null>(null);

  const { data: detailData, isLoading, isError } = useQuery({
    queryKey: ["deliveryDetails", deliveryId],
    queryFn: () => getDeliveryDetailsApi(deliveryId!),
    enabled: open && !!deliveryId,
  });

  const downloadPackingListMutation = useMutation({
    mutationFn: () => downloadDeliveryPackingListApi(deliveryId!),
    onSuccess: (res) => {
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PackingList_${deliveryId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessModalTitle("Packing list downloaded successfully");
    },
    onError: () => { },
  });

  const downloadBillOfLadingMutation = useMutation({
    mutationFn: () => downloadDeliveryBillOfLadingApi(deliveryId!),
    onSuccess: (res) => {
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BillOfLading_${deliveryId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessModalTitle("Bill of lading downloaded successfully");
    },
    onError: () => { },
  });

  if (!open) return null;

  const delivery = detailData?.data?.data?.delivery;

  const statusHistory = delivery?.statusHistory || [];
  const activeStatus = delivery?.status || (statusHistory.length > 0 ? statusHistory[statusHistory.length - 1]?.status : null);

  const steps = statusHistory.length > 0
    ? statusHistory.map((item, idx) => {
        const isCurrent = idx === statusHistory.length - 1;
        return {
          label: item.status ? item.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-",
          status: isCurrent ? ("current" as const) : ("completed" as const),
          timestamp: item.changedAt,
        };
      })
    : activeStatus
      ? [
          {
            label: activeStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: "current" as const,
            timestamp: undefined,
          },
        ]
      : [];

  const formattedStatusText = activeStatus
    ? activeStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "-";

  const etaText = delivery?.schedule?.deliveryTime
    ? `ETA ${delivery.schedule.deliveryTime}`
    : delivery?.schedule?.timings
      ? delivery.schedule.timings
      : null;

  const formattedWeight = delivery?.loadWeight
    ? `${Number(delivery.loadWeight).toLocaleString()} lbs`
    : "-";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        containerClassName="max-w-[900px] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3F69B0] rounded-full flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Delivery Details</h2>
                {delivery?.status && (
                  <span className="bg-[#EF4444] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {delivery.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-400">
                {delivery?.deliveryNumber || deliveryId || "-"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#3F69B0] animate-spin" />
              <p className="text-sm font-bold text-gray-500">Loading delivery details...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm font-bold text-red-500">Failed to load delivery details.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg uppercase"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className="border border-[#3F69B0]/30 rounded-[15px] p-4 flex items-center justify-between mb-5 bg-[#F8FAFF]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-xs font-semibold text-[#3F69B0]">Current Status</p>
                    {etaText && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-[#FFC107] rounded-full" />
                        <p className="text-[10px] font-bold text-[#3F69B0] uppercase">{etaText}</p>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#3F69B0]">{formattedStatusText}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-gray-400">Staging Area</p>
                  <h4 className="text-lg font-bold text-gray-900">
                    {delivery?.stagingArea || "-"}
                  </h4>
                </div>
              </div>

              {/* Progress Tracker */}
              {steps.length > 0 && (
                <div className="border border-[#3F69B0]/20 rounded-[15px] p-4 mb-5 bg-gray-50/30">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {step.status === "completed" ? (
                            <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                          ) : (
                            <div className="w-3.5 h-3.5 bg-[#FFC107] rounded-full border-2 border-white shadow-sm ring-2 ring-[#FFC107]/40" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-[#3F69B0]">
                            {step.label}
                          </span>
                          {step.timestamp && (
                            <span className="text-[9px] font-semibold text-gray-400">
                              {formatDateTime(step.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Flow */}
              <div className="bg-[#F0F9FF] border border-[#BEE3F8]/50 rounded-[15px] p-4 mb-6">
                <p className="text-sm font-bold text-gray-900 mb-4 tracking-tight">Delivery Flow</p>
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#3182CE] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Origin</p>
                      <p className="text-sm font-bold text-gray-900 leading-none truncate max-w-[180px]" title={delivery?.pickupLocation || "-"}>
                        {delivery?.pickupLocation ? delivery.pickupLocation.split(",")[0] : "-"}
                      </p>
                    </div>
                  </div>
                  {/* <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#22C55E] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Plant</p>
                      <p className="text-sm font-bold text-gray-900 leading-none">
                        {delivery?.stagingArea || "-"}
                      </p>
                    </div>
                  </div> */}
                  <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F97316] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Destination</p>
                      <p className="text-sm font-bold text-gray-900 leading-none truncate max-w-[180px]" title={delivery?.deliveryLocation || delivery?.project?.projectName || "-"}>
                        {delivery?.deliveryLocation ? delivery.deliveryLocation.split(",")[0] : delivery?.project?.projectName || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Material Information */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Material Information</h5>
                  <div className="space-y-3">
                    <DetailItem
                      icon={<Package />}
                      label="Material"
                      value={delivery?.materialType || delivery?.description || "-"}
                      color="bg-purple-50 text-purple-600"
                    />
                    <DetailItem
                      icon={<MapPin />}
                      label="Project"
                      value={delivery?.project?.projectName || delivery?.project?.jobId || "-"}
                      color="bg-blue-50 text-blue-600"
                    />
                    <DetailItem
                      icon={<Package />}
                      label="Quantity"
                      value={formattedWeight}
                      color="bg-orange-50 text-orange-600"
                    />
                  </div>
                </div>

                {/* Plant Schedule */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Plant Schedule</h5>
                  <div className="space-y-3">
                    <DetailItem
                      icon={<Calendar />}
                      label="Arrival"
                      value={formatDateTime(delivery?.schedule?.deliveryDate, delivery?.schedule?.deliveryTime)}
                      color="bg-green-50 text-green-600"
                    />
                    <DetailItem
                      icon={<Calendar />}
                      label="Departure"
                      value={formatDateTime(delivery?.schedule?.pickupDate, delivery?.schedule?.pickupTime)}
                      color="bg-orange-50 text-orange-600"
                    />
                  </div>
                </div>

                {/* Carrier & Route */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Carrier & Route</h5>
                  <div className="space-y-3">
                    <DetailItem
                      icon={<Truck />}
                      label="Carrier"
                      value={delivery?.carrier?.email || delivery?.carrier?.phone || "-"}
                      color="bg-blue-50 text-blue-600"
                    />
                    <DetailItem
                      icon={<Truck />}
                      label={delivery?.carrier?.driverName ? `Driver: ${delivery.carrier.driverName}` : `POC: ${delivery?.receivingPoc || "-"}`}
                      value=""
                      color="bg-blue-50 text-blue-600"
                      hideLabel
                    />
                    <DetailItem
                      icon={<Phone />}
                      label={`Ph: ${delivery?.carrier?.driverPhone || delivery?.carrier?.phone || delivery?.pickupContactPhone || "-"}`}
                      value=""
                      color="bg-blue-50 text-blue-600"
                      hideLabel
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Weight Units */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Material Info</h5>
                  <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-[12px] p-3">
                    <p className="text-xs font-bold text-gray-700">
                      {formattedWeight}{delivery?.materialType ? ` • ${delivery.materialType}` : ""}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider leading-tight">
                      {delivery?.packageCount ? `${delivery.packageCount} Packages` : "-"}
                      {delivery?.loadingEquipment?.length ? ` • Equipment: ${delivery.loadingEquipment.join(", ")}` : ""}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Documents</h5>
                  <div className="flex gap-3">
                    <DocumentButton
                      label="Packing list"
                      onClick={() => downloadPackingListMutation.mutate()}
                      isLoading={downloadPackingListMutation.isPending}
                      disabled={!deliveryId || downloadPackingListMutation.isPending}
                    />
                    <DocumentButton
                      label="Bill of lading"
                      onClick={() => downloadBillOfLadingMutation.mutate()}
                      isLoading={downloadBillOfLadingMutation.isPending}
                      disabled={!deliveryId || downloadBillOfLadingMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mb-6">
                <h5 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Special Instructions</h5>
                <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-[12px] p-3">
                  <p className="text-xs font-bold text-gray-700 italic tracking-tight">
                    {delivery?.notes || (delivery?.loadingEquipment?.length ? `Loading equipment required: ${delivery.loadingEquipment.join(", ")}` : "No special instructions")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="px-6 py-1.5 border border-gray-200 rounded-[8px] text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors tracking-tight uppercase"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <SuccessModal
        open={!!successModalTitle}
        title={successModalTitle || ""}
        onClose={() => setSuccessModalTitle(null)}
      />
    </>
  );
}

function DetailItem({
  icon,
  label,
  value,
  color,
  hideLabel = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  hideLabel?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 ${color} rounded-[10px] flex items-center justify-center flex-shrink-0`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
      </div>
      <div className="overflow-hidden">
        {hideLabel ? (
          <p className="text-sm font-bold text-gray-700 truncate">{label}</p>
        ) : (
          <>
            <p className="text-[11px] font-bold text-gray-400 uppercase leading-tight">{label}</p>
            <p className="text-sm font-bold text-gray-700 truncate">{value}</p>
          </>
        )}
      </div>
    </div>
  );
}

function DocumentButton({
  label,
  onClick,
  isLoading,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between gap-4 px-4 py-3 border-[1.5px] border-[#3F69B0]/30 rounded-[12px] bg-[#F8FAFF] hover:bg-blue-50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-sm font-bold text-gray-700">{label}</span>
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
      ) : (
        <Download className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}

