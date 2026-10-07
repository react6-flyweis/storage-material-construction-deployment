export interface CustomerId {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export interface Project {
  _id: string;
  customerId: CustomerId | null;
  buildingType: string;
  location: string;
  lifecycleStatus: string;
  jobId: string;
  projectName: string;
  priority?: string;
  endDate: string | null;
  plannedStartDate?: string | null;
  createdAt?: string;
  leadId?: string;
}

export interface ProjectsResponseData {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  scope?: string;
  stages?: string[];
}

export interface ProjectsApiResponse {
  success: boolean;
  message: string;
  data: ProjectsResponseData;
}

export interface Delivery {
  _id: string;
  deliveryNumber: string;
  status: string;
  description: string;
  deliveryDate: string;
  materialType?: string;
  loadWeight?: number;
  vendor?: string;
  carrier?: string;
  pocName?: string;
  pocPhone?: string;
  pocEmail?: string;
}

export interface Task {
  _id: string;
  title: string;
  assignedTo: string | { name?: string; email?: string } | null;
  priority: string;
  status: string;
  dueDate: string;
}

export interface ProjectDetails {
  project: Project & {
    numberOfBuildings?: number;
    priority?: string;
    description?: string;
  };
  deliveries: Delivery[];
  tasks: Task[];
}

export interface ProjectDetailsApiResponse {
  success: boolean;
  message: string;
  data: ProjectDetails;
}
export interface CalendarDeliveryProject {
  leadId: string;
  projectName: string;
  jobId: string;
  location: string;
}

export interface CalendarDelivery {
  deliveryId: string;
  deliveryNumber: string;
  status: string;
  description: string;
  project: CalendarDeliveryProject;
}

export interface CalendarResponseData {
  month: number;
  year: number;
  calendar: Record<string, CalendarDelivery[]>;
  totalDeliveries: number;
}

export interface CalendarApiResponse {
  success: boolean;
  message: string;
  data: CalendarResponseData;
}

export interface DrawingDocument {
  _id: string;
  url: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DrawingProject {
  leadId: string;
  projectId: string;
  projectName: string;
  location: string;
  uploadedBy: string;
  lastUpdate: string;
  documents: DrawingDocument[];
}

export interface DrawingsResponseData {
  projects: DrawingProject[];
  total: number;
}

export interface DrawingsApiResponse {
  success: boolean;
  message: string;
  data: DrawingsResponseData;
}

export interface PresignedUrlPayload {
  fileName: string;
  fileType: string;
  folder: string;
}

export interface PresignedUrlResponseData {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface PresignedUrlApiResponse {
  success: boolean;
  message?: string;
  data: PresignedUrlResponseData;
}

export interface MediaDocument {
  _id: string;
  url: string;
  name: string;
  type: "photo" | "video" | string;
  uploadedBy?: string;
  uploadedAt?: string;
  approvalStatus?: string;
  size?: string;
}

export interface AttachMediaPayload {
  url: string;
  name: string;
  type: "photo" | "video";
}

export interface AttachMediaApiResponse {
  success: boolean;
  message: string;
  data: {
    document: MediaDocument;
  };
}

export interface ConstructionMediaQueryParams {
  type?: "photo" | "video";
  leadId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConstructionMediaProject {
  leadId: string;
  projectId: string;
  projectName: string;
  location?: string | Record<string, unknown> | null;
  lastUpdate?: string;
  documents?: MediaDocument[];
  photos?: MediaDocument[];
  videos?: MediaDocument[];
  photoCount?: number;
  videoCount?: number;
}

export interface ConstructionMediaApiResponse {
  success: boolean;
  message?: string;
  data: {
    projects: ConstructionMediaProject[];
    total: number;
  };
}

export interface AssignedToUser {
  _id: string;
  name: string;
  email: string;
}

export interface CreatedByUser {
  _id: string;
  name: string;
  email: string;
}

export interface LeadProjectInfo {
  _id: string;
  jobId: string;
  projectName: string;
}

export interface ConstructionTask {
  _id: string;
  title: string;
  description: string;
  leadId: LeadProjectInfo | null;
  assignedTo: AssignedToUser | null;
  createdBy: CreatedByUser | null;
  priority: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface TasksResponseData {
  tasks: ConstructionTask[];
  total: number;
  stats: TasksStats;
}

export interface TasksApiResponse {
  success: boolean;
  message: string;
  data: TasksResponseData;
}

export interface DeliverySchedule {
  pickupDate: string | null;
  pickupTime: string;
  deliveryDate: string | null;
  deliveryTime: string;
  timings: string;
}

export interface DeliveryCarrier {
  phone?: string;
  email?: string;
  truckNumber?: string;
  driverName?: string;
  driverPhone?: string;
}

export interface DeliveryProject {
  leadId?: string;
  projectName?: string;
  jobId?: string;
  location?: string;
}

export interface DeliverySiteContact {
  contactName?: string;
  contactTitle?: string;
  phone?: string;
  email?: string;
  availableHours?: string;
  notes?: string;
}

export interface DeliveryStatusHistoryItem {
  _id?: string;
  status: string;
  changedAt: string;
  changedBy?: string | null;
  description?: string;
}

export interface ConstructionDelivery {
  deliveryId: string;
  deliveryNumber: string;
  status: string;
  statusHistory?: DeliveryStatusHistoryItem[];
  description: string;
  materialType: string;
  loadWeight: number;
  packageCount: number | null;
  loadingEquipment: string[];
  schedule: DeliverySchedule;
  pickupLocation: string;
  deliveryLocation: string;
  stagingArea: string;
  notes: string;
  receivingPoc: string;
  pickupContactPhone: string;
  siteContact?: DeliverySiteContact | null;
  carrier: DeliveryCarrier | null;
  project?: DeliveryProject | null;
}

export interface DeliveriesStats {
  inTransit: number;
  staged: number;
  ready: number;
  totalToday: number;
}

export interface DeliveriesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "Latest" | "Oldest" | "Weight" | "DeliveryDate" | string;
  search?: string;
  status?: string;
  deliveryStatus?: string;
  leadId?: string;
  projectId?: string;
  materialType?: string;
  siteDestination?: string;
  transporter?: string;
  driver?: string;
  startDate?: string;
  endDate?: string;
}

export interface DeliveryFiltersData {
  deliveryStatuses?: string[];
  siteDestinations?: string[];
  transporters?: string[];
  drivers?: string[];
  materialTypes?: string[];
  sortBy?: string[];
  relatedEnums?: {
    labelSortBy?: string[];
    labelStatus?: string[];
    bundleStatus?: string[];
    bundleScanSortBy?: string[];
    bundleScanStatus?: string[];
    packingListSortBy?: string[];
    packingListStatus?: string[];
    dispatchSortBy?: string[];
    dispatchStatus?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DeliveryFiltersApiResponse {
  success: boolean;
  message: string;
  data: DeliveryFiltersData;
}

export interface DeliveriesResponseData {
  deliveries: ConstructionDelivery[];
  total: number;
  stats: DeliveriesStats;
  page?: number;
  limit?: number;
  enums?: {
    sortBy?: string[];
    deliveryStatuses?: string[];
    [key: string]: unknown;
  };
}

export interface DeliveriesApiResponse {
  success: boolean;
  message: string;
  data: DeliveriesResponseData;
}

export interface BundleProject {
  leadId: string;
  projectName: string;
  jobId: string;
}

export interface BundleLabel {
  bundleId: string;
  bundleNo: string;
  bundleType: string;
  title: string;
  parts: string;
  totalWeight: number;
  maxLengthFeet: number;
  status: string;
  labelPrinted?: boolean;
  packingListId: string;
  loadId?: string;
  loadLabel?: string;
  project: BundleProject;
}

export interface LabelStats {
  totalBundles: number;
  labelsPrinted: number;
  labelsPending: number;
  labelsPrintedToday: number;
}

export interface LabelsResponseData {
  bundles: BundleLabel[];
  total: number;
  stats: LabelStats;
  page?: number;
  limit?: number;
  enums?: {
    sortBy?: string[];
    labelStatus?: string[];
    bundleStatus?: string[];
  };
}

export interface LabelsApiResponse {
  success: boolean;
  message: string;
  data: LabelsResponseData;
}

export interface LabelsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "Latest" | "Oldest" | "Weight" | "BundleNo" | string;
  status?: string;
}

export interface ScannedBundleProject {
  leadId: string;
  projectName: string;
  jobId: string;
}

export interface ScannedBundle {
  bundleId: string;
  bundleNo: string;
  parts: string;
  totalWeight: number;
  status: string;
  scannedAt: string;
  project: ScannedBundleProject;
}

export interface BundleScanStats {
  bundlesScanned: number;
  bundlesRemaining: number;
  bundlesLoaded: number;
}

export interface BundleScanResponseData {
  bundles: ScannedBundle[];
  total: number;
  stats: BundleScanStats;
  page?: number;
  limit?: number;
  enums?: {
    sortBy?: string[];
    status?: string[];
  };
}

export interface BundleScanApiResponse {
  success: boolean;
  message: string;
  data: BundleScanResponseData;
}

export interface BundleScanQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "Latest" | "Oldest" | "Weight" | string;
  status?: "pending" | "staged" | "on_truck" | "loaded" | "all" | string;
}

export interface PackingListProject {
  leadId: string;
  projectName: string;
  jobId: string;
}

export interface PackingListItem {
  packingListId: string;
  packingListNo: string;
  truck: string;
  totalBundles: number;
  totalWeight: number;
  destination: string;
  status: string;
  project: PackingListProject;
}

export interface PackingListStats {
  totalPackingList: number;
  loadsReadyForDispatch: number;
  bundlesAssigned: number;
  loadsDispatchedToday: number;
}

export interface PackingListBundleItem {
  vendorQuoteLineId?: string;
  partCode?: string;
  description?: string;
  category?: string;
  color?: string;
  qty?: number;
  lengthFeet?: number | null;
  widthFeet?: number | null;
  heightFeet?: number | null;
  weight?: number | null;
  unitWeight?: number | null;
  totalWeight?: number | null;
  weightBasis?: string;
  weightSource?: string;
  markIds?: string[];
  sourceLineSnapshot?: Record<string, unknown>;
  _id?: string;
}

export interface PackingListBundle {
  _id: string;
  bundleNo?: string;
  bundleType?: string;
  items?: PackingListBundleItem[];
  totalWeight?: number;
  status?: string;
}

export interface PackingListDetail {
  packingListId: string;
  packingListNo: string;
  truck?: string;
  totalBundles?: number;
  totalWeight?: number;
  maxLengthFeet?: number;
  destination?: string;
  status?: string;
  bundles?: PackingListBundle[];
  project?: {
    leadId?: string;
    projectName?: string;
    jobId?: string;
  };
}

export interface PackingListDetailApiResponse {
  success: boolean;
  message: string;
  data: {
    packingList: PackingListDetail;
  };
}

export interface PackingListResponseData {
  packingLists: PackingListItem[];
  total: number;
  stats: PackingListStats;
  page?: number;
  limit?: number;
  enums?: {
    sortBy?: string[];
    status?: string[];
  };
}

export interface PackingListApiResponse {
  success: boolean;
  message: string;
  data: PackingListResponseData;
}

export interface PackingListsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "Latest" | "Oldest" | "Weight" | "PackingListNo" | string;
  status?: string;
  leadId?: string;
}

export interface DispatchLoadProject {
  leadId: string;
  projectName: string;
  jobId: string;
}

export interface DispatchLoad {
  loadId: string;
  _id?: string;
  packingListNo: string;
  truck: string;
  totalBundles: number;
  bundleIds: string[];
  totalWeight: number;
  destination: string;
  status: string;
  weightVerified?: boolean;
  loadingVerified?: boolean;
  project: DispatchLoadProject;
}

export interface DispatchVerificationStats {
  loadsReadyForDispatch: number;
  bundlesVerified: number;
  bundlesMissing: number;
  leadsDispatchedToday: number;
}

export interface DispatchVerificationResponseData {
  loads: DispatchLoad[];
  total: number;
  stats: DispatchVerificationStats;
  page?: number;
  limit?: number;
  enums?: {
    sortBy?: string[];
    status?: string[];
  };
}

export interface DispatchVerificationApiResponse {
  success: boolean;
  message: string;
  data: DispatchVerificationResponseData;
}

export interface DispatchVerificationBundle {
  bundleId: string;
  bundleNo: string;
  totalWeight: number;
  status: string;
  verified: boolean;
}

export interface DispatchVerificationDetail {
  loadId: string;
  _id?: string;
  packingListNo: string;
  truck: string;
  destination: string;
  status: string;
  plannedWeight: number;
  weightVerified: boolean;
  loadingVerified: boolean;
  bundles: DispatchVerificationBundle[];
  project: DispatchLoadProject;
}

export interface DispatchVerificationDetailApiResponse {
  success: boolean;
  message: string;
  data: {
    load: DispatchVerificationDetail;
  };
}

export interface DispatchVerificationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "Latest" | "Oldest" | "Weight" | "PackingListNo" | string;
  status?: "pending" | "verified" | "dispatched" | "all" | string;
}

export interface DeliveryDetailsResponseData {
  delivery: ConstructionDelivery;
}

export interface DeliveryDetailsApiResponse {
  success: boolean;
  message: string;
  data: DeliveryDetailsResponseData;
}

export interface MaterialRequestProject {
  leadId: string;
  projectName: string;
  jobId: string;
  location: string;
}

export interface MaterialRequestUser {
  userId: string;
  name: string;
}

export interface RequestedItem {
  _id?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  deliveryStatus?: string;
}

export interface MaterialRequest {
  _id: string;
  requestId: string;
  project: MaterialRequestProject | null;
  siteLocation: string;
  department: string;
  requestedBy: MaterialRequestUser;
  requestedItems: RequestedItem[];
  itemCount: number;
  requestDate: string;
  requiredBy: string | null;
  priority: string;
  status: string;
  totalAmount: number;
  reviewNotes?: string;
  notes?: string;
  remarks?: string;
}

export interface MaterialRequestStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface MaterialRequestsResponseData {
  materialRequests: MaterialRequest[];
  total: number;
  stats: MaterialRequestStats;
}

export interface MaterialRequestsApiResponse {
  success: boolean;
  message: string;
  data: MaterialRequestsResponseData;
}

export interface MaterialRequestFilterProject {
  leadId: string;
  projectName: string;
  jobId: string;
}

export interface MaterialRequestsFiltersData {
  statuses: string[];
  priorities: string[];
  departments: string[];
  siteLocations: string[];
  projects: MaterialRequestFilterProject[];
}

export interface MaterialRequestsFiltersApiResponse {
  success: boolean;
  message: string;
  data: MaterialRequestsFiltersData;
}

export interface MaterialRequestsQueryParams {
  page?: number;
  limit?: number;
  leadId?: string;
  projectId?: string;
  department?: string;
  status?: string;
  requestedBy?: string;
  priority?: string;
  siteLocation?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  fromDate?: string;
  toDate?: string;
  project?: string;
  startDate?: string;
  endDate?: string;
}

export interface BundleItem {
  vendorQuoteLineId: string;
  partCode: string;
  description: string;
  category: string;
  color: string;
  qty: number;
  lengthFeet: number | null;
  widthFeet: number | null;
  heightFeet: number | null;
  weight: number | null;
  unitWeight: number | null;
  totalWeight: number | null;
  weightBasis: string;
  weightSource: string;
  markIds: string[];
  sourceLineSnapshot: Record<string, unknown>;
  _id: string;
}

export const MISMATCH_ITEM_STATUSES = {
  RECEIVED: "Received",
  PARTIALLY_RECEIVED: "Partially Received",
  NOT_RECEIVED: "Not Received",
} as const;

export type MismatchStatus = (typeof MISMATCH_ITEM_STATUSES)[keyof typeof MISMATCH_ITEM_STATUSES];

export interface BundleMismatchItem {
  itemId: string;
  partCode: string;
  description: string;
  qty: number;
  receivedQty: number;
  status: MismatchStatus | string;
}

export interface BundleDetailInfo {
  bundleId: string;
  bundleNo: string;
  bundleType: string;
  title: string;
  items: BundleItem[];
  totalQty: number;
  totalWeight: number;
  maxLengthFeet: number;
  status: string;
  labelPrinted: boolean;
  verified: boolean;
  mismatchNotes: string;
  mismatchItems?: BundleMismatchItem[];
  project: {
    leadId: string;
    projectName: string;
    jobId: string;
  };
  packingList: {
    _id: string;
    packingListNo: string;
    truckType: string;
    truckLabel: string;
  };
}

export interface BundleDetailsApiResponse {
  success: boolean;
  message: string;
  data: {
    bundle: BundleDetailInfo;
  };
}

export interface DashboardFilterProject {
  _id: string;
  projectName: string;
  jobId: string;
  lifecycleStatus: string;
  location: string;
}

export interface DashboardFilterBuilding {
  _id: string;
  leadId: string;
  buildingNumber: number;
  name: string;
  status: string;
}

export interface DashboardFiltersData {
  projects: DashboardFilterProject[];
  buildings: DashboardFilterBuilding[];
  statuses: string[];
}

export interface DashboardFiltersApiResponse {
  success: boolean;
  message: string;
  data: DashboardFiltersData;
}

export interface DashboardQueryParams {
  projectId?: string;
  leadId?: string;
  buildingId?: string;
  status?: string;
  lifecycleStatus?: string;
  fromDate?: string;
  dateFrom?: string;
  toDate?: string;
  dateTo?: string;
}

export interface DashboardFiltersApplied {
  projectId: string | null;
  buildingId: string | null;
  status: string | null;
  fromDate: string | null;
  toDate: string | null;
}

export interface DashboardProjectStats {
  total: number;
  onTrack: number;
  delayed: number;
  completed: number;
  onTrackPct?: number;
  delayedPct?: number;
  completedPct?: number;
  completionRate: number;
  upcomingDeadlines: number;
  totalChangePctVsYesterday?: number;
  completionRateLabel?: string;
}

export interface DashboardDeliveryOverview {
  scope?: string;
  fromDate?: string;
  toDate?: string;
  delivered: number;
  inTransit: number;
  outForDelivery: number;
  delayed: number;
  total: number;
  deliveredPct?: number;
  inTransitPct?: number;
  outForDeliveryPct?: number;
  delayedPct?: number;
}

export interface DashboardMaterialRequestOverview {
  pendingApproval: number;
  approved: number;
  rejected: number;
  urgent: number;
  total: number;
  approvedPct?: number;
  pendingApprovalPct?: number;
  rejectedPct?: number;
}

export interface DashboardTaskOverview {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface DashboardActiveSite {
  leadId: string;
  projectName: string;
  jobId: string;
  site: string;
  buildingType: string;
  numberOfBuildings: number;
  progressPct: number;
  deadline: string | null;
  deliveryStatus: string;
  lifecycleStatus: string;
}

export interface DashboardUpcomingDeadline {
  leadId: string;
  projectName: string;
  jobId: string;
  location?: string;
  site?: string;
  endDate: string;
  daysLeft: number;
}

export interface DashboardTimelineItem {
  key: string;
  label: string;
  date: string | null;
  status: string;
}

export interface DashboardFreightCarrierRow {
  carrierId: string;
  carrierName: string;
  loadsToday: number;
  onTime: number;
  delayed: number;
  priority: string;
}

export interface DashboardFreightCarriersTotals {
  totalLoadsToday: number;
  onTime: number;
  onTimePct: number;
  delayed: number;
  delayedPct: number;
}

export interface DashboardFreightCarriers {
  rows: DashboardFreightCarrierRow[];
  totals: DashboardFreightCarriersTotals;
}

export interface DashboardRecentActivityItem {
  type: string; // 'shipper_file' | 'audit' | 'production'
  action: string;
  message: string;
  occurredAt: string;
  leadId: string | null;
  actorName: string | null;
  refId: string;
}

export interface DashboardRecentDeliveryProject {
  leadId: string;
  projectName: string;
  jobId: string;
  location: string;
}

export interface DashboardRecentDelivery {
  deliveryId: string;
  deliveryNumber?: string;
  status: string;
  deliveryDate: string;
  project: DashboardRecentDeliveryProject;
}

export interface DashboardResponseData {
  filtersApplied?: DashboardFiltersApplied;
  projectStats: DashboardProjectStats;
  deliveryOverview: DashboardDeliveryOverview;
  materialRequestOverview?: DashboardMaterialRequestOverview;
  taskOverview?: DashboardTaskOverview;
  activeSites?: DashboardActiveSite[];
  upcomingDeadlines: DashboardUpcomingDeadline[];
  projectTimelineOverall?: DashboardTimelineItem[];
  freightCarriers?: DashboardFreightCarriers;
  recentActivity?: DashboardRecentActivityItem[];
  recentDeliveries?: DashboardRecentDelivery[];
}

export interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardResponseData;
}

export interface ConsolidatedBOMItem {
  _id: string;
  partCode: string | null;
  partColor: string | null;
  description: string;
  category: string;
  costUnit: string | null;
  totalQty: number;
  totalLengthFeet: number;
  totalWeight: number;
  totalCost: number;
  buildings: number[];
  markIds: string[];
}

export interface ConsolidatedBOM {
  _id: string;
  leadId: string;
  status: string;
  fileUrl?: string;
  totalCost: number;
  totalWeight: number;
  totalPanelsArea: number;
  itemCount: number;
  items: ConsolidatedBOMItem[];
  sentToVendors?: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface ConsolidatedBOMApiResponse {
  success: boolean;
  message: string;
  data: {
    consolidatedBOM: ConsolidatedBOM;
  };
}

export interface DrawingCommentItem {
  _id?: string;
  user?: string;
  comment?: string;
  createdAt?: string;
}

export interface BuildingDrawingFile {
  _id: string;
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  status: string;
  rejectionReason?: string;
  uploadedBy?: string;
  uploadedAt: string;
  reviewedAt?: string;
  comments?: DrawingCommentItem[];
}

export interface BuildingDrawingGroupData {
  buildingId: string;
  buildingNumber: number;
  drawings: BuildingDrawingFile[];
  latestDrawingStatus: string;
}

export interface BuildingDrawingsResponseData {
  buildings: BuildingDrawingGroupData[];
}

export interface BuildingDrawingsApiResponse {
  success: boolean;
  message: string;
  data: BuildingDrawingsResponseData;
}

export interface CreateDeliveryPayload {
  title?: string;
  leadId: string;
  sectionLocation?: string;
  deliveryDate: string;
  description?: string;
  notes?: string;
  attachments?: string[];
}

export interface CreatedDeliveryData {
  _id: string;
  deliveryNumber: string;
  status: string;
  leadId: string;
  loadDescription?: string;
  description?: string;
  deliveryLocation?: string;
  deliveryDate: string;
  additionalNotes?: string;
  attachments?: string[];
  statusHistory?: Array<{ status: string; changedAt: string }>;
}

export interface CreateDeliveryApiResponse {
  success: boolean;
  message: string;
  data: {
    delivery: CreatedDeliveryData;
  };
}

export interface WorkLogProject {
  _id: string;
  projectName?: string;
  jobId?: string;
}

export interface WorkLogTask {
  _id: string;
  title: string;
}

export interface WorkLogLoggedBy {
  _id: string;
  name?: string;
  email?: string;
}

export interface WorkLogItem {
  _id: string;
  leadId: WorkLogProject | string;
  taskId?: WorkLogTask | string | null;
  loggedBy?: WorkLogLoggedBy | string;
  date: string;
  progress?: number;
  description?: string;
  photos?: string[];
  issues?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkLogsResponseData {
  logs: WorkLogItem[];
  total: number;
}

export interface WorkLogsApiResponse {
  success: boolean;
  message: string;
  data: WorkLogsResponseData;
}

export interface GetWorkLogsParams {
  leadId?: string;
  page?: number;
  limit?: number;
}

