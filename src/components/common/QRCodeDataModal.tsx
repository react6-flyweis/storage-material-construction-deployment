import React from "react";
import { getQRCodeUrl, type QRModalData, formatValue, printQRCodeLabel } from "../../lib/utils";
import Modal from "./Modal";

interface QRCodeDataModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  data: QRModalData | null;
}

const QRCodeDataModal: React.FC<QRCodeDataModalProps> = ({ open, isOpen, onClose, data }) => {
  const show = (open ?? isOpen) && Boolean(data);
  if (!data) return null;

  const qrDataObj = {
    project: (data.projectName || "").replace(/\s+/g, ""),
    shipper: data.shipperRef || "",
    load_id: data.loadId || "",
    bundle_id: data.id || "",
    parts: (data.parts || "").replace(/\s+/g, ""),
    weight: formatValue(data.weight),
    length: formatValue(data.length),
  };

  const standaloneBase = import.meta.env.VITE_STANDLONE_PAGE_BASE || "";
  const qrCodeUrl = data.bundleId
    ? getQRCodeUrl(`${standaloneBase.replace(/\/+$/, "")}/bundle/${data.bundleId}`, "250x250")
    : getQRCodeUrl(qrDataObj, "250x250");

  const handlePrint = () => {
    printQRCodeLabel(data);
  };

  return (
    <Modal
      tourId="bundle-qr-modal"
      open={show}
      onClose={onClose}
      containerClassName="max-w-2xl"
    >
      {/* Back Button (Top Left) */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 px-5 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white"
      >
        Back
      </button>

      {/* Title */}
      <h2 className="text-3xl font-bold text-center mt-6 mb-8 text-[#111827]">
        Label Preview
      </h2>

      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 mb-8">
        {/* QR Code Dynamic Image (Bare, no border/padding) */}
        <div className="w-48 h-48 shrink-0 flex items-center justify-center bg-white">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Data List */}
        <div className="flex-1 space-y-1 text-left w-full sm:w-auto">
          <h3 className="text-xl md:text-[22px] font-bold text-[#0F172A] leading-tight mb-4">
            project={qrDataObj.project}
          </h3>
          <div className="space-y-1 text-sm md:text-base font-normal">
            <p className="flex gap-1 items-baseline">
              <span className="text-[#94A3B8] font-medium min-w-[70px]">Shipper :</span>
              <span className="text-[#1E293B] font-medium">shipper={qrDataObj.shipper}</span>
            </p>
            <p className="flex gap-1 items-baseline">
              <span className="text-[#94A3B8] font-medium min-w-[70px]">Load :</span>
              <span className="text-[#1E293B] font-medium">load_id={qrDataObj.load_id}</span>
            </p>
            <p className="flex gap-1 items-baseline">
              <span className="text-[#94A3B8] font-medium min-w-[70px]">Bundle :</span>
              <span className="text-[#1E293B] font-medium">bundle_id={qrDataObj.bundle_id}</span>
            </p>
            <p className="flex gap-1 items-baseline">
              <span className="text-[#94A3B8] font-medium min-w-[70px]">Parts :</span>
              <span className="text-[#1E293B] font-medium">parts={qrDataObj.parts}</span>
            </p>
            <p className="flex gap-1 items-baseline">
              <span className="text-[#94A3B8] font-medium min-w-[70px]">Weight :</span>
              <span className="text-[#1E293B] font-medium">weight={qrDataObj.weight}</span>
            </p>
            <p className="flex gap-1 items-baseline">
              <span className="text-[#94A3B8] font-medium min-w-[70px]">Length :</span>
              <span className="text-[#1E293B] font-medium">Length={qrDataObj.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Button (Centered Print Button) */}
      <div className="flex justify-center w-full mt-4">
        <button
          data-tour="bundle-qr-print"
          className="w-full max-w-[320px] py-2 bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white font-bold rounded-[16px] shadow-lg shadow-blue-100 hover:opacity-90 transition-all text-xl"
          onClick={handlePrint}
        >
          Print
        </button>
      </div>
    </Modal>
  );
};

export default QRCodeDataModal;
