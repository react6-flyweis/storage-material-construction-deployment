import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjectDetailsApi, getConsolidatedBOMApi, getConsolidatedBOMUrlApi } from "@/api/projects.api";
import logoImg from "@/assets/logo.png";

interface BOMTableItem {
  id: string;
  qty: number;
  mark: string;
  description: string;
  part: string;
  color: string;
  angle: string;
  thick: string;
  length: string;
  weight: number;
}

const DEFAULT_BOM_ITEMS: BOMTableItem[] = [
  { id: "1", qty: 5, mark: "S-1", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "2", qty: 8, mark: "S-2", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "3", qty: 6, mark: "S-3", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "4", qty: 5, mark: "S-4", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "5", qty: 8, mark: "S-5", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "6", qty: 6, mark: "S-6", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "7", qty: 3, mark: "S-7", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "8", qty: 4, mark: "S-8", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "9", qty: 2, mark: "S-9", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
  { id: "10", qty: 4, mark: "S-10", description: "STUD", part: "C42516", color: "RO", angle: "-", thick: "16 GA", length: "8'-7 1/4\"", weight: 16.00 },
];

export default function BOMFilesDetailsPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectId = paramId || searchParams.get("id") || "";

  const [sortField, setSortField] = useState<keyof BOMTableItem | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch project details for project name, client name, job ID
  const { data: projectRes } = useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => getProjectDetailsApi(projectId),
    enabled: Boolean(projectId),
  });

  // Fetch consolidated BOM data if available
  const { data: bomRes, isLoading: isBomLoading } = useQuery({
    queryKey: ["project-consolidated-bom", projectId],
    queryFn: () => getConsolidatedBOMApi(projectId),
    enabled: Boolean(projectId),
    retry: false,
  });

  // Fetch consolidated BOM file URL if available
  const { data: bomUrlRes } = useQuery({
    queryKey: ["project-consolidated-bom-url", projectId],
    queryFn: () => getConsolidatedBOMUrlApi(projectId),
    enabled: Boolean(projectId),
    retry: false,
  });

  const projectData = projectRes?.data?.data?.project;
  const projectName = projectData?.projectName || projectData?.jobId || "ABC Construction";
  const bomId = (bomRes?.data?.data as any)?.consolidatedBOM?._id || projectData?.jobId || "BOM-001";
  const customerName = projectData?.customerId
    ? `${projectData.customerId.firstName || ""} ${projectData.customerId.lastName || ""}`.trim()
    : "John Doe";
  const jobId = projectData?.jobId || "BLDG-D";

  const dateStr = useMemo(() => {
    if (projectData?.plannedStartDate) {
      const d = new Date(projectData.plannedStartDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
      }
    }
    return "01.09.26";
  }, [projectData]);

  // Map API items or use fallback
  const rawItems: BOMTableItem[] = useMemo(() => {
    const apiBom = (bomRes?.data?.data as any)?.consolidatedBOM;
    if (apiBom?.items && Array.isArray(apiBom.items) && apiBom.items.length > 0) {
      return apiBom.items.map((item: any, idx: number) => ({
        id: item._id || String(idx),
        qty: item.totalQty || 1,
        mark: (item.markIds && item.markIds.length > 0 ? item.markIds.join(", ") : `S-${idx + 1}`),
        description: item.description || item.category || "STUD",
        part: item.partCode || "C42516",
        color: item.partColor || "RO",
        angle: item.angle || "-",
        thick: item.gauge || item.thick || "16 GA",
        length: item.totalLengthFeet ? `${item.totalLengthFeet}'` : "8'-7 1/4\"",
        weight: Number(item.totalWeight || item.weight || 16.00),
      }));
    }
    return DEFAULT_BOM_ITEMS;
  }, [bomRes]);

  const handleSort = (field: keyof BOMTableItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortField) return rawItems;
    return [...rawItems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal || "").toLowerCase();
      const strB = String(bVal || "").toLowerCase();
      return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [rawItems, sortField, sortDirection]);

  // Totals calculations
  const totalQty = useMemo(() => rawItems.reduce((acc, it) => acc + (it.qty || 0), 0), [rawItems]);
  const totalWeight = useMemo(() => rawItems.reduce((acc, it) => acc + (it.weight * it.qty || 0), 0), [rawItems]);
  const totalTons = (totalWeight / 2000).toFixed(2);

  // Summary counts
  const summaryTotalItems = (bomRes?.data?.data as any)?.consolidatedBOM?.itemCount || 125;
  const summaryTotalWeight = (bomRes?.data?.data as any)?.consolidatedBOM?.totalWeight?.toLocaleString() || "32,000";
  const summaryTotalArea = (bomRes?.data?.data as any)?.consolidatedBOM?.totalPanelsArea?.toLocaleString() || "3,300";

  const handleDownloadExcel = () => {
    const fileUrl = (bomUrlRes?.data?.data as any)?.fileUrl;
    if (fileUrl) {
      window.open(fileUrl, "_blank");
      return;
    }
    // Generate CSV export
    const headers = ["QTY", "Mark", "Description", "Part", "Color", "Angle", "Thick", "Length", "Weight"];
    const rows = sortedItems.map((item) => [
      item.qty,
      `"${item.mark}"`,
      `"${item.description}"`,
      `"${item.part}"`,
      `"${item.color}"`,
      `"${item.angle}"`,
      `"${item.thick}"`,
      `"${item.length}"`,
      item.weight.toFixed(2),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${projectName}_BOM_Details.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div className="space-y-6 pb-14 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            BOM Files Details
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Excel</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Project & BOM ID Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-[#F9FAFB]/70">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
            Project: <span className="font-bold">{projectName}</span> | BOM ID: <span className="font-bold">{bomId}</span>
          </h2>
        </div>

        <div className="p-6 sm:p-8 space-y-7">
          {/* BOM Summary Section */}
          <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5 sm:p-6 max-w-sm space-y-3.5">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              BOM Summary
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Items</span>
                <span className="font-bold text-gray-900">{summaryTotalItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Weight</span>
                <span className="font-bold text-gray-900">{summaryTotalWeight} lbs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Panels Area</span>
                <span className="font-bold text-gray-900">{summaryTotalArea} sqm</span>
              </div>
            </div>
          </div>

          {/* Technical Spec Box */}
          <div className="border-2 border-black rounded-xs overflow-hidden bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x-2 divide-black">
              {/* Left: Storage Materials Logo */}
              <div className="md:col-span-5 p-4 sm:p-6 flex items-center justify-center bg-white">
                <img
                  src={logoImg}
                  alt="Storage Materials"
                  className="max-h-12 sm:max-h-14 object-contain"
                />
              </div>

              {/* Right: Technical Headers */}
              <div className="md:col-span-7 flex flex-col divide-y-2 divide-black">
                {/* Row 1: STUDS & TOP CHANNELS + Date & Job Id */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-7 p-2.5 sm:p-3 flex items-center justify-center text-center">
                    <span className="font-black text-sm sm:text-base tracking-wider text-black uppercase">
                      STUDS &amp; TOP CHANNELS
                    </span>
                  </div>
                  <div className="sm:col-span-5 divide-y-2 divide-black flex flex-col justify-center">
                    <div className="grid grid-cols-2 divide-x-2 divide-black px-2 py-1 text-xs">
                      <span className="font-bold text-black">Date</span>
                      <span className="font-semibold text-black pl-2">{dateStr}</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x-2 divide-black px-2 py-1 text-xs">
                      <span className="font-bold text-black">Job Id</span>
                      <span className="font-semibold text-black pl-2">{jobId}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Customer */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-4 p-2 sm:p-2.5 flex items-center justify-center bg-[#F9FAFB] sm:bg-transparent">
                    <span className="font-bold text-xs sm:text-sm text-black">Customer:</span>
                  </div>
                  <div className="sm:col-span-8 p-2 sm:p-2.5 flex items-center justify-center font-bold text-xs sm:text-sm text-black">
                    {customerName}
                  </div>
                </div>

                {/* Row 3: Project Name */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-4 p-2 sm:p-2.5 flex items-center justify-center bg-[#F9FAFB] sm:bg-transparent">
                    <span className="font-bold text-xs sm:text-sm text-black">Project Name:</span>
                  </div>
                  <div className="sm:col-span-8 p-2 sm:p-2.5 flex items-center justify-center font-bold text-xs sm:text-sm text-black">
                    {projectName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-200 text-xs sm:text-sm text-gray-700">
                  <th
                    onClick={() => handleSort("qty")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>QTY</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("mark")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Mark</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                  <th className="py-3.5 px-4 font-semibold">Part</th>
                  <th className="py-3.5 px-4 font-semibold">Color</th>
                  <th
                    onClick={() => handleSort("angle")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Angle</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Thick</th>
                  <th
                    onClick={() => handleSort("length")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Length</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("weight")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Weight</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm text-gray-700">
                {isBomLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500 font-medium">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading BOM file details...
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{item.qty}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{item.mark}</td>
                      <td className="py-3.5 px-4 text-gray-600 uppercase">{item.description}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{item.part}</td>
                      <td className="py-3.5 px-4 text-gray-600">{item.color}</td>
                      <td className="py-3.5 px-4 text-gray-600">{item.angle}</td>
                      <td className="py-3.5 px-4 text-gray-600">{item.thick}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{item.length}</td>
                      <td className="py-3.5 px-4 text-gray-600">{item.weight.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                {/* Summary Row */}
                <tr className="border-t-2 border-gray-200 bg-[#F9FAFB]/60 text-xs sm:text-sm">
                  <td className="py-4 px-4 font-bold text-gray-900">
                    <span className="block text-gray-500 text-[11px] font-normal uppercase">QTY Total</span>
                    {totalQty}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    <span className="text-gray-500 mr-2">Total Tons:</span>
                    <span className="font-bold text-gray-900">{totalTons}</span>
                  </td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4 text-gray-600">RO</td>
                  <td className="py-4 px-4 text-gray-600">-</td>
                  <td className="py-4 px-4" colSpan={2}>
                    <div className="text-right pr-4 font-medium text-gray-500">
                      Total Weight (lbs)
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-gray-900">
                    {totalWeight.toLocaleString()}
                  </td>
                </tr>
                {/* Received By Row */}
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-xs sm:text-sm text-gray-600 italic">
                    Received By: __________________________________________________
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
