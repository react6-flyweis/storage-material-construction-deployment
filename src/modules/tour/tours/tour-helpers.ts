import type { TourClickConfig, TourPanelConfig, TourStepConfig } from "../tour.types";

/** CSS selector for a `data-tour` anchor. */
export const anchor = (tourId: string) => `[data-tour="${tourId}"]`;

/** Same, but only for records in the given status. */
export const anchorWithStatus = (tourId: string, status: string) =>
  `[data-tour="${tourId}"][data-tour-status="${status}"]`;

/** The layout's content area: everything but the sidebar and header. */
export const PAGE_CONTENT = anchor("page-content");

/** A "click here" hint; `what` completes the sentence before the Next reminder. */
export const click = (element: string, title: string, what: string): TourClickConfig => ({
  element,
  title,
  description: `${what} Click it yourself, or press Next and we'll do it for you.`,
  speechText: `${title}.`,
});

/** A modal, drawer or menu opened by a button. */
export const modal = (
  tourId: string,
  open: TourClickConfig,
  options: { element?: string; close?: string } = {},
): TourPanelConfig => ({
  element: options.element ?? anchor(tourId),
  open,
  close: options.close,
});

/** A tab, opened by its tab button. */
export const tab = (tourId: string, open: TourClickConfig): TourPanelConfig => ({
  element: anchor(tourId),
  open,
  isTab: true,
});

/** Steps that share a page (and panels) without repeating them on each one. */
export const onPage = (
  shared: Pick<TourStepConfig, "route" | "panels" | "whenMissing" | "fallback">,
  steps: (Omit<TourStepConfig, "route"> & { route?: string })[],
): TourStepConfig[] => steps.map((step) => ({ ...shared, ...step }));
