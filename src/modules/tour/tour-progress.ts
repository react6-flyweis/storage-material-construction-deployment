import { HOME_ROUTES, TOUR_NAV } from "./tour.adapter";
import { PAGE_INTROS } from "./tours/page-intros";
import { PAGE_CONTENT } from "./tours/tour-helpers";
import type { TourPanelConfig, TourStepConfig } from "./tour.types";

// Routes and panels as the tour compares them, and how many popovers a tour
// still has ahead of it.

export function stripPath(path: string): string {
  const clean = path.split("?")[0];
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

/** The route of a page, whichever of its tabs or views is open. */
export function pageRoute(route: string): string {
  return stripPath(route.split("?")[0]);
}

/** Matches a path against a route pattern; `:param` segments match anything. */
export function routeMatches(currentPath: string, pattern: string): boolean {
  const current = stripPath(currentPath);
  const target = stripPath(pattern);
  if (HOME_ROUTES.includes(target)) return HOME_ROUTES.includes(current);
  const currentParts = current.split("/");
  const targetParts = target.split("/");
  if (currentParts.length !== targetParts.length) return false;
  return targetParts.every((part, i) => part.startsWith(":") || part === currentParts[i]);
}

export function isSamePanel(a: TourPanelConfig, b: TourPanelConfig): boolean {
  return a.element === b.element && a.open.element === b.open.element;
}

/** Finds which sidebar tab (and sub-tab, if any) a route lives under. */
export function findNavLocation(route: string) {
  for (const tab of TOUR_NAV) {
    const sub = tab.subTabs?.find((item) => routeMatches(route, item.path));
    if (sub) return { tab, sub };
    if (tab.path && routeMatches(route, tab.path)) return { tab, sub: undefined };
  }
  return null;
}

/** Whether a step shows the whole page itself, so the page needs no intro. */
export function coversPage(step: TourStepConfig): boolean {
  return step.element === PAGE_CONTENT || step.element === PAGE_INTROS[pageRoute(step.route)]?.coveredBy;
}

/** A popover of a step: its page's intro, the step itself, or the control it highlights. */
export type TourSlot = string;
export const INTRO_SLOT: TourSlot = "intro";
export const MAIN_SLOT: TourSlot = "main";

export interface TourPlanState {
  route: string;
  panels: TourPanelConfig[];
  introducedPages: ReadonlySet<string>;
}

/** A tab, and a sub-tab, in the sidebar. */
export const navTab = (label: string) => `[data-tour-nav="${label}"]`;
export const navSubTab = (path: string) => `[data-tour-nav-sub="${path}"]`;

/** The sidebar clicks that lead from one page to another. */
function planSidebar(from: string, to: string): TourSlot[] {
  const target = findNavLocation(to);
  if (!target) return [];
  const { tab, sub } = target;
  if (!sub) return [navTab(tab.label)];
  const isSectionOpen = tab.subTabs?.some(({ path }) => stripPath(from).startsWith(path));
  return isSectionOpen ? [navSubTab(sub.path)] : [navTab(tab.label), navSubTab(sub.path)];
}

/** The popovers a step shows when it's reached from `state`, in order. */
export function planStep(step: TourStepConfig, state: TourPlanState, showClicks: boolean): TourSlot[] {
  const slots: TourSlot[] = [];
  const addPanels = (wanted: TourPanelConfig[], open: TourPanelConfig[]) => {
    let shared = 0;
    while (shared < wanted.length && shared < open.length && isSamePanel(wanted[shared], open[shared])) shared++;
    if (showClicks) slots.push(...wanted.slice(shared).map((panel) => panel.open.element));
  };

  let openPanels = state.panels;
  if (!routeMatches(state.route, step.route)) {
    const { via } = step;
    if (showClicks && via) {
      const isThere = routeMatches(state.route, via.fromRoute);
      if (!isThere) slots.push(...planSidebar(state.route, via.fromRoute));
      addPanels(via.panels ?? [], isThere ? openPanels : []);
      slots.push(via.element);
    } else if (showClicks) {
      slots.push(...planSidebar(state.route, step.route));
    }
    openPanels = [];
  }

  const page = pageRoute(step.route);
  if (PAGE_INTROS[page] && !coversPage(step) && !state.introducedPages.has(page)) slots.push(INTRO_SLOT);
  addPanels(step.panels ?? [], openPanels);
  slots.push(MAIN_SLOT);
  return slots;
}

/** How many popovers the steps after `index` are expected to show. */
export function countPopoversAfter(
  steps: TourStepConfig[],
  index: number,
  introducedPages: ReadonlySet<string>,
  showClicks: boolean,
): number {
  const introduced = new Set(introducedPages);
  let count = 0;
  for (let i = index; i < steps.length - 1; i++) {
    introduced.add(pageRoute(steps[i].route));
    const state = { route: steps[i].route, panels: steps[i].panels ?? [], introducedPages: introduced };
    count += planStep(steps[i + 1], state, showClicks).length;
  }
  return count;
}
