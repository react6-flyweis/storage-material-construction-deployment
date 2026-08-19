import {
  Info,
  Truck,
  Package,
  CheckSquare,
  ChevronDown,
  Download,
  MapPin,
  Calendar,
  User,
  Clock,
  QrCode,
  // Plus,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDeliveriesApi, markDeliveryReceivedApi, markDeliveryPartialApi } from "../api/projects.api";
import UpdateSiteContactModal from "../components/common/UpdateSiteContactModal";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import BundleDetailsModal from "../components/common/BundleDetailsModal";
import DeliveryDetailsModal from "../components/materials/DeliveryDetailsModal";
import AddDeliveryDrawer from "../components/materials/AddDeliveryDrawer";
import MarkPartialModal from "../components/materials/MarkPartialModal";

export default function DeliveryTracking() {
  const [updateContactOpen, setUpdateContactOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedProjectId, setScannedProjectId] = useState<string | undefined>();
  const [resultOpen, setResultOpen] = useState(false);
  const [scannedBundleId, setScannedBundleId] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<{ id: string; number: string } | null>(null);
  const [selectedContactDelivery, setSelectedContactDelivery] = useState<{
    id: string;
    number: string;
    projectName?: string;
  } | null>(null);


  const queryClient = useQueryClient();

  const { data: deliveriesData, isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: getDeliveriesApi,
  });

  const markReceivedMutation = useMutation({
    mutationFn: markDeliveryReceivedApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });

  const markPartialMutation = useMutation({
    mutationFn: ({ deliveryId, notes }: { deliveryId: string; notes?: string }) =>
      markDeliveryPartialApi(deliveryId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });

  const apiStats = deliveriesData?.data?.data?.stats;
  const deliveriesList = deliveriesData?.data?.data?.deliveries || [];

  const stats = [
    { label: "In Transit", value: apiStats?.inTransit ?? 0, icon: Truck, bg: "bg-[#1D51A4]", sub: "Arriving at Plant" },
    { label: "Staged", value: apiStats?.staged ?? 0, icon: Package, bg: "bg-[#3AB449]", sub: "At Plant/Yard" },
    { label: "Ready", value: apiStats?.ready ?? 0, icon: CheckSquare, bg: "bg-[#F97316]", sub: "For Departure" },
    { label: "Total Today", value: apiStats?.totalToday ?? 0, icon: Package, bg: "bg-[#4B5563]", sub: "All Deliveries" },
  ];

  const deliveries = deliveriesList.map((item) => {
    const badges = [];

    // Map API status to UI labels and bg
    let statusLabel = item.status || "-";
    let statusBg = "bg-gray-400 text-white";

    if (item.status === "in_transit") {
      statusLabel = "In Transit to Plant";
      statusBg = "bg-[#1D51A4] text-white";
    } else if (item.status === "staged") {
      statusLabel = "Staged at Plant";
      statusBg = "bg-[#3AB449] text-white";
    } else if (item.status === "ready") {
      statusLabel = "Ready for Departure";
      statusBg = "bg-[#F97316] text-white";
    } else if (item.status === "confirmed") {
      statusLabel = "Confirmed";
      statusBg = "bg-emerald-500 text-white";
    } else if (item.status === "delivered") {
      statusLabel = "Delivered";
      statusBg = "bg-gray-500 text-white";
    } else if (item.status === "bidding_sent") {
      statusLabel = "Bidding Sent";
      statusBg = "bg-blue-400 text-white";
    } else if (item.status === "carrier_selected") {
      statusLabel = "Carrier Selected";
      statusBg = "bg-purple-500 text-white";
    }

    badges.push({ label: statusLabel, bg: statusBg });

    // Show ETA badge if deliveryTime or timings exist
    if (item.schedule?.deliveryTime) {
      badges.push({
        label: `ETA ${item.schedule.deliveryTime}`,
        bg: "bg-[#FEFCE8] text-yellow-700",
        icon: Clock
      });
    } else if (item.schedule?.timings) {
      badges.push({
        label: item.schedule.timings,
        bg: "bg-[#FEFCE8] text-yellow-700",
        icon: Clock
      });
    }

    // Format load weight
    const formattedWeight = item.loadWeight
      ? `${Number(item.loadWeight).toLocaleString()} lbs`
      : "-";

    // Format pickup date/time
    let pickupStr = "-";
    if (item.schedule?.pickupDate) {
      const pDate = new Date(item.schedule.pickupDate);
      const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const formattedDate = pDate.toLocaleDateString('en-US', dateOptions);
      pickupStr = `${formattedDate}${item.schedule.pickupTime ? `, ${item.schedule.pickupTime}` : ""}`;
    }

    // Format delivery date/time
    let deliveryStr = "-";
    if (item.schedule?.deliveryDate) {
      const dDate = new Date(item.schedule.deliveryDate);
      const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const formattedDate = dDate.toLocaleDateString('en-US', dateOptions);
      deliveryStr = `${formattedDate}${item.schedule.deliveryTime ? `, ${item.schedule.deliveryTime}` : ""}`;
    }

    // Determine carrier info
    const carrierName = item.carrier?.email || item.carrier?.driverName || "-";
    const driverName = item.carrier?.driverName || "-";
    const truckId = item.carrier?.truckNumber || "-";
    const phone = item.carrier?.driverPhone || item.carrier?.phone || "-";

    return {
      deliveryId: item.deliveryId,
      status: item.status,
      id: item.deliveryNumber || "-",
      title: item.materialType || item.description || "Delivery",
      subtitle: item.project?.projectName || item.project?.jobId || "-",
      leadId: item.project?.leadId || "",
      badges,
      material: {
        qty: formattedWeight,
        area: item.stagingArea || "-"
      },
      schedule: {
        arrival: deliveryStr,
        departure: pickupStr
      },
      carrier: {
        name: carrierName,
        address: item.deliveryLocation || "-"
      },
      truck: {
        id: truckId,
        driver: driverName,
        phone: phone
      },
      notes: item.notes || "-"
    };
  });

  return (
    <div className="mx-auto pb-10 space-y-6">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Delivery Tracking
          </h1>
          <p className="text-[13px] font-bold text-gray-500">
            Read-only view of deliveries routed through plant/yard/warehouse
          </p>
        </div>
        {/* <button
          onClick={() => setAddDeliveryOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1D51A4] text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Delivery
        </button> */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} rounded-xl p-4 text-white flex justify-between items-center shadow-lg shadow-blue-200/20`}
          >
            <div>
              <p className="text-[9px] font-bold opacity-70 uppercase mb-0.5 tracking-wider">
                {stat.label}
              </p>
              {isLoading ? (
                <div className="h-8 w-12 bg-white/20 rounded animate-pulse my-0.5" />
              ) : (
                <h3 className="text-2xl font-bold mb-0.5 tracking-tight">{stat.value}</h3>
              )}
              <p className="text-[9px] font-bold opacity-60 italic">{stat.sub}</p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-lg">
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <ChevronDown className="w-4 h-4" />
            Filter
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <p className="sm:ml-auto text-xs font-bold text-gray-400 italic">
          Last updated: Just now
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#EFF6FF] border border-blue-100 rounded-[18px] p-4 flex items-start gap-3 shadow-sm">
        <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-900 mb-0.5 uppercase tracking-tight">
            Read-Only Access
          </h4>
          <p className="text-[11px] font-bold text-blue-700 leading-relaxed opacity-80">
            This is a read-only view for plant coordination. You can view deliveries routed through the plant/yard/warehouse but cannot modify delivery information.
          </p>
        </div>
      </div>

      {/* Delivery Cards */}
      <div className="space-y-6">
        {isLoading ? (
          // Skeleton Cards
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-[20px] shadow-sm border border-gray-50 overflow-hidden p-4 sm:p-6 animate-pulse"
            >
              {/* Card Header Skeleton */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
                <div className="flex items-start gap-4 w-full">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="h-5 w-48 bg-gray-200 rounded" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-4 bg-gray-200 rounded" />
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="h-9 w-28 bg-gray-200 rounded-lg self-start lg:self-auto w-full lg:w-auto" />
              </div>

              {/* Details Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[1, 2, 3, 4].map((col) => (
                  <div key={col} className="space-y-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="h-2 w-10 bg-gray-200 rounded" />
                          <div className="h-3.5 w-24 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="h-2 w-10 bg-gray-200 rounded" />
                          <div className="h-3.5 w-24 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 text-center border border-gray-50 shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-gray-900 mb-1">No Deliveries Found</h3>
            <p className="text-xs text-gray-500">There are no deliveries scheduled or tracked currently.</p>
          </div>
        ) : (
          deliveries.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-[20px] shadow-sm border border-gray-50 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                {/* Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#1D51A4] rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">
                          {item.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item?.badges?.map((badge, j) => {
                            const Icon = badge.icon
                            return (
                              <span
                                key={j}
                                className={`${badge.bg} text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1`}
                              >

                                {Icon && <Icon className="w-2.5 h-2.5" />}
                                {badge.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">{item.subtitle}</p>
                        </div>
                        <span className="hidden sm:inline text-gray-200">|</span>
                        <p className="text-[10px] font-bold text-gray-900 leading-none">ID: {item.id}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDetailId(item.deliveryId);
                      setDetailsOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 rounded-lg text-[9px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-all shadow-sm w-full lg:w-auto"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                      Material Details
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Quantity</p>
                          <p className="text-[13px] font-bold text-gray-900">
                            {item.material.qty}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Staging Area
                          </p>
                          <p className="text-[13px] font-bold text-gray-900">
                            {item.material.area}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                      Schedule
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Arrival
                          </p>
                          <p className="text-[13px] font-bold text-gray-900">
                            {item.schedule.arrival}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Departure
                          </p>
                          <p className="text-[13px] font-bold text-gray-900">
                            {item.schedule.departure}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                      Carrier & Route
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Carrier
                          </p>
                          <p className="text-[13px] font-bold text-gray-900 leading-tight">
                            {item.carrier.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Destination
                          </p>
                          <p className="text-[13px] font-bold text-gray-900 leading-tight">
                            {item.carrier.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                        Notes
                      </h5>
                      <div className="bg-[#FFFBEB] border border-yellow-100 rounded-xl p-3.5">
                        <p className="text-[11px] font-bold text-yellow-800 leading-tight">
                          {item.notes}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Truck</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">{item.truck.id}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Driver</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">{item.truck.driver}</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">Phone</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">{item.truck.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons Grid */}
                {item.status !== "delivered" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => markReceivedMutation.mutate(item.deliveryId)}
                      disabled={markReceivedMutation.isPending}
                      className="bg-[#10B981] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      {markReceivedMutation.isPending ? "Marking..." : "Mark as Received"}
                    </button>
                    <button
                      onClick={() => {
                        setScannedProjectId(item.leadId);
                        setScanOpen(true);
                      }}
                      className="bg-[#F97316] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Scan QR Code
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDelivery({ id: item.deliveryId, number: item.id });
                        setPartialOpen(true);
                      }}
                      disabled={markPartialMutation.isPending}
                      className="bg-[#1D51A4] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {markPartialMutation.isPending ? "Marking..." : "Partial Received"}
                    </button>
                  </div>
                )}

                {/* Links Footer */}
                <div className="flex items-center gap-3 border-t border-gray-50 pt-6">
                  <button
                    onClick={() => {
                      setSelectedContactDelivery({
                        id: item.deliveryId,
                        number: item.id,
                        projectName: item.subtitle,
                      });
                      setUpdateContactOpen(true);
                    }}
                    className="flex items-center gap-2 text-[9px] font-bold text-[#8B5CF6] border border-purple-50 rounded-lg px-4 py-2 uppercase tracking-wider hover:bg-purple-50 transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    Update Site Contact
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <UpdateSiteContactModal
        open={updateContactOpen}
        onClose={() => {
          setUpdateContactOpen(false);
          setSelectedContactDelivery(null);
        }}
        deliveryId={selectedContactDelivery?.id}
        deliveryNumber={selectedContactDelivery?.number}
        projectName={selectedContactDelivery?.projectName}
      />
      <ScanQRCodeModal
        open={scanOpen}
        onClose={() => {
          setScanOpen(false);
          setScannedProjectId(undefined);
        }}
        projectId={scannedProjectId}
        onScanSuccess={(bundleId) => {
          setScannedBundleId(bundleId);
          setResultOpen(true);
        }}
      />
      <BundleDetailsModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        bundleId={scannedBundleId}
        onBack={() => {
          setResultOpen(false);
          setScanOpen(true);
        }}
      />
      <DeliveryDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedDetailId(null);
        }}
        deliveryId={selectedDetailId}
      />
      <AddDeliveryDrawer open={addDeliveryOpen} onClose={() => setAddDeliveryOpen(false)} />
      <MarkPartialModal
        open={partialOpen}
        onClose={() => {
          setPartialOpen(false);
          setSelectedDelivery(null);
        }}
        deliveryId={selectedDelivery?.id || ""}
        deliveryNumber={selectedDelivery?.number || ""}
        onConfirm={(notes) => {
          if (selectedDelivery) {
            markPartialMutation.mutate(
              { deliveryId: selectedDelivery.id, notes },
              {
                onSuccess: () => {
                  setPartialOpen(false);
                  setSelectedDelivery(null);
                },
              }
            );
          }
        }}
        isPending={markPartialMutation.isPending}
      />
    </div>
  );
}
