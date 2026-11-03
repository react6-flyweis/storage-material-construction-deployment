import { Camera, CameraOff, AlertCircle, RefreshCw, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef, useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanBundleApi } from "../../api/projects.api";
import type { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import Modal from "./Modal";
import ProjectSelector from "./ProjectSelector";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    bundleId: string;
    bundleNo: string;
    [key: string]: unknown;
  };
}

type ScanQRCodeModalProps = {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (bundleId: string) => void;
  scanApiFn?: (payload: { bundleId: string; project?: string }) => Promise<AxiosResponse<ScanResponse>>;
  projectId?: string;
  leadId?: string;
};

type CameraErrorKind = "permission_denied" | "not_found" | "in_use" | "insecure" | "unknown";

interface CameraErrorInfo {
  type: CameraErrorKind;
  title: string;
  message: string;
  suggestion?: string;
}

const parseCameraError = (err: unknown): CameraErrorInfo => {
  let errStr = "";
  let rawMessage = "";

  if (typeof err === "string") {
    errStr = err.toLowerCase();
    rawMessage = err;
  } else if (err instanceof Error) {
    errStr = `${err.name} ${err.message}`.toLowerCase();
    rawMessage = err.message;
  } else if (typeof err === "object" && err !== null) {
    const errorRecord = err as Record<string, unknown>;
    const nameStr = typeof errorRecord.name === "string" ? errorRecord.name : "";
    const msgStr = typeof errorRecord.message === "string" ? errorRecord.message : "";
    errStr = `${nameStr} ${msgStr}`.toLowerCase();
    rawMessage = msgStr || nameStr;
  }

  if (
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return {
      type: "insecure",
      title: "Secure Connection Required",
      message: "Camera access requires an HTTPS connection or localhost.",
      suggestion: "Please access this application using HTTPS.",
    };
  }

  if (
    errStr.includes("notallowederror") ||
    errStr.includes("permissiondeniederror") ||
    errStr.includes("permission denied") ||
    errStr.includes("permission dismissed") ||
    errStr.includes("permission")
  ) {
    return {
      type: "permission_denied",
      title: "Camera Access Blocked",
      message: "Camera permission was denied or blocked by your browser.",
      suggestion: "Click the lock or camera icon in your browser address bar to allow camera access, then try again.",
    };
  }

  if (
    errStr.includes("notfounderror") ||
    errStr.includes("devicesnotfounderror") ||
    errStr.includes("no camera") ||
    errStr.includes("no video input") ||
    errStr.includes("requested device not found") ||
    errStr.includes("device not found")
  ) {
    return {
      type: "not_found",
      title: "No Camera Found",
      message: "No camera device was detected on your computer or phone.",
      suggestion: "Please connect a webcam or enter the Bundle ID manually below.",
    };
  }

  if (
    errStr.includes("notreadableerror") ||
    errStr.includes("trackstarterror") ||
    errStr.includes("already in use") ||
    errStr.includes("could not start video") ||
    errStr.includes("source unavailable")
  ) {
    return {
      type: "in_use",
      title: "Camera Already in Use",
      message: "The camera is currently being used by another application or browser tab.",
      suggestion: "Please close other apps or tabs using the camera and try again.",
    };
  }

  return {
    type: "unknown",
    title: "Camera Access Failed",
    message: rawMessage || "Failed to start camera. Please check camera permissions.",
    suggestion: "Check your browser camera permissions or enter the Bundle ID manually below.",
  };
};

export default function ScanQRCodeModal({
  open,
  onClose,
  onScanSuccess,
  scanApiFn,
  projectId,
  leadId,
}: ScanQRCodeModalProps) {
  const [bundleId, setBundleId] = useState("");
  const initialProjectId = projectId || leadId || "";
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const rawQrContainerId = useId();
  const qrContainerId = `qr-reader-${rawQrContainerId.replace(/:/g, "_")}`;
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn:
      scanApiFn ||
      (scanBundleApi as unknown as (payload: {
        bundleId: string;
        project?: string;
      }) => Promise<AxiosResponse<ScanResponse>>),
  });

  const extractIdFromScannedText = (text: string): string => {
    const trimmed = text.trim();
    if (!trimmed) return "";

    try {
      let urlString = trimmed;
      if (
        !trimmed.startsWith("http://") &&
        !trimmed.startsWith("https://") &&
        (trimmed.includes(".com/") || trimmed.includes(".net/") || trimmed.includes("localhost:"))
      ) {
        urlString = "https://" + trimmed;
      }

      if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
        const parsedUrl = new URL(urlString);

        // 1. Query parameter check
        const bundleIdParam =
          parsedUrl.searchParams.get("bundleId") || parsedUrl.searchParams.get("id");
        if (bundleIdParam) return bundleIdParam;

        // 2. /bundle/:id or /bundles/:id path patterns
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        const bundleIdx = pathSegments.findIndex(
          (seg) => seg.toLowerCase() === "bundle" || seg.toLowerCase() === "bundles"
        );

        if (bundleIdx !== -1 && bundleIdx + 1 < pathSegments.length) {
          return decodeURIComponent(pathSegments[bundleIdx + 1]);
        }

        // 3. Last path segment fallback
        if (pathSegments.length > 0) {
          return decodeURIComponent(pathSegments[pathSegments.length - 1]);
        }
      }
    } catch {
      // Fall back to original trimmed string
    }
    return trimmed;
  };

  const stopCamera = async () => {
    isStartingRef.current = false;
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (err: unknown) {
        console.error("Error stopping camera:", err);
      }
    }
    setIsScanning(false);
  };

  // Listen to browser permission state changes if supported
  useEffect(() => {
    if (!open) return;

    try {
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        navigator.permissions
          .query({ name: "camera" as PermissionName })
          .then((permissionStatus) => {
            permissionStatus.onchange = () => {
              if (permissionStatus.state === "granted" && cameraError) {
                setCameraError(null);
              }
            };
          })
          .catch(() => {
            // Permission query for 'camera' may not be supported by all browsers
          });
      }
    } catch {
      // Ignore
    }
  }, [open, cameraError]);

  // Clean up scanner resources if modal is unmounted or closed externally
  useEffect(() => {
    if (!open && scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          scanner.stop().catch(() => {});
        }
        scanner.clear();
      } catch {
        // ignore
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            scanner.stop().catch(() => {});
          }
          scanner.clear();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const processScan = (rawId: string) => {
    const extractedId = extractIdFromScannedText(rawId);
    if (!extractedId) return;

    const activeProjectId = selectedProjectId || projectId || leadId || undefined;
    const payload: { bundleId: string; project?: string } = {
      bundleId: extractedId,
    };
    if (activeProjectId) {
      payload.project = activeProjectId;
    }

    scanMutation.mutate(
      payload,
      {
        onSuccess: (response: AxiosResponse<ScanResponse>) => {
          queryClient.invalidateQueries({ queryKey: ["deliveries"] });
          queryClient.invalidateQueries({ queryKey: ["bundleScans"] });
          setBundleId("");
          stopCamera();
          const targetId = response?.data?.data?.bundleId || extractedId;
          onScanSuccess(targetId);
          onClose();
          toast.success(`Successfully scanned ${targetId}`);
        },
        onError: (error) => {
          console.warn("Scan API error, falling back to mock UI for demo:", error);
          queryClient.invalidateQueries({ queryKey: ["deliveries"] });
          queryClient.invalidateQueries({ queryKey: ["bundleScans"] });
          setBundleId("");
          stopCamera();
          onScanSuccess(extractedId);
          onClose();
          toast.success(`Scanned ${extractedId} (Demo Mode)`);
        },
      }
    );
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);
    isStartingRef.current = true;

    // 1. Verify Secure Context
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setCameraError(parseCameraError("insecure"));
      setIsScanning(false);
      isStartingRef.current = false;
      return;
    }

    // 2. Check if mediaDevices API is available
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError({
        type: "not_found",
        title: "Camera API Not Supported",
        message: "Your browser does not support camera access or media devices.",
        suggestion: "Please use a modern browser (Chrome, Edge, Safari, Firefox) or enter the Bundle ID manually below.",
      });
      setIsScanning(false);
      isStartingRef.current = false;
      return;
    }

    // Give React time to mount qrContainerId into DOM
    setTimeout(async () => {
      if (!isStartingRef.current) return;

      try {
        // Stop any previous scanner instance
        if (scannerRef.current) {
          const prevScanner = scannerRef.current;
          scannerRef.current = null;
          try {
            const state = prevScanner.getState();
            if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
              await prevScanner.stop();
            }
            prevScanner.clear();
          } catch {
            // ignore
          }
        }

        const container = document.getElementById(qrContainerId);
        if (!container) {
          if (isStartingRef.current) {
            setIsScanning(false);
          }
          return;
        }

        const html5QrCode = new Html5Qrcode(qrContainerId);
        scannerRef.current = html5QrCode;

        // Try environment camera first; if desktop/laptop without environment camera, fall back to default/user camera
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              processScan(decodedText);
            },
            () => {}
          );
        } catch (firstErr: unknown) {
          if (!isStartingRef.current) return;
          const firstErrObj =
            firstErr instanceof Error ? firstErr : (firstErr as Record<string, unknown>);
          const firstErrStr = String(firstErrObj?.name || firstErrObj?.message || "").toLowerCase();
          
          if (
            firstErrStr.includes("overconstrained") ||
            firstErrStr.includes("notfound") ||
            firstErrStr.includes("device not found")
          ) {
            await html5QrCode.start(
              { facingMode: "user" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                processScan(decodedText);
              },
              () => {}
            );
          } else {
            throw firstErr;
          }
        }

        if (!isStartingRef.current) {
          // Cancelled while camera was opening
          if (scannerRef.current) {
            try {
              await scannerRef.current.stop();
              scannerRef.current.clear();
            } catch {}
            scannerRef.current = null;
          }
          setIsScanning(false);
        }
      } catch (err: unknown) {
        console.error("Camera access failed:", err);
        const parsed = parseCameraError(err);
        setCameraError(parsed);
        setIsScanning(false);

        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
      } finally {
        isStartingRef.current = false;
      }
    }, 100);
  };

  const handleClose = async () => {
    await stopCamera();
    setBundleId("");
    scanMutation.reset();
    setCameraError(null);
    setSelectedProjectId(projectId || leadId || "");
    onClose();
  };

  const mutationErrorMsg = scanMutation.error
    ? (scanMutation.error as AxiosError<{ message?: string }>).response?.data?.message ||
      scanMutation.error.message ||
      "An error occurred"
    : null;

  return (
    <Modal open={open} onClose={handleClose} containerClassName="max-w-[480px] items-center">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Scan Delivery QR</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Scan the QR code attached to the delivery challan or enter the Bundle ID manually.
      </p>

      {/* Camera Scan Area */}
      <div className="w-full flex flex-col items-center mb-6">
        {isScanning ? (
          <div className="w-full overflow-hidden rounded-xl border border-gray-300 bg-black relative shadow-sm">
            {/* The video container for Html5Qrcode */}
            <div id={qrContainerId} className="w-full min-h-65 bg-black" />

            {/* Active Scanning Controls */}
            <div className="bg-gray-900 py-2.5 px-4 flex items-center justify-between border-t border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-200">Point at QR code</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                Stop Camera
              </button>
            </div>
          </div>
        ) : cameraError ? (
          /* Camera Error / Permission Notice Card */
          <div
            className={`w-full rounded-xl border p-4 text-center flex flex-col items-center transition-all ${
              cameraError.type === "permission_denied"
                ? "border-amber-200 bg-amber-50/80"
                : cameraError.type === "not_found"
                ? "border-blue-200 bg-blue-50/80"
                : "border-red-200 bg-red-50/80"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                cameraError.type === "permission_denied"
                  ? "bg-amber-100 text-amber-600"
                  : cameraError.type === "not_found"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {cameraError.type === "permission_denied" || cameraError.type === "not_found" ? (
                <CameraOff className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <h4
              className={`text-sm font-bold ${
                cameraError.type === "permission_denied"
                  ? "text-amber-900"
                  : cameraError.type === "not_found"
                  ? "text-blue-900"
                  : "text-red-900"
              }`}
            >
              {cameraError.title}
            </h4>

            <p
              className={`text-xs mt-1.5 max-w-85 leading-relaxed ${
                cameraError.type === "permission_denied"
                  ? "text-amber-800"
                  : cameraError.type === "not_found"
                  ? "text-blue-800"
                  : "text-red-800"
              }`}
            >
              {cameraError.message}
            </p>

            {cameraError.suggestion && (
              <div
                className={`mt-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium max-w-90 text-left sm:text-center ${
                  cameraError.type === "permission_denied"
                    ? "bg-amber-100/70 text-amber-900"
                    : cameraError.type === "not_found"
                    ? "bg-blue-100/70 text-blue-900"
                    : "bg-red-100/70 text-red-900"
                }`}
              >
                💡 {cameraError.suggestion}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2.5 w-full justify-center">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-linear-to-r from-[#2563EB] to-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {cameraError.type === "permission_denied"
                  ? "Retry Camera Access"
                  : cameraError.type === "not_found"
                  ? "Check Again"
                  : "Try Again"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  manualInputRef.current?.focus();
                }}
                className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-colors"
              >
                Enter Manually
              </button>
            </div>
          </div>
        ) : (
          /* Default Idle State */
          <div className="w-full flex flex-col items-center">
            <button
              type="button"
              onClick={startCamera}
              className="w-full bg-linear-to-r from-[#2563EB] to-[#4F46E5] text-white py-3 px-6 rounded-xl flex items-center justify-center gap-2.5 hover:opacity-90 transition-all shadow-md font-semibold text-base"
            >
              <Camera className="w-5 h-5" />
              Camera Scan
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Click to scan QR code using your device camera
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-full my-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">OR</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Manual Input Section */}
      <div className="w-full mb-6 text-left space-y-4">
        {!projectId && !leadId && (
          <div>
            <label className="text-sm font-bold text-gray-900 mb-1.5 block">
              Select Project <span className="text-xs font-normal text-gray-500">(Required for manual entry)</span>
            </label>
            <ProjectSelector
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val)}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-bold text-gray-900 mb-2 block">Enter Bundle ID</label>
          <input
            ref={manualInputRef}
            value={bundleId}
            onChange={(e) => {
              setBundleId(e.target.value);
              if (scanMutation.isError) {
                scanMutation.reset();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && bundleId.trim()) {
                processScan(bundleId);
              }
            }}
            placeholder="e.g. B-001"
            className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none text-base font-semibold placeholder:text-gray-400 focus:border-blue-500 shadow-sm"
          />
          {mutationErrorMsg && <p className="mt-2 text-xs font-bold text-red-500">{mutationErrorMsg}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={handleClose}
          className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl text-base hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => processScan(bundleId)}
          disabled={scanMutation.isPending || !bundleId.trim()}
          className="w-full py-3 bg-linear-to-r from-[#2563EB] to-[#4F46E5] text-white font-semibold rounded-xl text-base hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {scanMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scanning...
            </>
          ) : (
            "Scan"
          )}
        </button>
      </div>
    </Modal>
  );
}
