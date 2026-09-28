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
