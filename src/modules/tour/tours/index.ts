import type { TourDefinition, TourId } from "../tour.types";
import { constructionOverviewTour } from "./construction-overview.tour";
import { dispatchFlowTour } from "./dispatch-flow.tour";
import { projectDetailsTour } from "./project-details.tour";

export const TOURS_REGISTRY: Record<TourId, TourDefinition> = {
  "construction-overview": constructionOverviewTour,
  "project-details": projectDetailsTour,
  "dispatch-flow": dispatchFlowTour,
};
