import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getProjectDetailsApi,
  getConsolidatedBOMApi,
} from "@/api/projects.api";
import logoImg from "@/assets/logo.png";

interface BOMTableItem {
  id: string;
  qty: number;
  mark: string;
  description: string;
  part: string;
  color: string;
  category: string;
  buildings: string;
  lengthFeet: number | null;
  length: string;
  weight: number;
  cost: number;
}

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

  // Fetch consolidated BOM data
  const { data: bomRes, isLoading: isBomLoading } = useQuery({
    queryKey: ["project-consolidated-bom", projectId],
    queryFn: () => getConsolidatedBOMApi(projectId),
    enabled: Boolean(projectId),
    retry: false,
  });

  const projectData = projectRes?.data?.data?.project;
  const consolidatedBOM = bomRes?.data?.data?.consolidatedBOM;

  const projectName = projectData?.projectName || projectData?.jobId || "—";
  // const bomId = consolidatedBOM?._id || "—";
  const customerName = projectData?.customerId
    ? `${projectData.customerId.firstName || ""} ${projectData.customerId.lastName || ""}`.trim()
    : "—";
  const jobId = projectData?.jobId || consolidatedBOM?.leadId || "—";

  const dateStr = useMemo(() => {
    const rawDate =
      consolidatedBOM?.createdAt ||
      consolidatedBOM?.updatedAt ||
      projectData?.plannedStartDate ||
      projectData?.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      }
    }
    return "—";
  }, [consolidatedBOM, projectData]);

  // Map API items without fallbacks
  const rawItems: BOMTableItem[] = useMemo(() => {
    if (!consolidatedBOM?.items || !Array.isArray(consolidatedBOM.items)) {
      return [];
    }

    return consolidatedBOM.items.map((item, idx) => ({
      id: item._id || String(idx),
      qty: item.totalQty ?? 0,
      mark:
        item.markIds && item.markIds.length > 0 ? item.markIds.join(", ") : "—",
      description: item.description || "—",
      part: item.partCode || "—",
      color: item.partColor || "—",
      category: item.category ? item.category.replace(/_/g, " ") : "—",
      buildings:
        item.buildings && item.buildings.length > 0
          ? item.buildings.join(", ")
          : "—",
      lengthFeet: item.totalLengthFeet ?? null,
      length:
        item.totalLengthFeet != null
          ? `${Number(item.totalLengthFeet.toFixed(2)).toLocaleString()}'`
          : "—",
      weight: item.totalWeight ?? 0,
      cost: item.totalCost ?? 0,
    }));
  }, [consolidatedBOM]);

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
      const strA = String(aVal ?? "").toLowerCase();
      const strB = String(bVal ?? "").toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [rawItems, sortField, sortDirection]);

  // Totals calculations
  const totalQty = useMemo(
    () => rawItems.reduce((acc, it) => acc + (it.qty || 0), 0),
    [rawItems],
  );
  const totalWeightCalc = useMemo(
    () => rawItems.reduce((acc, it) => acc + (it.weight || 0), 0),
    [rawItems],
  );
  const totalCostCalc = useMemo(
    () => rawItems.reduce((acc, it) => acc + (it.cost || 0), 0),
    [rawItems],
  );

  const totalWeightValue =
    consolidatedBOM?.totalWeight ??
    (rawItems.length > 0 ? totalWeightCalc : null);
  const totalCostValue =
    consolidatedBOM?.totalCost ?? (rawItems.length > 0 ? totalCostCalc : null);
  const totalTons =
    totalWeightValue != null ? (totalWeightValue / 2000).toFixed(2) : "0.00";

  // Summary counts
  const summaryTotalItems = consolidatedBOM?.itemCount ?? rawItems.length;
  const summaryTotalWeight =
    totalWeightValue != null
      ? totalWeightValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "—";
  const summaryTotalArea =
    consolidatedBOM?.totalPanelsArea != null
      ? consolidatedBOM.totalPanelsArea.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : "—";
  const summaryTotalCost =
    totalCostValue != null
      ? `$${totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  const handleDownload = () => {
    const fileUrl = consolidatedBOM?.fileUrl;
    if (fileUrl) {
      window.open(fileUrl, "_blank");
      return;
    }
    // Fallback CSV export if fileUrl is not available
    if (sortedItems.length > 0) {
      const headers = [
        "QTY",
        "Mark",
        "Description",
        "Part Code",
        "Color",
        "Category",
        "Buildings",
        "Length (ft)",
        "Weight (lbs)",
        "Cost ($)",
      ];
      const rows = sortedItems.map((item) => [
        item.qty,
        `"${item.mark.replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.part.replace(/"/g, '""')}"`,
        `"${item.color.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        `"${item.buildings.replace(/"/g, '""')}"`,
        item.lengthFeet != null ? item.lengthFeet.toFixed(2) : "",
        item.weight.toFixed(2),
        item.cost.toFixed(2),
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${projectName}_BOM_Details.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

        <div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!consolidatedBOM?.fileUrl && sortedItems.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Project & BOM ID Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-[#F9FAFB]/70 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
            Project: <span className="font-bold">{projectName}</span>
            {/* | BOM ID: <span className="font-bold">{bomId}</span> */}
          </h2>
          {/* {consolidatedBOM?.status && (
            <span className="capitalize px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {consolidatedBOM.status}
            </span>
          )} */}
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
                <span className="font-bold text-gray-900">
                  {summaryTotalItems}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Weight</span>
                <span className="font-bold text-gray-900">
                  {summaryTotalWeight} lbs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Total Panels Area
                </span>
                <span className="font-bold text-gray-900">
                  {summaryTotalArea} sqft
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Cost</span>
                <span className="font-bold text-gray-900">
                  {summaryTotalCost}
                </span>
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
                {/* Row 1: CONSOLIDATED BILL OF MATERIALS + Date & Job Id */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-7 p-2.5 sm:p-3 flex items-center justify-center text-center">
                    <span className="font-black text-sm sm:text-base tracking-wider text-black uppercase">
                      CONSOLIDATED BILL OF MATERIALS
                    </span>
                  </div>
                  <div className="sm:col-span-5 divide-y-2 divide-black flex flex-col justify-center">
                    <div className="grid grid-cols-2 divide-x-2 divide-black px-2 py-1 text-xs">
                      <span className="font-bold text-black">Date</span>
                      <span className="font-semibold text-black pl-2">
                        {dateStr}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x-2 divide-black px-2 py-1 text-xs">
                      <span className="font-bold text-black">Job Id</span>
                      <span className="font-semibold text-black pl-2">
                        {jobId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Customer */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-4 p-2 sm:p-2.5 flex items-center justify-center bg-[#F9FAFB] sm:bg-transparent">
                    <span className="font-bold text-xs sm:text-sm text-black">
                      Customer:
                    </span>
                  </div>
                  <div className="sm:col-span-8 p-2 sm:p-2.5 flex items-center justify-center font-bold text-xs sm:text-sm text-black">
                    {customerName}
                  </div>
                </div>

                {/* Row 3: Project Name */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-4 p-2 sm:p-2.5 flex items-center justify-center bg-[#F9FAFB] sm:bg-transparent">
                    <span className="font-bold text-xs sm:text-sm text-black">
                      Project Name:
                    </span>
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
            <table className="w-full text-left border-collapse min-w-[850px]">
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
                  <th
                    onClick={() => handleSort("description")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Description</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("part")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Part Code</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("color")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Color</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("category")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Bldg</th>
                  <th
                    onClick={() => handleSort("lengthFeet")}
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
                      <span>Weight (lbs)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("cost")}
                    className="py-3.5 px-4 font-semibold cursor-pointer select-none text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cost</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm text-gray-700">
                {isBomLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-gray-500 font-medium"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading BOM file details...
                    </td>
                  </tr>
                ) : sortedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-gray-500 font-medium"
                    >
                      No BOM items found for this project.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {item.qty}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {item.mark}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {item.part}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.color}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.buildings}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {item.length}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.weight > 0
                          ? item.weight.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900 text-right">
                        {item.cost > 0
                          ? `$${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {sortedItems.length > 0 && (
                <tfoot>
                  {/* Summary Row */}
                  <tr className="border-t-2 border-gray-200 bg-[#F9FAFB]/60 text-xs sm:text-sm">
                    <td className="py-4 px-4 font-bold text-gray-900">
                      <span className="block text-gray-500 text-[11px] font-normal uppercase">
                        QTY Total
                      </span>
                      {totalQty.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-gray-600" colSpan={2}>
                      <span className="text-gray-500 mr-2">Total Tons:</span>
                      <span className="font-bold text-gray-900">
                        {totalTons} T
                      </span>
                    </td>
                    <td className="py-4 px-4" colSpan={4}></td>
                    <td className="py-4 px-4 font-medium text-gray-500 text-right">
                      Total Weight:
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {summaryTotalWeight} lbs
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900 text-right">
                      {summaryTotalCost}
                    </td>
                  </tr>
                  {/* Received By Row */}
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 px-4 text-xs sm:text-sm text-gray-600 italic"
                    >
                      Received By:
                      __________________________________________________
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
