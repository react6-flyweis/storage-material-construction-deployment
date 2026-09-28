import React from "react";
import { useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProjectDetailsApi } from "@/api/projects.api";
import {
  ProjectDetailsHeader,
  ProjectDetailsNavButtons,
  ProjectSummaryCard,
  UpcomingMaterialDeliveryTable,
  ProjectTasksCard,
  type ProjectSummary,
  type MaterialDelivery,
  type ProjectTaskItem,
} from "@/components/projects/details";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ProjectViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ id?: string }>();

  // Extract project ID from query params, route params, or navigation state
  const projectId =
    searchParams.get("id") ||
    routeParams.id ||
    location.state?.projectId ||
    "";

  // Query real project details from the API
  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => getProjectDetailsApi(projectId),
    enabled: Boolean(projectId),
    retry: 1,
  });

  const apiData = apiResponse?.data?.data;
  const project = apiData?.project;

  // Map API response to clean component structures
  const summary: ProjectSummary | null = React.useMemo(() => {
    if (!project) return null;

    let createdOn = "-";
    if (project.plannedStartDate) {
      const d = new Date(project.plannedStartDate);
      if (!isNaN(d.getTime())) {
        createdOn = d.toISOString().split("T")[0];
      }
    }

    const customerName = project.customerId
      ? `${project.customerId.firstName || ""} ${project.customerId.lastName || ""}`.trim()
      : undefined;

    return {
      id: project._id,
      projectName: project.projectName || project.jobId || "Project",
      projectCode: project.jobId || "-",
      status: project.lifecycleStatus || "in_progress",
      buildingType: project.buildingType || "-",
      numberOfBuildings: project.numberOfBuildings ?? "-",
      createdOn,
      location: project.location || "-",
      priority: project.priority,
      description: project.description,
      customerName,
      customerEmail: project.customerId?.email,
    };
  }, [project]);

  const deliveries: MaterialDelivery[] = React.useMemo(() => {
    const rawDeliveries = apiData?.deliveries || [];
    return rawDeliveries.map((del) => {
      let dateStr = "-";
      let timeStr = "";

      if (del.deliveryDate) {
        const d = new Date(del.deliveryDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const hours = d.getUTCHours();
          const minutes = d.getUTCMinutes();
          if (hours !== 0 || minutes !== 0) {
            timeStr = d.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
        }
      }

      return {
        id: del._id,
        deliveryNumber: del.deliveryNumber || del._id,
        status: del.status || "scheduled",
        date: dateStr,
        time: timeStr,
        item: del.description || del.materialType || "-",
        materialType: del.materialType,
        loadWeight: del.loadWeight,
        vendor: del.vendor || "-",
        carrier: del.carrier || "-",
        pocName: del.pocName || summary?.customerName || "-",
        pocPhone: del.pocPhone,
        pocEmail: del.pocEmail || summary?.customerEmail,
      };
    });
  }, [apiData?.deliveries, summary]);

  const tasks: ProjectTaskItem[] = React.useMemo(() => {
    const rawTasks = apiData?.tasks || [];
    return rawTasks.map((t) => {
      let assignedStr: string | null = null;
      if (typeof t.assignedTo === "string") {
        assignedStr = t.assignedTo;
      } else if (t.assignedTo && typeof t.assignedTo === "object") {
        const userObj = t.assignedTo as { name?: string; email?: string };
        assignedStr = userObj.name || userObj.email || null;
      }

      return {
        id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: assignedStr,
      };
    });
  }, [apiData?.tasks]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/projects?tab=project");
    }
  };

  const handleDeliverySelect = (delivery: MaterialDelivery) => {
    navigate(`/delivery-details/${delivery.id}`);
  };

  // State 1: No Project ID provided
  if (!projectId) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Project Selected</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Please select a project from the project list to view its complete details.
        </p>
        <button
          onClick={() => navigate("/projects?tab=project")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Project List</span>
        </button>
      </div>
    );
  }

  // State 2: Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-7xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-9 bg-gray-200 rounded-lg" />
          <div className="w-64 h-8 bg-gray-200 rounded-md" />
        </div>

        {/* Buttons Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-11 bg-gray-200 rounded-lg" />
          ))}
        </div>

        {/* Summary Card Skeleton */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-gray-200 rounded" />
              <div className="w-24 h-4 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-1.5">
                <div className="w-20 h-3 bg-gray-200 rounded" />
                <div className="w-28 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
          <div className="w-44 h-5 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-50 rounded-lg" />
        </div>
      </div>
    );
  }

  // State 3: Error State
  if (isError || !summary) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Project</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          {error instanceof Error
            ? error.message
            : "The requested project details could not be retrieved from the server."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <button
            onClick={() => navigate("/projects?tab=project")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
        </div>
      </div>
    );
  }

  // State 4: Render Project Details with Real API Data
  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header with Back button and Dynamic Title */}
      <ProjectDetailsHeader
        title={`Project Details- ${summary.projectName}`}
        onBack={handleBack}
      />

      {/* 2. Action / Navigation Buttons */}
      <ProjectDetailsNavButtons
        onViewBOM={() => navigate(`/projects/${projectId}/view-bom`)}
        onViewDrawings={() => navigate(`/projects/${projectId}/view-drawings`)}
        onMaterialDelivery={() => navigate(`/projects/${projectId}/material-delivery`)}
        onBundleScan={() => navigate("/delivery-tracking/bundle-scan")}
      />

      {/* 3. Project Summary Card */}
      <ProjectSummaryCard summary={summary} />

      {/* 4. Upcoming Material Delivery Table */}
      <UpcomingMaterialDeliveryTable
        deliveries={deliveries}
        onSelectDelivery={handleDeliverySelect}
      />

      {/* 5. Project Tasks Card (Real API data) */}
      <ProjectTasksCard tasks={tasks} />
    </div>
  );
}
