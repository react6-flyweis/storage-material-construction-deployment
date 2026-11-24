import type { TourDefinition } from "../tour.types";
import {
  addConstructionTaskModal,
  constructionTaskModal,
  openProject,
  PROJECT,
  projectButton,
  projectListTab,
  scanModal,
} from "./panels";
import { anchor, onPage, PAGE_CONTENT } from "./tour-helpers";

const NO_PROJECT = "You'll see this once a project is assigned to construction.";

/**
 * A project from top to bottom, then its buttons from left to right. Each page
 * behind a button is shown as a whole; the next button brings the tour back to
 * the project by itself.
 */
export const projectDetailsTour: TourDefinition = {
  id: "project-details",
  name: "Project Details Guide",
  description: "Every section of a project and the pages behind its buttons.",
  estimatedMinutes: 3,
  steps: [
    {
      id: "pd-list",
      route: "/projects",
      element: anchor("projects-list"),
      panels: [projectListTab],
      title: "Your Projects",
      description: "We'll open the first project in this list.",
      side: "top",
    },

    // ── Sections, top to bottom ─────────────────────────────────────────
    {
      id: "pd-nav",
      route: PROJECT,
      element: anchor("project-nav"),
      title: "Project Pages",
      description: "These buttons open the BOM, drawings, material delivery, work logs and bundle scanner. We'll open them in this order after the sections below.",
      via: openProject,
      whenMissing: NO_PROJECT,
    },
    ...onPage({ route: PROJECT, whenMissing: NO_PROJECT }, [
      {
        id: "pd-summary",
        element: anchor("project-summary"),
        title: "Project Summary",
        description: "The project's status, priority, customer, buildings and location.",
      },
      {
        id: "pd-lifecycle",
        element: anchor("project-lifecycle"),
        title: "Project Lifecycle",
        description: "The project's phases, and how far along it is.",
        side: "top",
        whenMissing: "Shown once the project has a lifecycle timeline.",
      },
      {
        id: "pd-tasks",
        element: anchor("construction-tasks"),
        title: "Construction Tasks",
        description: "The steps of the build, with their dates and whether they're on time.",
        side: "top",
      },
      {
        id: "pd-task-add",
        element: anchor("add-construction-task-modal"),
        panels: [addConstructionTaskModal],
        title: "New Construction Task",
        description: "Choose the step, its dates, describe the work and add photos.",
      },
      {
        id: "pd-task-view",
        element: anchor("construction-task-modal"),
        panels: [constructionTaskModal],
        title: "View a Task",
        description: "Its dates, status, description and photos. You can also mark it complete or remove it here.",
        whenMissing: "Opens from the eye on a task that's still open.",
        fallback: anchor("construction-tasks"),
      },
      {
        id: "pd-task-complete",
        element: anchor("construction-task-complete"),
        title: "Task: Mark Complete",
        description: "Closes the task without opening it.",
        whenMissing: "Shown on tasks that are still open.",
        fallback: anchor("construction-tasks"),
      },
      {
        id: "pd-deliveries",
        element: anchor("project-deliveries"),
        title: "Upcoming Material Delivery",
        description: "The project's deliveries. Click a delivery's number to open it, or call or email the contact.",
        side: "top",
      },
      {
        id: "pd-project-tasks",
        element: anchor("project-tasks"),
        title: "Project Tasks",
        description: "Other tasks on the project, with their priority, due date and assignee.",
        side: "top",
        whenMissing: "Shown once tasks are assigned on the project.",
      },
    ]),

    // ── Buttons, left to right ──────────────────────────────────────────
    {
      id: "pd-bom",
      route: `${PROJECT}/view-bom`,
      element: PAGE_CONTENT,
      title: "Project BOM",
      description: "The project's bill of materials, with totals on top and every part below. <b>Download</b> saves it.",
      via: projectButton("View BOM"),
      whenMissing: NO_PROJECT,
    },
    {
      id: "pd-drawings",
      route: `${PROJECT}/view-drawings`,
      element: PAGE_CONTENT,
      title: "Project Drawings & Photos",
      description: "The project's drawings with their approval status, and its site photos and videos. Upload new photos from the top.",
      via: projectButton("View Drawings & Photos"),
      whenMissing: NO_PROJECT,
    },
    {
      id: "pd-delivery",
      route: `${PROJECT}/material-delivery`,
      element: PAGE_CONTENT,
      title: "Material Delivery",
      description: "The project's delivery from end to end: route, status, contacts, documents and history.",
      via: projectButton("Material Delivery"),
      whenMissing: NO_PROJECT,
    },
    {
      id: "pd-logs",
      route: "/work-logs",
      element: PAGE_CONTENT,
      title: "Daily Work Logs",
      description: "The work logs, already filtered to this project. <b>Add Log</b> records a new entry.",
      via: projectButton("Daily Work Logs"),
    },
    {
      id: "pd-scan",
      route: PROJECT,
      element: anchor("scan-qr-modal"),
      panels: [scanModal("project-nav-Bundle Scan")],
      title: "Bundle Scan",
      description: "Last one: scan one of this project's bundles with your camera, or type its ID.",
      whenMissing: NO_PROJECT,
    },
  ],
};
