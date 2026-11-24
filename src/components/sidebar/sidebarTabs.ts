import DashboardIcon from "../../assets/dashboardicon.svg";
import ProjectIcon from "../../assets/projecticon.svg";
import MaterialIcon from "../../assets/materialicon.svg";
import TaskIcon from "../../assets/taskicon.svg";
import CommunicationIcon from "../../assets/communicationicon.svg";
import NotificationIcon from "../../assets/notificationicon.svg";
import DeliveryTrackingIcon from "../../assets/delivery-tracking.svg";

export type SidebarSubTab = {
  label: string;
  path: string;
};

export type SidebarTab = {
  key: string;
  icon: string;
  path: string;
  label: string;
  bg: string;
  subTabs?: SidebarSubTab[];
};

export const SIDEBAR_TABS: SidebarTab[] = [
  {
    key: "dashboard",
    icon: DashboardIcon,
    path: "/dashboard",
    label: "Dashboard",
    bg: "#FD8D5B",
  },
  {
    key: "projects",
    icon: ProjectIcon,
    path: "/projects",
    label: "Projects",
    bg: "#A855F7",
    subTabs: [
      { label: "Projects & Calendar", path: "/projects" },
      { label: "Drawing & Attachments", path: "/drawing-attachment" },
    ],
  },
  {
    key: "tasks",
    icon: TaskIcon,
    path: "/tasks",
    label: "Tasks & Progress",
    bg: "#FD8D5B",
    subTabs: [
      { label: "Task Board", path: "/tasks" },
      { label: "Daily Work Logs", path: "/work-logs" },
    ],
  },
  {
    key: "materials",
    icon: MaterialIcon,
    path: "/materials",
    label: "Material Requests",
    bg: "#3AB449",
  },
  {
    key: "delivery-tracking",
    icon: DeliveryTrackingIcon,
    path: "/delivery-tracking",
    label: "Delivery Tracking",
    bg: "#1D51A4",
    subTabs: [
      { label: "Delivery Tracking", path: "/delivery-tracking" },
      // { label: "Label Printing", path: "/delivery-tracking/label-printing" },
      {
        label: "Dispatch Verification",
        path: "/delivery-tracking/bundle-scan",
      },
      // { label: "Packing Lists", path: "/delivery-tracking/packing-lists" },
      // {
      //   label: "Dispatch Verification",
      //   path: "/delivery-tracking/dispatch-verification",
      // },
    ],
  },
  {
    key: "communication",
    icon: CommunicationIcon,
    path: "/communication",
    label: "Communication",
    bg: "#3AB449",
  },
  {
    key: "notifications",
    icon: NotificationIcon,
    path: "/notifications",
    label: "Notification",
    bg: "#000000",
  },
];
