import { useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPackingListDetailsApi,
  downloadPackingListPdfApi,
  exportPackingListsApi,
  markPackingListReadyApi,
  markPackingListLoadingApi,
  markPackingListDispatchApi,
} from "../../api/projects.api";
import type { PackingListBundleItem } from "../../types/projects.types";
import Modal from "./Modal";
import SuccessModal from "./SuccessModal";

interface DisplayBundleItem extends Partial<PackingListBundleItem> {
  _id?: string;
  bundleNo: string;
  status?: string;
}

interface PackingListDetailModalProps {
  open: boolean;
  onClose: () => void;
  packingListId: string | null;
}

const formatWeight = (weight?: number | null) => {
  if (weight === undefined || weight === null) return "-";
  return `${weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LBS`;
};

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function PackingListDetailModal({ open, onClose, packingListId }: PackingListDetailModalProps) {
  const queryClient = useQueryClient();
  const [successModalTitle, setSuccessModalTitle] = useState<string | null>(null);

  const { data: detailData, isLoading: isDetailLoading, error: detailError } = useQuery({
    queryKey: ["packingListDetail", packingListId],
    queryFn: () => getPackingListDetailsApi(packingListId!),
    enabled: open && !!packingListId,
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () => downloadPackingListPdfApi(packingListId!),
    onSuccess: (res) => {
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PackingList_${packingListId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessModalTitle("PDF downloaded successfully");
    },
    onError: () => { },
  });

  const exportExcelMutation = useMutation({
    mutationFn: () => exportPackingListsApi(),
    onSuccess: (res) => {
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "PackingLists_Export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessModalTitle("Packing lists exported successfully");
    },
    onError: () => { },
  });

  const markReadyMutation = useMutation({
    mutationFn: () => markPackingListReadyApi(packingListId!),
    onSuccess: (res) => {
      setSuccessModalTitle(res.data?.message || "Packing list marked as Ready");
      queryClient.invalidateQueries({ queryKey: ["packingListDetail", packingListId] });
      queryClient.invalidateQueries({ queryKey: ["packingLists"] });
    },
    onError: () => { },
  });

  const markLoadingMutation = useMutation({
    mutationFn: () => markPackingListLoadingApi(packingListId!),
    onSuccess: (res) => {
      setSuccessModalTitle(res.data?.message || "Packing list marked as Loading");
      queryClient.invalidateQueries({ queryKey: ["packingListDetail", packingListId] });
      queryClient.invalidateQueries({ queryKey: ["packingLists"] });
    },
    onError: () => { },
  });

  const markDispatchMutation = useMutation({
    mutationFn: () => markPackingListDispatchApi(packingListId!),
    onSuccess: (res) => {
      setSuccessModalTitle(res.data?.message || "Packing list marked as Dispatched");
      queryClient.invalidateQueries({ queryKey: ["packingListDetail", packingListId] });
      queryClient.invalidateQueries({ queryKey: ["packingLists"] });
    },
    onError: () => { },
  });

  const show = open && Boolean(packingListId);

  const detail = detailData?.data?.data?.packingList;
  const currentPackingListNo = detail?.packingListNo || "-";
  const currentTruck = detail?.truck || "-";
  const currentDestination = detail?.destination || "-";
  const currentTotalBundles = detail?.totalBundles ?? 0;
  const currentTotalWeight = detail?.totalWeight;
  const currentProjectName = detail?.project?.projectName || "-";
  const currentJobId = detail?.project?.jobId || "-";
  const bundles = detail?.bundles || [];

  const allBundleItems: DisplayBundleItem[] = bundles.flatMap((bundle) => {
    if (!bundle.items || bundle.items.length === 0) {
      return [{
        _id: bundle._id,
        bundleNo: bundle.bundleNo || bundle._id,
        partCode: "",
        description: "-",
        qty: undefined,
        lengthFeet: null,
        totalWeight: bundle.totalWeight,
        weight: bundle.totalWeight,
        markIds: [] as string[],
        status: bundle.status
      }];
    }
    return bundle.items.map((item) => ({
      ...item,
      bundleNo: bundle.bundleNo || bundle._id,
      status: bundle.status
    }));
  });

  // Calculate total items across all bundles
  const totalItemsCount = bundles.reduce((acc, bundle) => {
    if (bundle.items && Array.isArray(bundle.items)) {
      return acc + bundle.items.reduce((itemAcc, item) => itemAcc + (item.qty || 0), 0);
    }
    return acc;
  }, 0);

  return (
    <>
      <Modal
        open={show}
        onClose={onClose}
        containerClassName="p-6 max-h-[85vh] max-w-5xl"
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs uppercase tracking-wider w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <button
                disabled={downloadPdfMutation.isPending || !packingListId}
                onClick={() => downloadPdfMutation.mutate()}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
              >
                {downloadPdfMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Download PDF
              </button>
              <button
                onClick={() => setSuccessModalTitle("Printing Packing List...")}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Print Packing List
              </button>
              <button
                disabled={exportExcelMutation.isPending}
                onClick={() => exportExcelMutation.mutate()}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
              >
                {exportExcelMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Export Excel
              </button>
              {/* <button
                onClick={() => setSuccessModalTitle("Printing Selected Bundles...")}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Print Selected
              </button> */}
              {/* Dynamic Status Transition Action Button */}
              {(() => {
                const currentStatus = (detail?.status || "").toLowerCase();

                // Order: draft / pending / initial -> ready -> loading -> dispatched
                if (currentStatus === "dispatched") {
                  return null; // Fully dispatched; no further step
                }

                if (currentStatus === "loading") {
                  return (
                    <button
                      disabled={markDispatchMutation.isPending || !packingListId}
                      onClick={() => markDispatchMutation.mutate()}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {markDispatchMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      Mark Dispatch
                    </button>
                  );
                }

                if (currentStatus === "ready") {
                  return (
                    <button
                      disabled={markLoadingMutation.isPending || !packingListId}
                      onClick={() => markLoadingMutation.mutate()}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {markLoadingMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      Mark Loading
                    </button>
                  );
                }

                // Default / draft / pending status -> Next step is Mark Ready
                return (
                  <button
                    disabled={markReadyMutation.isPending || !packingListId}
                    onClick={() => markReadyMutation.mutate()}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {markReadyMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Mark Ready
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Load Information and Packing Summary grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Load Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Load Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Packing List ID</span>
                  {isDetailLoading ? (
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    <span className="text-xs font-bold text-gray-900">{currentPackingListNo}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job ID</span>
                  {isDetailLoading ? (
                    <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    <span className="text-xs font-bold text-gray-900">{currentJobId || "-"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project</span>
                  {isDetailLoading ? (
                    <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    <span className="text-xs font-bold text-gray-900">{currentProjectName}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Truck</span>
                  {isDetailLoading ? (
                    <div className="h-4 w-28 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    <span className="text-xs font-bold text-gray-900">{currentTruck}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destination</span>
                  {isDetailLoading ? (
                    <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    <span className="text-xs font-bold text-gray-900">{currentDestination}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  {isDetailLoading ? (
                    <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    <span className="text-xs font-bold text-gray-900 capitalize">{formatStatus(detail?.status)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Packing Summary & Loading Verification */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Packing Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bundles</span>
                    {isDetailLoading ? (
                      <div className="h-4 w-12 bg-gray-100 animate-pulse rounded" />
                    ) : (
                      <span className="text-xs font-bold text-gray-900">{currentTotalBundles}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Items</span>
                    {isDetailLoading ? (
                      <div className="h-4 w-12 bg-gray-100 animate-pulse rounded" />
                    ) : (
                      <span className="text-xs font-bold text-gray-900">{totalItemsCount}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total weight</span>
                    {isDetailLoading ? (
                      <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
                    ) : (
                      <span className="text-xs font-bold text-gray-900">{formatWeight(currentTotalWeight)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Loading Verification</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-900">All Bundles Present</span>
                    <div className="w-5 h-5 bg-[#7C3AED] text-white rounded-md flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-900">QR Labels Verified</span>
                    <div className="w-5 h-5 bg-[#7C3AED] text-white rounded-md flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-900">Packing List Matches Load</span>
                    <div className="w-5 h-5 bg-[#7C3AED] text-white rounded-md flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Items */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xl font-bold text-gray-900">Bundle Items</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto scroll-hide">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-[#1C1F25] text-white">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider w-16">#</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Bundle ID</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Part Code / Description</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Length</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Weight</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Mark IDs / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {isDetailLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-100 rounded" /></td>
                          <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                          <td className="px-4 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                          <td className="px-4 py-4"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
                          <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                          <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                          <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                        </tr>
                      ))
                    ) : detailError ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <p className="text-xs font-bold text-red-500">Failed to load detail data.</p>
                        </td>
                      </tr>
                    ) : allBundleItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <p className="text-xs font-bold text-gray-400">No bundle items in this packing list.</p>
                        </td>
                      </tr>
                    ) : (
                      allBundleItems.map((item, idx) => {
                        const partDesc = item.partCode
                          ? `${item.partCode}${item.description ? ` - ${item.description}` : ""}`
                          : item.description || "-";
                        const weightVal = item.totalWeight ?? item.weight;
                        const markIdsText = item.markIds && item.markIds.length > 0 ? item.markIds.join(", ") : formatStatus(item.status);

                        return (
                          <tr key={item._id || idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">{item.bundleNo}</td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">{partDesc}</td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">{item.qty ?? "-"}</td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-500">
                              {item.lengthFeet !== undefined && item.lengthFeet !== null ? `${Number(item.lengthFeet).toFixed(2)} ft` : "-"}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">{formatWeight(weightVal)}</td>
                            <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                              {markIdsText}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <SuccessModal
        open={Boolean(successModalTitle)}
        title={successModalTitle || ""}
        onClose={() => setSuccessModalTitle(null)}
      />
    </>
  );
}
