import type { TourDefinition } from "../tour.types";
import {
  calendarDeliveryModal,
  calendarTab,
  materialRequestModal,
  newTaskModal,
  projectListTab,
  requestMaterialModal,
  uploadMediaModal,
  workLogFormModal,
  workLogModal,
} from "./panels";
import { anchor, click, modal, onPage, PAGE_CONTENT, tab } from "./tour-helpers";

const NO_PROJECT = "You'll see this once a project is assigned to construction.";
const NO_DELIVERY = "You'll see this once a delivery is scheduled.";

const drawingPreviewModal = modal(
  "drawing-preview-modal",
  click(anchor("attachment-preview"), "Preview a File", "The <b>eye</b> opens the file without downloading it."),
);

const directTab = tab(
  "chat-new-direct",
  click(anchor("chat-direct-tab"), "Open Direct Messages", "Switch to <b>Direct Messages</b> for one-to-one chats."),
);

const newChatModal = modal(
  "new-chat-modal",
  click(anchor("chat-new-direct"), "Start a Chat", "<b>New Direct Chat</b> lets you pick a team member."),
);

/**
 * Every page with its main sections and actions. What's inside a project, and
 * receiving and verifying a delivery, have their own guides.
 */
export const constructionOverviewTour: TourDefinition = {
  id: "construction-overview",
  name: "Construction Walkthrough",
  description: "Every page of the construction panel and its main actions.",
  estimatedMinutes: 7,
  steps: [
    // ── Dashboard ───────────────────────────────────────────────────────
    ...onPage({ route: "/dashboard" }, [
      {
        id: "dash-stats",
        element: anchor("dashboard-stats"),
        title: "Dashboard: Key Numbers",
        description: "How your projects are doing: active, on track, delayed, completed and upcoming deadlines.",
      },
      {
        id: "dash-export",
        element: anchor("dashboard-export"),
        title: "Dashboard: Export Report",
        description: "Downloads the dashboard as an Excel report, using the filters you've set.",
        side: "left",
      },
      {
        id: "dash-filters",
        element: anchor("dashboard-filters"),
        title: "Dashboard: Filters",
        description: "Narrow everything on this page by project, status, business unit or dates.",
      },
      {
        id: "dash-deliveries",
        element: anchor("dashboard-deliveries"),
        title: "Dashboard: Delivery Overview",
        description: "Deliveries by stage. <b>View All</b> takes you to Delivery Tracking.",
        side: "right",
      },
      {
        id: "dash-materials",
        element: anchor("dashboard-materials"),
        title: "Dashboard: Material Requests",
        description: "How many requests are approved, waiting, rejected or urgent. <b>View All</b> opens them.",
        side: "right",
      },
      {
        id: "dash-sites",
        element: anchor("dashboard-sites"),
        title: "Dashboard: Active Sites",
        description: "Each construction site with its progress, deadline and delivery status.",
        side: "left",
      },
      {
        id: "dash-upcoming",
        element: anchor("dashboard-upcoming"),
        title: "Dashboard: Upcoming Tasks",
        description: "What's due next, and whether it's on time.",
        side: "top",
      },
      {
        id: "dash-timeline",
        element: anchor("dashboard-timeline"),
        title: "Dashboard: Project Timeline",
        description: "The overall phases of your projects and where they stand.",
        side: "top",
      },
      {
        id: "shell-sidebar",
        element: anchor("sidebar-nav"),
        title: "The Sidebar",
        description: "Every section has an icon here. Sections with several pages list them next to the icons, and red badges count unread messages and notifications.",
        speechText: "Use the sidebar to move between sections.",
        side: "right",
      },
      {
        id: "shell-search",
        element: anchor("header-search"),
        title: "Search Projects",
        description: "Type a project's name or ID, from any page, and pick it to open its details.",
      },
    ]),

    // ── Projects & calendar ─────────────────────────────────────────────
    ...onPage({ route: "/projects", panels: [calendarTab] }, [
      {
        id: "cal-grid",
        element: anchor("calendar-grid"),
        title: "Calendar: Deliveries by Date",
        description: "Click a day to see what arrives on it.",
        side: "right",
      },
      {
        id: "cal-delivery",
        element: anchor("delivery-details-modal"),
        panels: [calendarTab, calendarDeliveryModal],
        title: "Calendar: Delivery Details",
        description: "The delivery's route, schedule, carrier, material and documents.",
        whenMissing: "Opens when you click a delivery on a day that has one.",
        fallback: anchor("calendar-day-panel"),
      },
    ]),
    {
      id: "proj-list",
      route: "/projects",
      element: anchor("projects-list"),
      panels: [projectListTab],
      title: "Projects: The List",
      description: "Every project with a delivery, with its status and priority.",
      side: "top",
    },
    {
      id: "proj-view",
      route: "/projects",
      element: anchor("project-row-view"),
      panels: [projectListTab],
      title: "Projects: View",
      description: "Opens the project: its timeline, tasks, deliveries, BOM, drawings and work logs.",
      side: "left",
      whenMissing: NO_PROJECT,
      fallback: anchor("projects-list"),
      branch: {
        tourId: "project-details",
        label: "Project Details Guide (3 min)",
        description: "Want to see everything inside a project?",
      },
    },

    // ── Drawings & attachments ──────────────────────────────────────────
    ...onPage({ route: "/drawing-attachment" }, [
      {
        id: "att-project",
        element: anchor("attachments-project"),
        title: "Attachments: Project by Project",
        description: "Drawings and files are grouped by project, with its location and last update.",
        side: "top",
        whenMissing: "Each project's drawings are listed here once there are any.",
      },
      {
        id: "att-media",
        element: anchor("attachment-media"),
        title: "Attachments: Site Media",
        description: "Photos and videos of the construction work going on at the site.",
        side: "top",
        whenMissing: "Shown once photos or videos are uploaded from the site.",
        fallback: anchor("attachments-project"),
      },
      {
        id: "att-status",
        element: anchor("attachment-status"),
        title: "Attachments: Status",
        description: "Every file shows its current status.",
        side: "top",
        whenMissing: "Shown on every file.",
        fallback: anchor("attachments-project"),
      },
      {
        id: "att-preview",
        element: anchor("drawing-preview-modal"),
        panels: [drawingPreviewModal],
        title: "Attachments: Preview",
        description: "View the file with its project and approval status, or download it.",
        whenMissing: "Opens from the eye on any file.",
      },
      {
        id: "att-upload",
        element: anchor("upload-media-modal"),
        panels: [uploadMediaModal],
        title: "Attachments: Upload",
        description: "Choose the project, then drop a photo or video and upload it.",
      },
    ]),

    // ── Tasks & work logs ───────────────────────────────────────────────
    ...onPage({ route: "/tasks" }, [
      {
        id: "task-columns",
        element: anchor("tasks-columns"),
        title: "Tasks: The Board",
        description: "Tasks are grouped into To Do, In Progress and Done.",
        side: "top",
      },
      {
        id: "task-card",
        element: anchor("task-card"),
        title: "Tasks: A Task",
        description: "Its project, priority, progress, due date and who it's assigned to.",
        side: "right",
        whenMissing: "You'll see task cards here once tasks are added.",
        fallback: anchor("tasks-columns"),
      },
      {
        id: "task-add",
        element: anchor("new-task-modal"),
        panels: [newTaskModal],
        title: "Tasks: Add a Task",
        description: "Name it, pick the project, priority, status and deadline, then press <b>Create Task</b>.",
      },
    ]),
    ...onPage({ route: "/work-logs" }, [
      {
        id: "log-filters",
        element: anchor("work-logs-filters"),
        title: "Work Logs: Filters",
        description: "Search the entries or show one project.",
      },
      {
        id: "log-view",
        element: anchor("work-log-modal"),
        panels: [workLogModal],
        title: "Work Logs: View an Entry",
        description: "The full entry, with its description, issues and photos.",
        whenMissing: "Opens from <b>View</b> once there's an entry.",
        fallback: anchor("work-logs-table"),
      },
      {
        id: "log-add",
        element: anchor("daily-log-modal"),
        panels: [workLogFormModal],
        title: "Work Logs: Add an Entry",
        description: "Pick the project and task, set the progress, describe the work and any issues, add photos, then press <b>Create</b>.",
      },
    ]),

    // ── Material requests ───────────────────────────────────────────────
    ...onPage({ route: "/materials" }, [
      {
        id: "mat-filters",
        element: anchor("materials-filters"),
        title: "Materials: Filters",
        description: "Filter by project, department, status, requester or dates.",
      },
      {
        id: "mat-table",
        element: anchor("materials-table"),
        title: "Materials: Requests",
        description: "Every request with its items, dates, status and priority.",
        side: "top",
      },
      {
        id: "mat-view",
        element: anchor("material-request-modal"),
        panels: [materialRequestModal],
        title: "Materials: View a Request",
        description: "Its items, dates, status and notes. You can also cancel it here.",
        whenMissing: "Opens from <b>View</b> on any request in the list.",
        fallback: anchor("materials-table"),
      },
      {
        id: "mat-request",
        element: anchor("request-material-modal"),
        panels: [requestMaterialModal],
        title: "Materials: Request Material",
        description: "Fill in when and where it's needed, the priority, the material and the quantity, then submit it for approval.",
      },
    ]),

    // ── Deliveries & dispatch ───────────────────────────────────────────
    ...onPage({ route: "/delivery-tracking", whenMissing: NO_DELIVERY }, [
      {
        id: "del-toolbar",
        element: anchor("deliveries-toolbar"),
        title: "Deliveries: Search & Sort",
        description: "Search, filter by status or change the order.",
      },
      {
        id: "del-card",
        element: anchor("delivery-card"),
        title: "Deliveries: A Delivery",
        description: "Its material, schedule, carrier, route and driver, with buttons to view, scan and receive it.",
        side: "top",
      },
      {
        id: "del-received",
        element: anchor("delivery-mark-received"),
        title: "Deliveries: Mark as Received",
        description: "Confirms the whole delivery arrived.",
        side: "top",
        whenMissing: "Shown on deliveries that haven't been delivered yet.",
        fallback: anchor("delivery-card"),
      },
    ]),
    ...onPage({ route: "/delivery-tracking/bundle-scan" }, [
      {
        id: "disp-projects",
        element: anchor("dispatch-projects"),
        title: "Dispatch: Projects",
        description: "Projects with their packing lists, bundles and labels still to be printed.",
        side: "top",
      },
      {
        id: "disp-scan",
        element: anchor("dispatch-scan"),
        title: "Dispatch: Scan QR Code",
        description: "Verify a bundle by scanning its label, or type its ID with <b>Manual Entry</b>.",
        side: "left",
        branch: {
          tourId: "dispatch-flow",
          label: "Delivery & Dispatch Guide (4 min)",
          description: "Want to follow a delivery from arrival to verified bundles?",
        },
      },
    ]),

    // ── Communication & notifications ───────────────────────────────────
    ...onPage({ route: "/communication" }, [
      {
        id: "chat",
        element: PAGE_CONTENT,
        title: "Communication",
        description: "Your team chats: conversations on the left, messages on the right.",
      },
      {
        id: "chat-new",
        element: anchor("new-chat-modal"),
        panels: [directTab, newChatModal],
        title: "Chat: New Direct Chat",
        description: "Search for a team member and choose them to start chatting.",
      },
    ]),
    ...onPage({ route: "/notifications" }, [
      {
        id: "notifications",
        element: PAGE_CONTENT,
        title: "Notifications",
        description: "Every update sent to you. Click one to go straight to what it's about.",
      },
      {
        id: "notif-filters",
        element: anchor("notifications-filters"),
        title: "Notifications: Filters",
        description: "Show only unread ones, or one topic such as tasks, deliveries, materials or drawings.",
      },
    ]),

    {
      id: "overview-end",
      route: "/notifications",
      element: anchor("tour-hub-btn"),
      title: "That's the Panel",
      description: "Open this menu any time to replay the walkthrough or take one of the detailed guides.",
    },
  ],
};
