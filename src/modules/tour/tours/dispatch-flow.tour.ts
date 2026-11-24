import type { TourDefinition } from "../tour.types";
import { mismatchModal, qrLabelModal, scanModal, siteContactModal, trackedDeliveryModal } from "./panels";
import { anchor, anchorWithStatus, click, onPage, PAGE_CONTENT } from "./tour-helpers";

const TRACKING = "/delivery-tracking";
const DISPATCH = `${TRACKING}/bundle-scan`;
const LOADS = `${DISPATCH}/projects/:dispatchProjectId/loads`;
const BUNDLES = `${DISPATCH}/loads/:packingListId/bundles`;
const BUNDLE = `${DISPATCH}/bundles/:bundleId`;

const NO_DELIVERY = "You'll see this once a delivery is scheduled.";
const NO_LOADS = "You'll see this once a project has bundles to check.";
const NO_BUNDLES = "You'll see this once a load has bundles.";
const NOT_DELIVERED = "Shown on deliveries that haven't been delivered yet.";

/** Follows a delivery from arrival to verified bundles. */
export const dispatchFlowTour: TourDefinition = {
  id: "dispatch-flow",
  name: "Delivery & Dispatch Guide",
  description: "Receive a delivery, then check and verify its bundles.",
  estimatedMinutes: 4,
  steps: [
    // ── 1. Receiving ────────────────────────────────────────────────────
    ...onPage({ route: TRACKING, whenMissing: NO_DELIVERY }, [
      {
        id: "df-card",
        element: anchor("delivery-card"),
        title: "1 · A Delivery Arrives",
        description: "Every delivery on its way to you is listed here.",
        side: "top",
      },
      {
        id: "df-details",
        element: anchor("delivery-details-modal"),
        panels: [trackedDeliveryModal],
        title: "1 · Check the Details",
        description: "What's on board, the carrier and the documents. Check them before it arrives.",
      },
      {
        id: "df-contact",
        element: anchor("site-contact-modal"),
        panels: [siteContactModal],
        title: "1 · Who Receives It",
        description: "Make sure the right person on site is listed.",
      },
    ]),
    ...onPage({ route: TRACKING, whenMissing: NOT_DELIVERED, fallback: anchor("delivery-card") }, [
      {
        id: "df-received",
        element: anchor("delivery-mark-received"),
        title: "1 · Everything Arrived",
        description: "<b>Mark as Received</b> confirms the whole delivery.",
        side: "top",
      },
      {
        id: "df-scan",
        element: anchor("scan-qr-modal"),
        panels: [scanModal("delivery-scan")],
        title: "1 · Scan a Bundle",
        description: "Scan a bundle's label with your camera, or type its ID.",
      },
      {
        id: "df-partial",
        element: anchor("delivery-partial"),
        title: "1 · Only Part Arrived",
        description: "<b>Partial Received</b> takes you to the loads, to check them one bundle at a time.",
        side: "top",
      },
    ]),

    // ── 2. Verifying ────────────────────────────────────────────────────
    {
      id: "df-projects",
      route: DISPATCH,
      element: anchor("dispatch-projects"),
      title: "2 · Pick a Project",
      description: "Choose the project whose bundles you want to check.",
      side: "top",
    },
    {
      id: "df-loads",
      route: LOADS,
      element: PAGE_CONTENT,
      title: "2 · Packing Lists & Loads",
      description: "One row per truckload, with its bundles, weight, status and any mismatch.",
      via: {
        fromRoute: DISPATCH,
        ...click(
          anchorWithStatus("dispatch-project-view", "has-bundles"),
          "Open a Project",
          "Click <b>View</b> on a project that has bundles.",
        ),
      },
      whenMissing: NO_LOADS,
      fallback: anchor("dispatch-projects"),
    },
    {
      id: "df-bundles",
      route: BUNDLES,
      element: PAGE_CONTENT,
      title: "2 · Bundles",
      description: "Every bundle on the truck, with its label, verification status and any mismatch.",
      via: {
        fromRoute: LOADS,
        ...click(
          anchorWithStatus("load-view", "has-bundles"),
          "Open a Load",
          "Click <b>View</b> on a load that has bundles.",
        ),
      },
      whenMissing: NO_BUNDLES,
      fallback: anchor("loads-table"),
    },
    {
      id: "df-bundle",
      route: BUNDLE,
      element: PAGE_CONTENT,
      title: "2 · A Bundle",
      description: "Its project, packing list and truck, with its items, QR label and verification.",
      via: {
        fromRoute: BUNDLES,
        ...click(anchor("bundle-details"), "Open a Bundle", "Click <b>Details</b> to open the bundle."),
      },
      whenMissing: NO_BUNDLES,
    },
    ...onPage({ route: BUNDLE, whenMissing: NO_BUNDLES }, [
      {
        id: "df-items",
        element: anchor("bundle-items"),
        title: "2 · What's Inside",
        description: "Compare these parts with what you received.",
        side: "top",
      },
      {
        id: "df-qr",
        element: anchor("bundle-qr-modal"),
        panels: [qrLabelModal],
        title: "2 · The QR Label",
        description: "Preview the label and print it.",
      },
      {
        id: "df-verify",
        element: anchor("bundle-verify"),
        title: "2 · Verify Bundle",
        description: "Press it when everything matches.",
        side: "left",
      },
      {
        id: "df-mismatch",
        element: anchor("report-mismatch-modal"),
        panels: [mismatchModal],
        title: "2 · If Something Is Wrong",
        description: "Enter what you received of each item, choose a reason and submit the report.",
      },
    ]),
  ],
};
