import { ArrowLeft, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getBundleDetailsApi,
  verifyBundleApi,
  // markBundleStagedApi,
  // markBundleLoadedApi,
  reprintBundleLabelApi,
} from "../../api/projects.api";
import ReportMismatchModal from "./ReportMismatchModal";
import SuccessModal from "./SuccessModal";
import Modal from "./Modal";
import QRCodeDataModal from "./QRCodeDataModal";
import { getQRCodeUrl, formatValue } from "../../lib/utils";

type BundleDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  bundleId: string;
  onBack?: () => void;
};

export default function BundleDetailsModal({ open, onClose, bundleId, onBack }: BundleDetailsModalProps) {
  const queryClient = useQueryClient();
  const [isMismatchModalOpen, setIsMismatchModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["bundleDetails", bundleId],
    queryFn: () => getBundleDetailsApi(bundleId),
    enabled: open && !!bundleId,
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyBundleApi(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundleDetails", bundleId] });
      setSuccessModalTitle("Bundle Verified Successfully!");
      setSuccessModalOpen(true);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to verify bundle");
    },
  });

  // const stageMutation = useMutation({
  //   mutationFn: () => markBundleStagedApi(bundleId),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["bundleDetails", bundleId] });
  //     setSuccessModalTitle("Bundle Marked as Staged!");
  //     setSuccessModalOpen(true);
  //   },
  //   onError: (err: any) => {
  //     toast.error(err?.response?.data?.message || "Failed to mark bundle as staged");
  //   },
  // });

  // const loadMutation = useMutation({
  //   mutationFn: () => markBundleLoadedApi(bundleId),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["bundleDetails", bundleId] });
  //     setSuccessModalTitle("Bundle Marked as Loaded!");
  //     setSuccessModalOpen(true);
  //   },
  //   onError: (err: any) => {
  //     toast.error(err?.response?.data?.message || "Failed to mark bundle as loaded");
  //   },
  // });

  const reprintMutation = useMutation({
    mutationFn: () => reprintBundleLabelApi(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundleDetails", bundleId] });
      setSuccessModalTitle("Label Reprinted Successfully!");
      setSuccessModalOpen(true);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to reprint label");
    },
  });

  if (!open) return null;

  const bundle = response?.data?.data?.bundle;

  const targetBundleId = bundle?.bundleId || bundleId || bundle?.bundleNo || "";
  const partsList =
    bundle?.items
      ?.map((item) => item.partCode)
      .filter(Boolean)
      .join(", ") || "";

  const qrDataObj = bundle
    ? {
        project: (bundle.project?.projectName || "").replace(/\s+/g, ""),
        shipper: bundle.project?.jobId || "",
        load_id: bundle.packingList?.packingListNo || "",
        bundle_id: bundle.bundleNo || targetBundleId,
        parts: partsList.replace(/\s+/g, ""),
        weight: formatValue(bundle.totalWeight),
        length: formatValue(bundle.maxLengthFeet),
      }
    : "";

  const standaloneBase = import.meta.env.VITE_STANDLONE_PAGE_BASE || "";
  const qrCodeUrl = targetBundleId
    ? getQRCodeUrl(`${standaloneBase.replace(/\/+$/, "")}/bundle/${targetBundleId}`, "250x250")
    : bundle
    ? getQRCodeUrl(qrDataObj, "250x250")
    : "";

  const formatStatus = (status?: string) => {
    if (!status) return "-";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        containerClassName="max-w-4xl"
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          {/* Header Action Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
            <button
              onClick={onBack || onClose}
              className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => toast.success("Downloading bundle summary...")}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Download
              </button>
              <button
                onClick={() => reprintMutation.mutate()}
                disabled={reprintMutation.isPending}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reprintMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Reprint Label
              </button>
              <button
                onClick={() => setIsMismatchModalOpen(true)}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Report Mismatch
              </button>
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Verify Bundle
              </button>
              {/* <button
                onClick={() => loadMutation.mutate()}
                disabled={loadMutation.isPending}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Mark Loaded
              </button>
              <button
                onClick={() => stageMutation.mutate()}
                disabled={stageMutation.isPending}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stageMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Mark Staged
              </button> */}
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
              {/* Main Content Sections */}
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
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Truck Type</span>
                      <span className="text-sm font-bold text-gray-900">{bundle.packingList?.truckLabel || bundle.packingList?.truckType || "-"}</span>
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
                        {bundle.totalWeight ? `${Number(bundle.totalWeight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LBS` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Max Length</span>
                      <span className="text-sm font-bold text-gray-900">
                        {bundle.maxLengthFeet ? `${Number(bundle.maxLengthFeet).toFixed(2)} FT` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code and Context Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-8">
                {/* Scanned QR Code Panel */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Scanned QR Code</h3>
                  <div className="flex items-start gap-6">
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="w-30 h-30 border border-gray-200 p-2 rounded-lg bg-white shadow-sm shrink-0 flex items-center justify-center hover:border-purple-300 hover:shadow-md transition-all group relative cursor-pointer"
                      title="Click to view QR label preview"
                    >
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt={`QR Code for bundle ${bundle.bundleNo || bundleId}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-gray-400 font-medium">No QR Code</div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 mb-2 truncate">project={bundle.project?.projectName?.replace(/\s+/g, '') || "-"}</h4>
                      <div className="space-y-1 text-xs">
                        <p className="text-gray-400 font-semibold truncate">Packing List : <span className="text-gray-800 font-bold">{bundle.packingList?.packingListNo}</span></p>
                        <p className="text-gray-400 font-semibold truncate">Bundle No : <span className="text-gray-800 font-bold">{bundle.bundleNo}</span></p>
                        <p className="text-gray-400 font-semibold truncate">Title : <span className="text-gray-800 font-bold">{bundle.title}</span></p>
                        <p className="text-gray-400 font-semibold truncate">Weight : <span className="text-gray-800 font-bold">{bundle.totalWeight ? `${Number(bundle.totalWeight).toFixed(2)} LBS` : "-"}</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Verification Panel */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Bundle Verification Status</h3>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-4">
                      <span className="text-sm font-bold text-gray-900">Verification Status</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                          ${bundle.verified ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}
                        `}>
                        {bundle.verified ? "Verified" : "Pending Verification"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Current Status</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-wider">Status</span>
                      <span className="text-right font-bold text-gray-900">{formatStatus(bundle.status)}</span>

                      <span className="text-gray-400 font-bold uppercase tracking-wider">Printed</span>
                      <span className="text-right font-bold text-gray-900">{bundle.labelPrinted ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bundle Items Table */}
              <div className="mt-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bundle Items</h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#1C1F25] text-white">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Part Code / Description</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Length</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Weight</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Mark IDs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {bundle.items?.map((item, index) => (
                        <tr key={item._id || index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 text-sm font-bold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-700">
                            {item.partCode ? (
                              <span>
                                <span className="text-[#1D51A4] font-bold">{item.partCode}</span>
                                {item.description ? ` - ${item.description}` : ""}
                              </span>
                            ) : (
                              item.description || "-"
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-600">{item.qty ?? "-"}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-500">
                            {item.lengthFeet !== undefined && item.lengthFeet !== null ? `${Number(item.lengthFeet).toFixed(2)} FT` : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-700">
                            {item.totalWeight || item.weight
                              ? `${Number(item.totalWeight || item.weight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LBS`
                              : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-500">
                            {item.markIds?.join(", ") || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Report Mismatch Modal */}
      <ReportMismatchModal
        open={isMismatchModalOpen}
        onClose={() => setIsMismatchModalOpen(false)}
        bundleId={bundleId}
        bundle={bundle}
        onSuccess={(message) => {
          queryClient.invalidateQueries({ queryKey: ["bundleDetails", bundleId] });
          setSuccessModalTitle(message);
          setSuccessModalOpen(true);
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        open={successModalOpen}
        title={successModalTitle}
        onClose={() => setSuccessModalOpen(false)}
      />

      {/* QR Code Data Modal */}
      {bundle && (
        <QRCodeDataModal
          open={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          data={{
            projectName: bundle.project?.projectName || "",
            shipperRef: bundle.project?.jobId || "",
            loadId: bundle.packingList?.packingListNo || "",
            id: bundle.bundleNo || targetBundleId,
            parts: partsList,
            weight: bundle.totalWeight,
            length: bundle.maxLengthFeet,
            bundleId: targetBundleId,
          }}
        />
      )}
    </>
  );
}


