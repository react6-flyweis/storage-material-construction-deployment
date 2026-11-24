import type { TourPageIntro } from "../tour.types";

/**
 * Shown over the whole page the first time a tour reaches it, before the tour
 * goes through its sections. Keyed by step route, without the query string.
 */
export const PAGE_INTROS: Partial<Record<string, TourPageIntro>> = {
  "/dashboard": {
    title: "Construction Dashboard",
    description: "The whole site operation on one page: deliveries, materials, sites, deadlines and activity.",
  },
  "/projects": {
    title: "Projects & Calendar",
    description: "Your projects and their deliveries, as a calendar or a list.",
  },
  "/projects/:projectId": {
    title: "Project Details",
    description: "Everything about one project: its summary, lifecycle, tasks and deliveries.",
  },
  "/drawing-attachment": {
    title: "Drawings & Attachments",
    description: "Every project's drawings, photos and videos, with tabs and search on top.",
  },
  "/tasks": {
    title: "Task Board",
    description: "All tasks on one page, with totals on top and a column for each status.",
  },
  "/work-logs": {
    title: "Daily Work Logs",
    description: "Every day's work on site, with filters on top and the entries below.",
  },
  "/materials": {
    title: "Material Requests",
    description: "Every material request from the site, with totals, filters and the list.",
  },
  "/delivery-tracking": {
    title: "Delivery Tracking",
    description: "Every delivery on its way to a site, with totals on top and a card for each.",
  },
  "/delivery-tracking/bundle-scan": {
    title: "Dispatch Verification",
    description: "Projects with packing lists to verify, with scanning on top.",
  },
};
