export type TourId =
  | "construction-overview"
  | "project-details"
  | "dispatch-flow";

/** A sidebar tab, as the tour sees it. */
export interface TourNavTab {
  label: string;
  path?: string;
  subTabs?: { label: string; path: string }[];
}

/** Offers a jump into a more detailed tour from this step. */
export interface TourStepBranchConfig {
  tourId: TourId;
  label: string;
  description?: string;
  /** Step of the current tour to resume at afterwards. Defaults to the next step. */
  resumeStepId?: string;
}

/** A control the tour highlights, then waits for the user (or Next) to click. */
export interface TourClickConfig {
  element: string;
  title: string;
  description: string;
  speechText?: string;
}

/**
 * Something on the page that has to be opened before a step can be shown: a
 * modal, a menu, a drawer or a tab.
 */
export interface TourPanelConfig {
  /** Present in the DOM only while the panel is open. */
  element: string;
  open: TourClickConfig;
  /** Control that closes it. Found automatically for the shared modals. */
  close?: string;
  /** A tab: opening another one replaces it, so there is nothing to close. */
  isTab?: boolean;
}

/**
 * The in-page control a user clicks to reach this step's page (a row's View
 * button, a Back button...). The tour highlights it before moving on.
 */
export interface TourStepViaConfig extends TourClickConfig {
  /** Page the control lives on. May contain route params like `:projectId`. */
  fromRoute: string;
  /** Panels the control lives in, e.g. a tab or a menu. */
  panels?: TourPanelConfig[];
  /** Open the page directly when the control is absent. */
  openAnyway?: boolean;
}

export interface TourStepConfig {
  id: string;
  /** May contain params such as `:projectId`; resolved at runtime. */
  route: string;
  element: string;
  title: string;
  description: string;
  speechText?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  branch?: TourStepBranchConfig;
  via?: TourStepViaConfig;
  /** Panels this step lives in, outermost first. Kept open across steps that share them. */
  panels?: TourPanelConfig[];
  /** When the target will be available. Shown if it isn't there right now. */
  whenMissing?: string;
  /** Highlighted instead when the target isn't there right now. */
  fallback?: string;
  /** Blocks clicks on the highlighted element, so exploring can't change data. Defaults to true. */
  locked?: boolean;
}

/** Introduces a whole page before the tour goes through its sections. */
export interface TourPageIntro {
  title: string;
  description: string;
  /** A step on this element already shows the whole page, so it needs no intro. */
  coveredBy?: string;
}

export interface TourDefinition {
  id: TourId;
  name: string;
  description: string;
  estimatedMinutes: number;
  steps: TourStepConfig[];
}
