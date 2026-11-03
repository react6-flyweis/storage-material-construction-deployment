export interface ProjectSummary {
  id?: string;
  projectName: string;
  projectCode: string;
  status: string;
  buildingType: string;
  numberOfBuildings: number | string;
  createdOn: string;
  location: string;
  priority?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
}

export type DeliveryStatus =
  | "Scheduled"
  | "Confirmed"
  | "In Transit"
  | "Delivered"
  | "Completed"
  | string;

export interface MaterialDelivery {
  id: string;
  deliveryNumber: string;
  status: DeliveryStatus;
  date: string;
  time: string;
  item: string;
  materialType?: string;
  loadWeight?: number;
  vendor: string;
  carrier: string;
  pocName: string;
  pocPhone?: string;
  pocEmail?: string;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo?: string | null;
}

export interface ProjectConstructionTaskItem {
  id: string;
  _id?: string;
  stepKey?: string;
  title: string;
  startDate: string;
  estEndDate: string;
  estimatedEndDate?: string | null;
  dueDate?: string | null;
  completedDate?: string;
  completedAt?: string | null;
  status: "under_timeline" | "days_late" | "delayed" | "in_progress" | "completed" | "todo" | "done" | string;
  statusLabel?: string;
  statusBadgeColor?: "green" | "red" | "blue" | "amber";
  timelineBadge?: {
    label: string;
    tone: "success" | "danger" | "info" | "warning" | "default" | string;
  };
  timelineStatusLine?: string;
  onTimeStatus?: string;
  onTime?: boolean | null;
  daysLateOrEarly?: number;
  daysPastDue?: number;
  canMarkComplete?: boolean;
  description?: string;
  workDescription?: string;
  photos?: string[];
  attachments?: string[];
}

export interface ProjectPhoto {
  id: string;
  url?: string;
  imageUrl?: string;
  title?: string;
  caption?: string;
  date?: string;
  category?: string;
}

export interface ProjectDetailsPageData {
  summary: ProjectSummary;
  deliveries: MaterialDelivery[];
  tasks?: ProjectTaskItem[];
  photos?: ProjectPhoto[];
}
