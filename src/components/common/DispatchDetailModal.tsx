import { useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDispatchVerificationDetailsApi,
  verifyLoadApi,
  confirmDispatchApi,
} from "../../api/projects.api";
import toast from "react-hot-toast";
import Modal from "./Modal";

interface DispatchDetailModalProps {
  open: boolean;
  onClose: () => void;
  loadId: string | null;
}

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${weight.toLocaleString()} LBS`;
};

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function DispatchDetailModal({
  open,
  onClose,
  loadId,
}: DispatchDetailModalProps) {
  const queryClient = useQueryClient();
  const [actualWeightInput, setActualWeightInput] = useState<string>("");

  const {
    data: detailData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dispatchVerificationDetail", loadId],
    queryFn: () => getDispatchVerificationDetailsApi(loadId!),
    enabled: open && !!loadId,
  });

  const verifyLoadMutation = useMutation({
    mutationFn: (weight?: number) =>
      verifyLoadApi(
        loadId!,
        weight !== undefined ? { actualWeight: weight } : undefined,
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Load verified successfully");
      queryClient.invalidateQueries({
        queryKey: ["dispatchVerificationDetail", loadId],
      });
      queryClient.invalidateQueries({ queryKey: ["dispatchVerification"] });
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(errorMsg || "Failed to verify load");
    },
  });

  const confirmDispatchMutation = useMutation({
    mutationFn: () => confirmDispatchApi(loadId!),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Dispatch confirmed successfully");
      queryClient.invalidateQueries({
        queryKey: ["dispatchVerificationDetail", loadId],
      });
      queryClient.invalidateQueries({ queryKey: ["dispatchVerification"] });
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(errorMsg || "Failed to confirm dispatch");
    },
  });

  const show = open && Boolean(loadId);

  const loadDetail = detailData?.data?.data?.load;

  const displayLoadId = loadDetail?.loadId || "";
  const displayPackingListNo = loadDetail?.packingListNo || "-";
  const displayTruck = loadDetail?.truck || "-";
  const displayDestination = loadDetail?.destination || "-";
  const displayStatus = loadDetail?.status || "-";
  const displayProject = loadDetail?.project;

  const plannedWeight = loadDetail?.plannedWeight ?? 0;
  const weightVerified = loadDetail?.weightVerified ?? false;
  const loadingVerified = loadDetail?.loadingVerified ?? false;
  const isFullyVerified = weightVerified && loadingVerified;
  const isDispatched = displayStatus?.toLowerCase() === "dispatched";
  const bundles = loadDetail?.bundles || [];

  const handleVerifyLoad = () => {
    const parsedWeight = actualWeightInput
      ? parseFloat(actualWeightInput)
      : undefined;
    verifyLoadMutation.mutate(parsedWeight);
  };

  const handleConfirmDispatch = () => {
    if (!isFullyVerified && !isDispatched) {
      toast.error("Please verify the load before confirming dispatch.");
      return;
    }
    confirmDispatchMutation.mutate();
  };

  return (
    <Modal
      open={show}
      onClose={onClose}
      containerClassName="max-h-[90vh] max-w-5xl"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col space-y-8">
        {/* Header Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs uppercase tracking-wider w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              disabled={
                confirmDispatchMutation.isPending || isLoading || isDispatched
              }
              onClick={handleConfirmDispatch}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all ${
                isDispatched
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : !isFullyVerified
                    ? "bg-purple-300 text-white cursor-pointer hover:bg-purple-400"
                    : "bg-[#8B5CF6] text-white shadow-purple-100 hover:opacity-90"
              }`}
            >
              {confirmDispatchMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isDispatched ? "Dispatched" : "Confirm Dispatch"}
            </button>
            <button
              disabled={verifyLoadMutation.isPending || isLoading}
              onClick={handleVerifyLoad}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#6366F1] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-100 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {verifyLoadMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isFullyVerified ? "Re-Verify Load" : "Verify Load"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin" />
            <p className="text-sm font-bold text-gray-500">
              Loading dispatch verification details...
            </p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm font-bold text-red-500">
              Failed to load dispatch verification details. Please try again.
            </p>
          </div>
        ) : (
          <>
            {/* Grid Layout for Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Load Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                  Load Information
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Load ID
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {displayLoadId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Packing List No
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {displayPackingListNo}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Project
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {displayProject?.projectName
                        ? `${displayProject.projectName} (${displayProject.jobId})`
                        : displayProject?.jobId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Truck
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {displayTruck}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Destination
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {displayDestination || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Status
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {formatStatus(displayStatus)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Weight and Loading Verification */}
              <div className="space-y-8">
                {/* Weight Verification */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    Weight Verification
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Planned Weight
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {formatWeight(plannedWeight)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Actual Weight
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Scale weight (lbs)"
                          value={actualWeightInput}
                          onChange={(e) => setActualWeightInput(e.target.value)}
                          className="w-36 h-8 px-2.5 text-xs font-bold text-right bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          LBS
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-900">
                        Weight verified
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center ${weightVerified ? "bg-[#8B5CF6] text-white" : "bg-gray-200 text-gray-400"}`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Verification */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    Loading Verification
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-900">
                        Loading Verified
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center ${loadingVerified ? "bg-[#8B5CF6] text-white" : "bg-gray-200 text-gray-400"}`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bundle Verification List */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-gray-900">
                Bundle Verification List
              </h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto scroll-hide">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="bg-[#1C1F25] text-white">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider w-16">
                          #
                        </th>
                        {/* <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Bundle No</th> */}
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                          Bundle ID
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                          Weight
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                          Verified
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {bundles.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-xs font-bold text-gray-400"
                          >
                            No bundles assigned to this load.
                          </td>
                        </tr>
                      ) : (
                        bundles.map((bundle, idx) => (
                          <tr
                            key={bundle.bundleId}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-4 text-sm font-bold text-gray-400">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">
                              {bundle.bundleNo}
                            </td>
                            {/* <td className="px-4 py-4 text-sm font-bold text-gray-500">{bundle.bundleId}</td> */}
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">
                              {formatWeight(bundle.totalWeight)}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                              {formatStatus(bundle.status)}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span
                                className={
                                  bundle.verified
                                    ? "text-emerald-600 font-bold"
                                    : "text-gray-400 font-bold"
                                }
                              >
                                {bundle.verified ? "Verified" : "Unverified"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
