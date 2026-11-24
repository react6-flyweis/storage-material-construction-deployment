import toast from "react-hot-toast";
import { getProjectsApi } from "@/api/projects.api";
import { SIDEBAR_TABS } from "@/components/sidebar/sidebarTabs";
import { queryClient } from "@/lib/queryClient";
import type { TourNavTab } from "./tour.types";

// What the tour engine needs to know about this panel.

export const TOUR_NAV: TourNavTab[] = SIDEBAR_TABS;

export const HOME_ROUTES = ["/dashboard"];

export const PROJECT_PARAM = ":projectId";

export function notify(message: string) {
  toast(message);
}

export function isDataLoading(): boolean {
  return queryClient.isFetching() > 0 || !!document.querySelector("[data-tour-loading]");
}

export async function fetchFirstProjectId(): Promise<string | null> {
  try {
    const response = await getProjectsApi({ page: 1, limit: 1, hasDelivery: true });
    return response.data?.data?.projects?.[0]?._id ?? null;
  } catch (error) {
    console.warn("[Tour] Unable to resolve a project ID.", error);
    return null;
  }
}
