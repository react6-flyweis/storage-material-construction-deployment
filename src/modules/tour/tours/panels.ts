import type { TourStepViaConfig } from "../tour.types";
import { anchor, anchorWithStatus, click, modal, tab } from "./tour-helpers";

// Pages, modals, menus and tabs shared by several tours.

export const PROJECT = "/projects/:projectId";

export const calendarTab = tab(
  "calendar-grid",
  click(anchor("projects-tab-calendar"), "Open Calendar", "<b>Calendar</b> shows deliveries by date."),
);

export const projectListTab = tab(
  "projects-list",
  click(anchor("projects-tab-list"), "Open Project", "<b>Project</b> switches from the calendar to the list of projects."),
);

export const openProject: TourStepViaConfig = {
  fromRoute: "/projects",
  panels: [projectListTab],
  openAnyway: true,
  ...click(anchor("project-row-view"), "Open a Project", "Click <b>View</b> to open the project's details."),
};

/** One of the buttons at the top of a project. */
export const projectButton = (label: string): TourStepViaConfig => ({
  fromRoute: PROJECT,
  openAnyway: true,
  ...click(anchor(`project-nav-${label}`), `Open ${label.replace(/^View /, "")}`, `Click <b>${label}</b> at the top of the project.`),
});

export const calendarDeliveryModal = modal(
  "delivery-details-modal",
  click(anchor("calendar-delivery"), "Open a Delivery", "Click a delivery to see its details."),
);

export const uploadMediaModal = modal(
  "upload-media-modal",
  click(anchor("attachments-upload"), "Upload Photos & Videos", "<b>Upload Photos &amp; Videos</b> opens the upload form."),
);

export const siteContactModal = modal(
  "site-contact-modal",
  click(anchor("delivery-site-contact"), "Update Site Contact", "<b>Update Site Contact</b> opens the contact form."),
);

export const qrLabelModal = modal(
  "bundle-qr-modal",
  click(anchor("bundle-qr"), "View the QR Label", "Click the QR code to see the label."),
);

export const trackedDeliveryModal = modal(
  "delivery-details-modal",
  click(anchor("delivery-view-details"), "View Details", "<b>View Details</b> opens everything known about the delivery."),
);

export const newTaskModal = modal(
  "new-task-modal",
  click(anchor("tasks-add-task"), "Add a Task", "<b>Add Task</b> opens the task form."),
);

export const workLogFormModal = modal(
  "daily-log-modal",
  click(anchor("work-logs-add"), "Add a Work Log", "<b>Add Log</b> opens the work log form."),
);

export const workLogModal = modal(
  "work-log-modal",
  click(anchor("work-log-view"), "View a Work Log", "<b>View</b> opens the full entry."),
);

export const requestMaterialModal = modal(
  "request-material-modal",
  click(anchor("materials-request"), "Request Material", "<b>Requests Material</b> opens the request form."),
);

export const scanModal = (openedBy: string) =>
  modal("scan-qr-modal", click(anchor(openedBy), "Scan a QR Code", "This opens the bundle scanner."));

export const addConstructionTaskModal = modal(
  "add-construction-task-modal",
  click(anchor("construction-task-add"), "Add a Construction Task", "<b>Add</b> opens the task form."),
);

/** A construction task that is still open. */
export const constructionTaskModal = modal(
  "construction-task-modal",
  click(
    anchorWithStatus("construction-task-view", "open"),
    "View an Open Task",
    "Click the <b>eye</b> on a task that is <b>still open</b>.",
  ),
  { element: anchorWithStatus("construction-task-modal", "open") },
);

/** A material request, whatever its status. */
export const materialRequestModal = modal(
  "material-request-modal",
  click(anchor("material-view"), "View a Request", "<b>View</b> opens the request."),
);

export const mismatchModal = modal(
  "report-mismatch-modal",
  click(anchor("bundle-mismatch"), "Report a Mismatch", "<b>Report Mismatch</b> opens the report."),
);
