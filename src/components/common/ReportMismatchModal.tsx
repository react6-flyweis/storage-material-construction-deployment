import { useState, useEffect } from "react";
import { ArrowLeft, X, Loader2, ChevronDown } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { reportBundleMismatchApi, getBundleDetailsApi } from "../../api/projects.api";
import {
  MISMATCH_ITEM_STATUSES,
  type BundleDetailInfo,
  type BundleItem,
  type MismatchStatus,
} from "../../types/projects.types";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import Modal from "./Modal";

type ReportMismatchModalProps = {
  open: boolean;
  onClose: () => void;
  bundleId: string;
  bundle?: BundleDetailInfo | null;
  onSuccess: (message: string) => void;
};

export interface ItemMismatchState {
  _id: string;
  partCode: string;
  description: string;
  qty: number;
  color: string;
  receivedQty: number | string;
  status: MismatchStatus;
}

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const ALLOWED_STATUSES = Object.values(MISMATCH_ITEM_STATUSES);

export default function ReportMismatchModal({
  open,
  onClose,
  bundleId,
  bundle: bundleProp,
  onSuccess,
}: ReportMismatchModalProps) {
  const [mismatchNotes, setMismatchNotes] = useState("");
  const [itemsState, setItemsState] = useState<ItemMismatchState[]>([]);

  // Fetch bundle details if not passed as prop
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["bundleDetails", bundleId],
    queryFn: () => getBundleDetailsApi(bundleId),
    enabled: open && !bundleProp && !!bundleId,
  });

  const bundle = bundleProp || response?.data?.data?.bundle;

  // Initialize item states when bundle data is available
  useEffect(() => {
    if (bundle?.items && bundle.items.length > 0) {
      const initialItems: ItemMismatchState[] = bundle.items.map((item: BundleItem, index: number) => {
        const existingMismatch = bundle.mismatchItems?.find(
          (m) => m.itemId === item._id
        );

        const itemQty = item.qty ?? 0;
        return {
          _id: item._id || "",
          partCode: item.partCode || `ITEM-${index + 1}`,
          description: item.description || "-",
          qty: itemQty,
          color: item.color || "-",
          receivedQty: existingMismatch?.receivedQty ?? itemQty,
          status: (existingMismatch?.status as MismatchStatus) || MISMATCH_ITEM_STATUSES.RECEIVED,
        };
      });
      setItemsState(initialItems);
    } else {
      setItemsState([]);
    }
  }, [bundle]);

  const mismatchMutation = useMutation({
    mutationFn: (payload: { notes: string; items: any[] }) =>
      reportBundleMismatchApi(bundleId, payload),
    onSuccess: () => {
      onSuccess("Mismatch report submitted successfully.");
      setMismatchNotes("");
      onClose();
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(err?.response?.data?.message || "Failed to report mismatch");
    },
  });

  const handleClose = () => {
    onClose();
    setMismatchNotes("");
  };

  const handleQtyChange = (itemId: string, rawVal: string) => {
    setItemsState((prev) =>
      prev.map((item) => {
        if (item._id !== itemId) return item;

        if (rawVal === "") {
          return {
            ...item,
            receivedQty: "",
            status: MISMATCH_ITEM_STATUSES.NOT_RECEIVED,
          };
        }

        const numVal = Math.max(0, Number(rawVal));

        let newStatus: MismatchStatus = MISMATCH_ITEM_STATUSES.RECEIVED;
        if (numVal === 0) {
          newStatus = MISMATCH_ITEM_STATUSES.NOT_RECEIVED;
        } else if (numVal < item.qty) {
          newStatus = MISMATCH_ITEM_STATUSES.PARTIALLY_RECEIVED;
        } else {
          newStatus = MISMATCH_ITEM_STATUSES.RECEIVED;
        }

        return {
          ...item,
          receivedQty: numVal,
          status: newStatus,
        };
      })
    );
  };

  const handleStatusChange = (itemId: string, newStatus: MismatchStatus) => {
    setItemsState((prev) =>
      prev.map((item) => {
        if (item._id !== itemId) return item;

        let newReceivedQty = item.receivedQty;
        if (newStatus === MISMATCH_ITEM_STATUSES.RECEIVED) {
          newReceivedQty = item.qty;
        } else if (newStatus === MISMATCH_ITEM_STATUSES.NOT_RECEIVED) {
          newReceivedQty = 0;
        } else if (newStatus === MISMATCH_ITEM_STATUSES.PARTIALLY_RECEIVED) {
          const curr = Number(item.receivedQty) || 0;
          if (curr === item.qty || curr === 0) {
            newReceivedQty = item.qty > 1 ? item.qty - 1 : 1;
          }
        }

        return {
          ...item,
          status: newStatus,
          receivedQty: newReceivedQty,
        };
      })
    );
  };

  const handleSubmitReport = () => {
    if (itemsState.length === 0) {
      toast.error("No items found in bundle to report mismatch for.");
      return;
    }

    // Client-side validation for ObjectId & status enum
    for (const item of itemsState) {
      if (!item._id || !OBJECT_ID_REGEX.test(item._id)) {
        toast.error(
          `Invalid Item ID for "${item.partCode}". Item ID must be a valid 24-character ObjectId.`
        );
        return;
      }

      if (!ALLOWED_STATUSES.includes(item.status as MismatchStatus)) {
        toast.error(
          `Invalid status "${item.status}" for "${item.partCode}". Allowed statuses: ${ALLOWED_STATUSES.join(", ")}.`
        );
        return;
      }

      const numReceived = Number(item.receivedQty);
      if (isNaN(numReceived) || numReceived < 0) {
        toast.error(
          `Received quantity for "${item.partCode}" must be a non-negative number.`
        );
        return;
      }
    }

    const formattedItems = itemsState.map((it) => ({
      itemId: it._id,
      partCode: it.partCode,
      description: it.description,
      qty: it.qty,
      receivedQty: Number(it.receivedQty) || 0,
      status: it.status,
    }));

    mismatchMutation.mutate({
      notes: mismatchNotes,
      items: formattedItems,
    });
  };

  return (
    <Modal open={open} onClose={handleClose} containerClassName="max-w-4xl">
      {/* Close Icon */}
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col">
        {/* Header Action Row matching BundleDetailsModal */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h2 className="text-xl font-bold text-gray-900">Report Mismatch</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmitReport}
              disabled={mismatchMutation.isPending}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mismatchMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Report
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-gray-500">Loading bundle details...</p>
          </div>
        ) : error || !bundle ? (
          <div className="text-center py-20">
            <p className="text-sm font-bold text-red-500">Failed to load bundle details. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Main Content Sections matching BundleDetailsModal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-8">
              {/* Bundle Information */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bundle Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bundle ID</span>
                    <span className="text-sm font-bold text-gray-900">{bundle.bundleNo}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Project</span>
                    <span className="text-sm font-bold text-gray-900">{bundle.project?.projectName || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Job ID</span>
                    <span className="text-sm font-bold text-gray-900">{bundle.project?.jobId || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Packing List No</span>
                    <span className="text-sm font-bold text-gray-900">{bundle.packingList?.packingListNo || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Bundle Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bundle Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Type</span>
                    <span className="text-sm font-bold text-gray-900">{formatStatus(bundle.bundleType)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Title</span>
                    <span className="text-sm font-bold text-gray-900">{bundle.title || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Quantity</span>
                    <span className="text-sm font-bold text-gray-900">{bundle.totalQty}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Weight</span>
                    <span className="text-sm font-bold text-gray-900">
                      {bundle.totalWeight
                        ? `${Number(bundle.totalWeight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LBS`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mismatch Items Table */}
            <div className="mt-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Items</h3>
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1C1F25] text-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Item Code</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Color</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Enter Received Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {itemsState.length > 0 ? (
                      itemsState.map((item, index) => (
                        <tr key={item._id || index} className="hover:bg-gray-50/50 transition-colors">
                          {/* Item Code */}
                          <td className="px-4 py-4 text-sm font-bold text-gray-700">
                            <span className="text-[#1D51A4] font-bold">{item.partCode}</span>
                          </td>

                          {/* Name */}
                          <td className="px-4 py-4 text-sm font-bold text-gray-700">
                            {item.description}
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                            {item.qty}
                          </td>

                          {/* Color */}
                          <td className="px-4 py-4 text-sm font-medium text-gray-500">
                            {item.color}
                          </td>

                          {/* Enter Received Quantity */}
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              value={item.receivedQty}
                              onChange={(e) => handleQtyChange(item._id, e.target.value)}
                              className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] shadow-sm"
                            />
                          </td>

                          {/* Action Dropdown */}
                          <td className="px-4 py-4">
                            <div className="relative inline-block w-40">
                              <select
                                value={item.status}
                                onChange={(e) =>
                                  handleStatusChange(item._id, e.target.value as MismatchStatus)
                                }
                                className={`w-full appearance-none px-3.5 py-1.5 pr-8 rounded-lg text-xs font-bold text-white cursor-pointer shadow-sm focus:outline-none transition-colors ${
                                  item.status === "Received"
                                    ? "bg-[#10B981] hover:bg-[#059669]"
                                    : item.status === "Partially Received"
                                    ? "bg-[#F59E0B] hover:bg-[#D97706]"
                                    : "bg-[#EF4444] hover:bg-[#DC2626]"
                                }`}
                              >
                                <option value="Received" className="bg-white text-gray-800 font-semibold">
                                  Received
                                </option>
                                <option
                                  value="Partially Received"
                                  className="bg-white text-gray-800 font-semibold"
                                >
                                  Partially Received
                                </option>
                                <option
                                  value="Not Received"
                                  className="bg-white text-gray-800 font-semibold"
                                >
                                  Not Received
                                </option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-white absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-sm text-gray-500 font-medium">
                          No items found in this bundle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mismatch Notes */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mismatch Notes</h3>
              <textarea
                placeholder="Describe any mismatch details or comments..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-3 outline-none resize-none text-sm text-gray-800 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                value={mismatchNotes}
                onChange={(e) => setMismatchNotes(e.target.value)}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={mismatchMutation.isPending}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mismatchMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Report Mismatch
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
