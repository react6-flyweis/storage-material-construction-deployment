import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour.css";
import type { NavigateFunction } from "react-router-dom";
import {
  PROJECT_PARAM,
  fetchFirstProjectId,
  isDataLoading,
  notify,
} from "./tour.adapter";
import {
  INTRO_SLOT,
  MAIN_SLOT,
  countPopoversAfter,
  coversPage,
  findNavLocation,
  isSamePanel,
  navSubTab,
  navTab,
  pageRoute,
  planStep,
  routeMatches,
  stripPath,
  type TourSlot,
} from "./tour-progress";
import { tourSpeech, type SpeechState } from "./tour-speech.service";
import { useTourStore } from "./tour.store";
import { TOURS_REGISTRY } from "./tours";
import { PAGE_INTROS } from "./tours/page-intros";
import { PAGE_CONTENT } from "./tours/tour-helpers";
import type {
  TourClickConfig,
  TourDefinition,
  TourPanelConfig,
  TourStepBranchConfig,
  TourStepConfig,
  TourId,
} from "./tour.types";

const DESKTOP_TOUR_WIDTH = 1024;
/** How long a page's first section may take before the page is introduced anyway. */
const PAGE_INTRO_WAIT_MS = 2500;
/** Shortest wait for a target before deciding it isn't there. */
const ELEMENT_TIMEOUT_MS = 1000;
/** Same, right after a page change: the page's code may still be loading. */
const PAGE_TIMEOUT_MS = 2500;
/** Longest wait, for pages that are still fetching their data. */
const MAX_TIMEOUT_MS = 12000;
/** Data has to be idle this long before a target counts as missing. */
const IDLE_MS = 400;
const POLL_MS = 80;
const NAVIGATION_TIMEOUT_MS = 1500;
/** Lets a modal or tab finish animating so the highlight fits it. */
const PANEL_SETTLE_MS = 350;

const DEFAULT_MISSING = "There's nothing to show here yet. It appears once there's a matching record.";

function isTourTargetVisible(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findVisible(selector: string): HTMLElement | null {
  for (const element of document.querySelectorAll(selector)) {
    if (isTourTargetVisible(element)) return element;
  }
  return null;
}

/** Scrolls a page, and whatever it scrolls in, back to the top. */
function scrollPageToTop(page: Element) {
  for (let node: Element | null = page; node; node = node.parentElement) {
    node.scrollTop = 0;
  }
}

function currentLocation(): string {
  return window.location.pathname + window.location.search;
}

/** Radix menus open on pointerdown rather than on click. */
function isMenuTrigger(element: HTMLElement): boolean {
  return element.getAttribute("aria-haspopup") === "menu";
}

function activate(element: HTMLElement) {
  if (isMenuTrigger(element)) {
    element.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, pointerType: "mouse" }),
    );
    return;
  }
  element.click();
}

/**
 * Builds the "click here" steps a user would take in the sidebar to get to
 * `targetRoute`. Empty when the route isn't in the sidebar.
 */
function buildNavHints(targetRoute: string): TourClickConfig[] {
  const target = findNavLocation(targetRoute);
  if (!target) return [];
  const { tab, sub } = target;
  const hints: TourClickConfig[] = [];

  // A page deeper in the same section keeps its sub-tabs open, so the target
  // may already be one click away.
  const isSectionOpen = !!sub && !!findVisible(navSubTab(sub.path));
  if (!isSectionOpen) {
    hints.push({
      element: navTab(tab.label),
      title: `Go to ${tab.label}`,
      description: `Click the <b>${tab.label}</b> icon in the sidebar to open ${sub ? "its sections" : "it"}. Click it yourself, or press Next and we'll do it for you.`,
      speechText: `Click ${tab.label} in the sidebar.`,
    });
  }

  if (sub) {
    hints.push({
      element: navSubTab(sub.path),
      title: `Open ${sub.label}`,
      description: `Inside <b>${tab.label}</b>, click <b>${sub.label}</b> to open that page. Click it yourself, or press Next and we'll do it for you.`,
      speechText: `Now click ${sub.label}.`,
    });
  }

  return hints;
}

type Direction = "forward" | "backward";
type HintResult = "clicked" | "missing" | "cancelled";

interface PopoverConfig {
  element: HTMLElement | null;
  title: string;
  description: string;
  speechText: string;
  side?: TourStepConfig["side"];
  align?: TourStepConfig["align"];
  index: number;
  /** Which of its step's popovers this is. */
  slot: TourSlot;
  nextBtnText: string;
  branch?: TourStepBranchConfig;
  locked: boolean;
  /** Highlights a whole page rather than one part of it. */
  isPage?: boolean;
  /** Back works even on the first step, where it returns to the page intro. */
  canGoBack?: boolean;
  onNext: () => void;
  onPrev: () => void;
}

interface ResumeTourContext {
  tourId: TourId;
  stepIndex: number;
  /** Popovers already shown, so the count carries on where it was left. */
  shownCount: number;
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export class TourCoordinator {
  private driverObj: Driver | null = null;
  private navigate: NavigateFunction | null = null;
  private currentTour: TourDefinition | null = null;
  private stepToken = 0;
  private unsubscribe: (() => void) | null = null;
  private currentSpeechUnsub: (() => void) | null = null;
  private cancelPendingHint: (() => void) | null = null;
  /** What the visible popover narrates; replayed when audio is unmuted. */
  private currentSpeechText = "";
  /** Set while a branched tour runs; where to return when it ends. */
  private resumeContext: ResumeTourContext | null = null;
  /** Pages this run has already introduced as a whole. */
  private introducedPages = new Set<string>();
  /** Steps of the current tour that a page intro was shown before. */
  private pageIntroSteps = new Set<number>();
  /** Real paths of visited pages by route pattern, so Back can return to them. */
  private visitedPaths = new Map<string, string>();
  /** Last seen value of each route param, so every step stays on the same record. */
  private routeParams = new Map<string, string>();
  /** Pages whose click path was missing; their steps are explained instead. */
  private unreachableRoutes = new Set<string>();
  /** Modals and tabs the tour has opened, outermost first. */
  private openPanels: TourPanelConfig[] = [];
  /** Number of the visible popover, as shown in its "x of y". */
  private shownCount = 0;
  /** Numbers of the popovers shown so far, so Back shows them again. */
  private shownNumbers = new Map<string, number>();
  /** Popovers the current step was expected to show when it was entered. */
  private stepSlots: TourSlot[] = [];
  private direction: Direction = "forward";

  private cleanupSpeechSubscription() {
    this.currentSpeechUnsub?.();
    this.currentSpeechUnsub = null;
  }

  private clearPendingHint() {
    const cancel = this.cancelPendingHint;
    this.cancelPendingHint = null;
    cancel?.();
  }

  public init(navigate: NavigateFunction) {
    this.navigate = navigate;
    if (this.unsubscribe) return;

    this.unsubscribe = useTourStore.subscribe((state, previous) => {
      if (state.isAudioMuted === previous.isAudioMuted) return;
      if (state.isAudioMuted) {
        tourSpeech.stop("muted");
        return;
      }
      if (!this.currentTour || !this.currentSpeechText) return;
      tourSpeech.speak(this.currentSpeechText, false);
    });
  }

  /** Waits for a target, for as long as the app is still loading its data. */
  private async waitForElement(
    selector: string,
    token: number,
    timeoutMs = ELEMENT_TIMEOUT_MS,
  ): Promise<HTMLElement | null> {
    const startedAt = Date.now();
    let idleSince = startedAt;
    while (token === this.stepToken) {
      const element = findVisible(selector);
      if (element) return element;

      const now = Date.now();
      if (isDataLoading()) idleSince = now;
      const waited = now - startedAt;
      if (waited >= MAX_TIMEOUT_MS) return null;
      if (waited >= timeoutMs && now - idleSince >= IDLE_MS) return null;
      await delay(POLL_MS);
    }
    return null;
  }

  /** Waits until a page has loaded its code and data. */
  private async waitForIdle(token: number): Promise<void> {
    const startedAt = Date.now();
    let idleSince = startedAt;
    while (token === this.stepToken && Date.now() - startedAt < MAX_TIMEOUT_MS) {
      if (isDataLoading()) idleSince = Date.now();
      if (Date.now() - idleSince >= IDLE_MS) return;
      await delay(POLL_MS);
    }
  }

  public async startTour(
    tour: TourDefinition,
    startIndex = 0,
    resumeContext?: ResumeTourContext | null,
    shownCount = 0,
  ) {
    this.stopTour(false);
    if (resumeContext !== undefined) {
      this.resumeContext = resumeContext;
    } else {
      // A new run picks its own records, not those of an earlier one.
      this.introducedPages.clear();
      this.visitedPaths.clear();
      this.routeParams.clear();
      this.resumeContext = null;
    }
    this.pageIntroSteps.clear();
    this.shownNumbers.clear();
    this.shownCount = shownCount;
    tourSpeech.prime();
    this.currentTour = tour;
    useTourStore.getState().setActiveTour(tour.id);

    if (window.innerWidth < DESKTOP_TOUR_WIDTH) {
      notify("This tour is designed for desktop. Sidebar clicks are skipped on smaller screens.");
    }

    this.driverObj = driver({
      animate: true,
      allowClose: true,
      overlayClickBehavior: "none",
      overlayColor: "rgba(15, 23, 42, 0.7)",
      stagePadding: 8,
      stageRadius: 8,
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Finish Tour ✓",
      showProgress: true,
      onDestroyed: (_element, _step, opts) => {
        if (opts.reason === "replaced") return;
        // Closed by driver.js itself (e.g. Escape) rather than through stopTour.
        if (this.driverObj) {
          this.driverObj = null;
          this.stopTour();
        }
        if (useTourStore.getState().activeTourId) {
          useTourStore.getState().setActiveTour(null);
        }
      },
    });

    await this.goToStep(startIndex);
  }

  /** Fills a route's params. Null if they can't be found. */
  private async resolveRoute(pattern: string, reachedByClick: boolean): Promise<string | null> {
    if (routeMatches(currentLocation(), pattern)) return currentLocation();

    const visited = this.visitedPaths.get(pattern);
    if (visited) return visited;

    if (!pattern.includes(":")) {
      // Pages opened from a record carry it in their query string or state.
      return reachedByClick ? null : pattern;
    }

    // Only the project can be looked up without clicking a row first.
    if (pattern.includes(PROJECT_PARAM) && !this.routeParams.has(PROJECT_PARAM)) {
      const projectId = await fetchFirstProjectId();
      if (projectId) this.routeParams.set(PROJECT_PARAM, projectId);
    }

    const route = pattern
      .split("/")
      .map((part) => (part.startsWith(":") ? (this.routeParams.get(part) ?? part) : part))
      .join("/");
    return route.includes(":") ? null : route;
  }

  private rememberRoute(pattern: string) {
    if (!routeMatches(currentLocation(), pattern)) return;
    this.unreachableRoutes.delete(pattern);
    this.visitedPaths.set(pattern, currentLocation());
    const currentParts = stripPath(window.location.pathname).split("/");
    stripPath(pattern)
      .split("/")
      .forEach((part, i) => {
        if (part.startsWith(":")) this.routeParams.set(part, currentParts[i]);
      });
  }

  private async waitForRoute(pattern: string, timeoutMs = NAVIGATION_TIMEOUT_MS): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!routeMatches(currentLocation(), pattern) && Date.now() < deadline) {
      await delay(50);
    }
  }

  private closePanel(panel: TourPanelConfig) {
    if (panel.isTab) return;
    const root = findVisible(panel.element);
    if (!root) return;

    const closer =
      (panel.close && document.querySelector<HTMLElement>(panel.close)) ||
      root.querySelector<HTMLElement>("[data-tour-close]") ||
      root.closest<HTMLElement>("[data-modal-backdrop]");
    if (closer) {
      activate(closer);
      return;
    }
    // Radix dialogs and menus.
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  }

  private closePanelsFrom(depth: number): boolean {
    let closedAny = false;
    while (this.openPanels.length > depth) {
      const panel = this.openPanels.pop();
      if (!panel) break;
      if (!panel.isTab) closedAny = true;
      this.closePanel(panel);
    }
    return closedAny;
  }

  /** How many of the `wanted` panels are already open. */
  private countSharedPanels(wanted: TourPanelConfig[]): number {
    this.openPanels = this.openPanels.filter((panel) => document.querySelector(panel.element));
    let shared = 0;
    while (
      shared < wanted.length &&
      shared < this.openPanels.length &&
      isSamePanel(this.openPanels[shared], wanted[shared])
    ) {
      shared++;
    }
    return shared;
  }

  /** Opens the `panels` that aren't open yet, showing the click when `showClicks`. */
  private async openPanelsUpTo(
    panels: TourPanelConfig[],
    index: number,
    token: number,
    showClicks: boolean,
    timeoutMs = ELEMENT_TIMEOUT_MS,
  ): Promise<HintResult> {
    for (const panel of panels.slice(this.openPanels.length)) {
      if (!findVisible(panel.element)) {
        if (showClicks) {
          const result = await this.showClickHint(panel.open, index, token, timeoutMs);
          if (result !== "clicked") return result;
        } else {
          const trigger = await this.waitForElement(panel.open.element, token, timeoutMs);
          if (token !== this.stepToken) return "cancelled";
          if (!trigger) return "missing";
          activate(trigger);
        }

        this.setWaiting(true);
        const opened = await this.waitForElement(panel.element, token);
        if (token !== this.stepToken) return "cancelled";
        if (!opened) return "missing";
        this.openPanels.push(panel);
        await delay(PANEL_SETTLE_MS);
        if (token !== this.stepToken) return "cancelled";
        continue;
      }
      this.openPanels.push(panel);
    }
    return "clicked";
  }

  /** Explains a step whose target isn't there, so no page or action is left out. */
  private presentMissing(step: TourStepConfig, index: number) {
    const note = step.whenMissing ?? DEFAULT_MISSING;
    this.presentStep(
      {
        ...step,
        description: `${step.description}<div class="tour-unavailable"><b>Not on screen right now.</b> ${note}</div>`,
        speechText: `${step.speechText || step.description} ${note}`,
      },
      index,
      step.fallback ? findVisible(step.fallback) : null,
    );
  }

  /** Shows the sidebar clicks that lead to `targetRoute`. False if the tour moved on. */
  private async walkSidebarTo(targetRoute: string, index: number, token: number): Promise<boolean> {
    const hints = buildNavHints(targetRoute);
    for (let i = 0; i < hints.length; i++) {
      if (i > 0) {
        // The side panel slides its sub-items into place; let it settle
        // so the highlight lands on the final position.
        await delay(PANEL_SETTLE_MS);
        if (token !== this.stepToken) return false;
      }
      const result = await this.showClickHint(hints[i], index, token);
      if (result === "cancelled") return false;
    }
    if (hints.length) await this.waitForRoute(targetRoute, 300);
    return token === this.stepToken;
  }

  private setWaiting(isWaiting: boolean) {
    document.body.classList.toggle("tour-waiting", isWaiting);
  }

  /**
   * Gets the user to the step's page. Forward on desktop every click on the way
   * is shown, so they learn where the page lives; otherwise it just opens.
   */
  private async reachPage(
    step: TourStepConfig,
    index: number,
    token: number,
    showClicks: boolean,
  ): Promise<"reached" | "unreachable" | "cancelled"> {
    const { via } = step;
    const isActive = () => token === this.stepToken && !!this.currentTour && !!this.driverObj;

    if (!via && this.unreachableRoutes.has(step.route)) return "unreachable";

    if (showClicks && via) {
      const viaNeedsNavigation = !routeMatches(currentLocation(), via.fromRoute);
      if (viaNeedsNavigation) {
        // The page it's opened from couldn't be opened either.
        if (this.unreachableRoutes.has(via.fromRoute) && !via.openAnyway) {
          this.unreachableRoutes.add(step.route);
          return "unreachable";
        }
        if (!(await this.walkSidebarTo(via.fromRoute, index, token))) return "cancelled";
        const fromRoute = await this.resolveRoute(via.fromRoute, false);
        if (!isActive()) return "cancelled";
        if (!fromRoute && via.openAnyway && !step.route.includes(":")) {
          // No record to come from, but the page is in the sidebar too.
          return this.reachPage({ ...step, via: undefined }, index, token, showClicks);
        }
        if (!fromRoute) {
          this.unreachableRoutes.add(step.route);
          return "unreachable";
        }
        if (!routeMatches(currentLocation(), via.fromRoute)) {
          this.navigate?.(fromRoute);
          await this.waitForRoute(via.fromRoute);
          if (!isActive()) return "cancelled";
        }
        this.rememberRoute(via.fromRoute);
      }

      const timeoutMs = viaNeedsNavigation ? PAGE_TIMEOUT_MS : undefined;
      let result = await this.openPanelsUpTo(via.panels ?? [], index, token, true, timeoutMs);
      if (result === "clicked") {
        result = await this.showClickHint(via, index, token, timeoutMs);
      }
      if (result === "cancelled") return "cancelled";
      // Nothing to click yet (no records, not approved yet...), so this page
      // can't be opened.
      if (result === "missing" && !via.openAnyway) {
        this.unreachableRoutes.add(step.route);
        return "unreachable";
      }
      this.setWaiting(true);
      if (result === "clicked") await this.waitForRoute(step.route);
      if (!isActive()) return "cancelled";
      // Whatever the control was inside of belongs to the page just left.
      this.closePanelsFrom(0);
    } else if (showClicks) {
      if (!(await this.walkSidebarTo(step.route, index, token))) return "cancelled";
    }

    const targetRoute = await this.resolveRoute(step.route, !!via && !via.openAnyway);
    if (!isActive()) return "cancelled";
    if (!targetRoute) {
      this.unreachableRoutes.add(step.route);
      return "unreachable";
    }

    if (!routeMatches(currentLocation(), step.route)) {
      this.navigate?.(targetRoute);
      await this.waitForRoute(step.route);
      if (!isActive()) return "cancelled";
    }
    return "reached";
  }

  /**
   * Highlights the whole page before the tour goes through its sections, once
   * per page. False when there is nothing to introduce.
   */
  private async showPageIntro(
    step: TourStepConfig,
    index: number,
    token: number,
    replay: boolean,
  ): Promise<boolean> {
    const route = pageRoute(step.route);
    const intro = step.route ? PAGE_INTROS[route] : undefined;
    if (!intro) return false;
    if (!replay) {
      if (this.introducedPages.has(route)) return false;
      if (coversPage(step)) {
        this.introducedPages.add(route);
        return false;
      }
    }

    // Let the page load, so the highlight fits it.
    await this.waitForElement(
      step.panels?.[0]?.open.element ?? step.element,
      token,
      PAGE_INTRO_WAIT_MS,
    );
    if (token !== this.stepToken || !this.currentTour || !this.driverObj) return true;
    const page = findVisible(PAGE_CONTENT);
    if (!page) return false;
    this.introducedPages.add(route);
    this.pageIntroSteps.add(index);
    scrollPageToTop(page);
    this.showPopover({
      element: page,
      isPage: true,
      title: intro.title,
      description: intro.description,
      speechText: intro.description,
      index,
      slot: INTRO_SLOT,
      nextBtnText: "Next →",
      locked: true,
      onNext: () => void this.goToStep(index, "forward"),
      onPrev: () => {
        // Coming forward again introduces the page again.
        this.introducedPages.delete(route);
        void this.goToStep(Math.max(0, index - 1), "backward");
      },
    });
    return true;
  }

  public async goToStep(index: number, direction: Direction = "forward", replayIntro = false) {
    if (!this.currentTour || !this.driverObj) return;
    const token = ++this.stepToken;
    this.clearPendingHint();
    const step = this.currentTour.steps[index];
    if (!step) {
      this.completeTour();
      return;
    }

    useTourStore.getState().setCurrentStepIndex(index);
    this.setWaiting(true);

    const isActive = () => token === this.stepToken && !!this.currentTour && !!this.driverObj;
    const showClicks = direction === "forward" && window.innerWidth >= DESKTOP_TOUR_WIDTH;
    const needsNavigation = !routeMatches(currentLocation(), step.route);

    this.direction = direction;
    this.stepSlots = planStep(
      step,
      { route: currentLocation(), panels: this.openPanels, introducedPages: this.introducedPages },
      showClicks,
    );

    // The control that leads to the page may itself be inside a panel.
    const viaPanels =
      showClicks && step.via && routeMatches(currentLocation(), step.via.fromRoute)
        ? step.via.panels
        : undefined;
    const sharedPanels = this.countSharedPanels(
      replayIntro ? [] : ((needsNavigation ? viaPanels : step.panels) ?? []),
    );
    if (this.closePanelsFrom(sharedPanels)) {
      await delay(PANEL_SETTLE_MS);
      if (!isActive()) return;
    }

    if (needsNavigation) {
      const result = await this.reachPage(step, index, token, showClicks);
      if (result === "cancelled") return;
      if (result === "unreachable") {
        this.presentMissing(step, index);
        return;
      }
    }
    this.rememberRoute(step.route);

    if (direction === "forward" || replayIntro) {
      if (await this.showPageIntro(step, index, token, replayIntro)) return;
      if (!isActive()) return;
    }

    const timeoutMs = needsNavigation ? PAGE_TIMEOUT_MS : ELEMENT_TIMEOUT_MS;
    const panelResult = await this.openPanelsUpTo(
      step.panels ?? [],
      index,
      token,
      showClicks,
      timeoutMs,
    );
    if (panelResult === "cancelled" || !isActive()) return;
    if (panelResult === "missing") {
      this.presentMissing(step, index);
      return;
    }

    this.setWaiting(true);
    if (step.element === PAGE_CONTENT) {
      await this.waitForIdle(token);
      if (!isActive()) return;
    }
    const element = await this.waitForElement(step.element, token, timeoutMs);
    if (!isActive()) return;
    if (element && step.element === PAGE_CONTENT) scrollPageToTop(element);

    if (!element) {
      this.presentMissing(step, index);
      return;
    }
    this.presentStep(step, index, element);
  }

  /**
   * Highlights a control and waits until it is clicked, either by the user or
   * by the Next button.
   */
  private async showClickHint(
    hint: TourClickConfig,
    index: number,
    token: number,
    timeoutMs = ELEMENT_TIMEOUT_MS,
  ): Promise<HintResult> {
    this.setWaiting(true);
    const element = await this.waitForElement(hint.element, token, timeoutMs);
    if (token !== this.stepToken || !this.currentTour || !this.driverObj) return "cancelled";
    if (!element) return "missing";

    const isSidebar = Boolean(
      element.closest('[data-tour="sidebar-nav"], [data-tour="sidepanel"]'),
    );
    const eventName = isMenuTrigger(element) ? "pointerdown" : "click";

    return new Promise<HintResult>((resolve) => {
      let isClicked = false;
      // Listens on the document: the control may be re-rendered meanwhile.
      const onClick = (event: Event) => {
        if (!(event.target instanceof Element) || !event.target.closest(hint.element)) return;
        isClicked = true;
        document.removeEventListener(eventName, onClick, true);
        this.cancelPendingHint = null;
        this.setWaiting(true);
        // Let the app's own click handler run (and navigate) before moving on.
        window.setTimeout(() => resolve(token === this.stepToken ? "clicked" : "cancelled"), 0);
      };
      document.addEventListener(eventName, onClick, true);
      this.cancelPendingHint = () => {
        document.removeEventListener(eventName, onClick, true);
        resolve("cancelled");
      };

      this.showPopover({
        element,
        title: hint.title,
        description: hint.description,
        speechText: hint.speechText || hint.title,
        side: isSidebar ? "right" : "bottom",
        align: "start",
        index,
        slot: hint.element,
        nextBtnText: "Next →",
        locked: false,
        onNext: () => {
          // A second Next while the page changes must not click it again.
          if (isClicked) return;
          const target = element.isConnected ? element : findVisible(hint.element);
          if (target) activate(target);
        },
        onPrev: () => void this.goToStep(Math.max(0, index - 1), "backward"),
      });
    });
  }

  /** Back from a page's first section leads to the page's intro. */
  private goBackFrom(index: number) {
    if (this.pageIntroSteps.has(index)) {
      void this.goToStep(index, "backward", true);
      return;
    }
    void this.goToStep(Math.max(0, index - 1), "backward");
  }

  private presentStep(step: TourStepConfig, index: number, element: HTMLElement | null) {
    if (!this.currentTour) return;
    const isLast = index === this.currentTour.steps.length - 1;
    const parentName = this.resumeContext
      ? TOURS_REGISTRY[this.resumeContext.tourId].name
      : null;
    const returnsToParent = isLast && parentName !== null;

    this.showPopover({
      element,
      title: step.title,
      description: returnsToParent
        ? `${step.description}<br><br>You've finished the <b>${this.currentTour.name}</b>. Press Continue to return to the ${parentName}.`
        : step.description,
      speechText: returnsToParent
        ? `${step.speechText || step.description} You've finished the ${this.currentTour.name}. Press continue to return to the main walkthrough.`
        : step.speechText || step.description,
      side: step.side,
      align: step.align,
      index,
      slot: MAIN_SLOT,
      isPage: step.element === PAGE_CONTENT && element !== null,
      nextBtnText: returnsToParent
        ? "Continue Walkthrough →"
        : isLast
          ? "Finish Tour ✓"
          : "Next →",
      branch: step.branch,
      locked: step.locked ?? true,
      onNext: () => void this.goToStep(index + 1, "forward"),
      canGoBack: this.pageIntroSteps.has(index),
      onPrev: () => this.goBackFrom(index),
    });
  }

  private startBranch(branch: TourStepBranchConfig, index: number) {
    if (!this.currentTour) return;
    const resumeIndex = this.currentTour.steps.findIndex((s) => s.id === branch.resumeStepId);
    const resume: ResumeTourContext = {
      tourId: this.currentTour.id,
      stepIndex: resumeIndex === -1 ? index + 1 : resumeIndex,
      shownCount: this.shownCount,
    };
    this.cleanupSpeechSubscription();
    tourSpeech.stop();
    void this.startTour(TOURS_REGISTRY[branch.tourId], 0, resume);
  }

  private renderBranch(
    wrapper: HTMLElement,
    footer: HTMLElement | undefined,
    branch: TourStepBranchConfig | undefined,
    index: number,
  ) {
    wrapper.querySelector(".tour-branch-container")?.remove();
    // Guides branch out of the main walkthrough only, so there's one way back.
    if (!branch || this.resumeContext) return;

    const box = document.createElement("div");
    box.className = "tour-branch-container";

    const prompt = document.createElement("div");
    prompt.className = "tour-branch-prompt";
    prompt.textContent =
      branch.description || "Want a closer look? Take the detailed guide, then come back here.";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tour-branch-btn";
    btn.textContent = `${branch.label} →`;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startBranch(branch, index);
    };

    box.append(prompt, btn);
    if (footer && footer.parentNode === wrapper) {
      wrapper.insertBefore(box, footer);
    } else {
      wrapper.appendChild(box);
    }
  }

  private renderSpeechBadge(wrapper: HTMLElement, title: HTMLElement, speech: string) {
    let badge = wrapper.querySelector<HTMLButtonElement>(".tour-speaker-status-badge");
    if (!badge) {
      badge = document.createElement("button");
      badge.type = "button";
      badge.className = "tour-speaker-status-badge";
      badge.setAttribute("aria-label", "Tour speech status");
      if (title.parentNode === wrapper) {
        wrapper.insertBefore(badge, title);
      } else {
        wrapper.prepend(badge);
      }
    }
    const button = badge;

    const updateBadge = (state: SpeechState) => {
      button.className = `tour-speaker-status-badge ${state}`;
      if (state === "speaking") {
        button.innerHTML = `<span class="tour-pulse-dot"></span><span>🔊 Voice: Speaking...</span>`;
        button.title = "Audio guide is playing (Click to mute)";
      } else if (state === "finished") {
        button.innerHTML = `<span>✓ Voice: Finished</span>`;
        button.title = "Audio guide completed (Click to replay)";
      } else if (state === "muted") {
        button.innerHTML = `<span>🔇 Voice: Muted</span>`;
        button.title = "Audio is muted (Click to unmute and play)";
      } else {
        button.innerHTML = `<span>🔈 Voice: Ready</span>`;
        button.title = "Click to play audio guidance";
      }
    };

    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      tourSpeech.prime();
      if (tourSpeech.getState() === "finished" && !useTourStore.getState().isAudioMuted) {
        tourSpeech.speak(speech, false);
        return;
      }
      useTourStore.getState().toggleAudioMute();
    };

    this.currentSpeechUnsub = tourSpeech.onStateChange(updateBadge);
  }

  /**
   * Numbers the popover about to be shown. Every popover counts, including the
   * clicks and page intros on the way to a step, so each Next moves it by one.
   * The total adjusts when a click turns out not to be needed.
   */
  private countPopover(index: number, slot: TourSlot): string {
    const key = `${index}:${slot}`;
    this.shownCount =
      this.direction === "forward"
        ? this.shownCount + 1
        : (this.shownNumbers.get(key) ?? Math.max(1, this.shownCount - 1));
    this.shownNumbers.set(key, this.shownCount);

    const position = this.stepSlots.lastIndexOf(slot);
    const leftInStep = position === -1 ? 1 : this.stepSlots.length - 1 - position;
    const leftAfterStep = countPopoversAfter(
      this.currentTour?.steps ?? [],
      index,
      this.introducedPages,
      window.innerWidth >= DESKTOP_TOUR_WIDTH,
    );
    return `${this.shownCount} of ${this.shownCount + leftInStep + leftAfterStep}`;
  }

  private showPopover(config: PopoverConfig) {
    if (!this.currentTour || !this.driverObj) return;
    const { element, index, speechText } = config;
    this.setWaiting(false);

    if (!config.isPage) element?.scrollIntoView({ behavior: "smooth", block: "center" });

    const progressText = this.countPopover(index, config.slot);
    this.currentSpeechText = speechText;

    this.driverObj.highlight({
      ...(element ? { element } : {}),
      disableActiveInteraction: config.locked,
      popover: {
        title: config.title,
        description: config.description,
        side: config.side || "bottom",
        align: config.align || "start",
        showButtons: ["next", "previous", "close"],
        disableButtons: index === 0 && !config.canGoBack ? ["previous"] : [],
        showProgress: true,
        progressText,
        nextBtnText: config.nextBtnText,
        prevBtnText: "← Back",
        onPopoverRender: ({ wrapper, title, footer }) => {
          this.cleanupSpeechSubscription();
          // A press on the popover is "outside" of any open dialog or menu,
          // which would otherwise close it.
          wrapper.onpointerdown = (e) => e.stopPropagation();
          wrapper.onmousedown = (e) => e.stopPropagation();
          this.renderBranch(wrapper, footer, config.branch, index);
          this.renderSpeechBadge(wrapper, title, speechText);
        },
        onNextClick: () => {
          this.cleanupSpeechSubscription();
          tourSpeech.stop();
          config.onNext();
        },
        onPrevClick: () => {
          this.cleanupSpeechSubscription();
          tourSpeech.stop();
          config.onPrev();
        },
        onCloseClick: () => {
          this.cleanupSpeechSubscription();
          this.stopTour();
        },
      },
    });

    tourSpeech.speak(speechText, useTourStore.getState().isAudioMuted);
  }

  public completeTour() {
    const finishedTour = this.currentTour;
    if (finishedTour) {
      useTourStore.getState().markTourCompleted(finishedTour.id);
    }

    if (this.resumeContext) {
      const { tourId, stepIndex, shownCount } = this.resumeContext;
      const parentTour = TOURS_REGISTRY[tourId];
      notify(`${finishedTour?.name || "Guide"} complete! Resuming ${parentTour.name}...`);
      void this.startTour(parentTour, stepIndex, null, shownCount);
      return;
    }

    this.stopTour();
  }

  public stopTour(clearResume = true) {
    this.cleanupSpeechSubscription();
    tourSpeech.stop();
    this.stepToken += 1;
    this.clearPendingHint();
    this.closePanelsFrom(0);
    this.setWaiting(false);
    this.currentSpeechText = "";
    this.currentTour = null;
    // A page that had nothing to show may have something the next time around.
    this.unreachableRoutes.clear();
    if (clearResume) {
      this.resumeContext = null;
      this.visitedPaths.clear();
      this.routeParams.clear();
    }
    const activeDriver = this.driverObj;
    this.driverObj = null;
    activeDriver?.destroy();
  }
}

export const tourCoordinator = new TourCoordinator();
