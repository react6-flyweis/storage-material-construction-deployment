import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import DashboardIcon from "../../assets/dashboardicon.svg";
import ProjectIcon from "../../assets/projecticon.svg";
import MaterialIcon from "../../assets/materialicon.svg";
import TaskIcon from "../../assets/taskicon.svg";
import CommunicationIcon from "../../assets/communicationicon.svg";
import NotificationIcon from "../../assets/notificationicon.svg";
import SidenavigationIcon from "../../assets/sidenavigation.svg";
import LeftArrowIcon from "../../assets/left-arrow.svg";
import RightArrowIcon from "../../assets/right-arrow.svg";

import DeliveryTrackingIcon from "../../assets/delivery-tracking.svg";
import { useSidebar } from "../../context/SidebarContext";
import { useAuthStore } from "../../store/authStore";
import { useChatUnreadCountQuery } from "@/modules/team-chat/team-chat.hooks";
import { useUnreadNotificationCountQuery } from "@/modules/notifications/notifications.hooks";

type SidebarSubTab = {
  label: string;
  path: string;
};

type SidebarTab = {
  key: string;
  icon: string;
  path: string;
  label: string;
  bg: string;
  subTabs?: SidebarSubTab[];
};

const SIDEBAR_TABS: SidebarTab[] = [
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
      { label: "Label Printing", path: "/delivery-tracking/label-printing" },
      { label: "Bundle Scan", path: "/delivery-tracking/bundle-scan" },
      { label: "Packing Lists", path: "/delivery-tracking/packing-lists" },
      {
        label: "Dispatch Verification",
        path: "/delivery-tracking/dispatch-verification",
      },
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

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isCollapsed?: boolean;
};

export default function Sidebar({ open, setOpen, isCollapsed = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeDate } = useSidebar();
  const { user } = useAuthStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { data: chatUnread } = useChatUnreadCountQuery();
  const { data: notificationUnread } = useUnreadNotificationCountQuery();

  const getTabBadge = (key: string) => {
    if (key === "communication") {
      const c = chatUnread?.total ?? chatUnread?.count ?? 0;
      return c > 0 ? (c > 99 ? "99+" : c) : null;
    }
    if (key === "notifications") {
      const n = notificationUnread ?? 0;
      return n > 0 ? (n > 99 ? "99+" : n) : null;
    }
    return null;
  };

  const activeTab =
    SIDEBAR_TABS.find((tab) => {
      if (tab.key === "materials") {
        return (
          location.pathname.startsWith(tab.path) ||
          location.pathname.startsWith("/material-view-page")
        );
      }

      if (tab.key === "projects") {
        return (
          location.pathname.startsWith(tab.path) ||
          location.pathname.startsWith("/project-view-page") ||
          location.pathname.startsWith("/drawing-attachment")
        );
      }

      return location.pathname.startsWith(tab.path);
    })?.key || "/";

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-svh 
          bg-[#E5ECFF] overflow-visible
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:static lg:translate-x-0"}
          flex shadow-xl shrink-0
          ${isCollapsed ? "w-[67px]" : "w-[280px] sm:w-[258px]"}
        `}
      >
        {/* Left Icon Strip */}
        <div className="w-[67px] h-full bg-[#1D51A4] pt-[130px] flex flex-col items-center py-6 relative shrink-0 overflow-visible">
          <button
            onClick={() => setOpen(false)}
            className="p-3 lg:hidden absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close Sidebar"
          >
            <div className="relative w-5 h-5">
              <span className="absolute top-1/2 left-0 w-5 h-[2px] bg-white rotate-45"></span>
              <span className="absolute top-1/2 left-0 w-5 h-[2px] bg-white -rotate-45"></span>
            </div>
          </button>
          <div className="flex flex-col items-center w-full overflow-visible">
            {SIDEBAR_TABS.map((tab, index) => {
              const isActive = activeTab === tab.key;
              const isHovered = hoveredIndex === index;
              const badge = getTabBadge(tab.key);

              return (
                <div
                  key={tab.key}
                  className="relative w-full h-[70px] flex items-center justify-center overflow-visible"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <button
                    onClick={() => {
                      if (window.innerWidth < 1024) setOpen(false);
                      navigate(tab.path);
                    }}
                    className="relative z-20 flex items-center justify-center w-full h-full focus:outline-none"
                  >
                    {isActive && (
                      <img src={SidenavigationIcon} alt="" className="absolute right-0" />
                    )}

                    <div className="relative flex items-center justify-center">
                      <img
                        src={tab.icon}
                        alt={tab.label}
                        className={`transition-transform hover:scale-105 ${isActive ? "relative z-10" : ""
                          }`}
                      />
                      {badge && (
                        <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1D51A4] shadow-sm leading-none z-20 pointer-events-none select-none">
                          {badge}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Tooltip Popover */}
                  <div
                    className="pointer-events-none absolute z-[100]"
                    style={{
                      top: "50%",
                      right: "8px",
                      transform: isHovered
                        ? "translateY(-50%) translateX(calc(100% - 46px))"
                        : "translateY(-50%) translateX(calc(100% - 52px))",
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                    }}
                  >
                    {/* White pill card */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        whiteSpace: "nowrap",
                        backgroundColor: "#ffffff",
                        borderRadius: "999px",
                        padding: "5px 20px 5px 5px",
                        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                      }}
                    >
                      {/* Colored icon circle */}
                      <span
                        className="flex items-center justify-center rounded-full"
                        style={{ width: 38, height: 38, flexShrink: 0, backgroundColor: tab.bg }}
                      >
                        <img
                          src={tab.icon}
                          alt={tab.label}
                          style={{ width: 26, height: 26, objectFit: "contain" }}
                        />
                      </span>
                      {/* Page name */}
                      <span
                        style={{
                          color: "#1a1a2e",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          letterSpacing: "0.01em",
                        }}
                      >
                        {tab.label}
                      </span>
                      {badge && (
                        <span className="ml-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                          {badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Subtabs and Info */}
        <div
          className={`flex-1 transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0 invisible" : "w-auto opacity-100 visible"
            }`}
        >
          <div className="pl-5 py-[14px] min-w-[191px]">
            <div className="mb-4 pr-2">
              <h1 className="text-[17px] font-bold text-[#1D51A4]">
                Construction Panel
              </h1>
              <p className="text-[14px] text-[#272C42]">{user?.email || "const@steelpro.com"}</p>
            </div>

            <div className="flex gap-2 items-center mb-6">
              <div className="bg-[#D8DEEA] h-8 flex justify-center cursor-pointer items-center text-[16px] font-medium capitalize text-[#272C42] px-5 py-2 min-w-[100px]">
                {activeDate}
              </div>

              <div className="w-[60px] flex gap-2 items-center">
                <div className="flex-1 flex items-center justify-center cursor-pointer">
                  <img src={LeftArrowIcon} alt="" />
                </div>
                <div className="flex-1 flex items-center justify-center cursor-pointer">
                  <img src={RightArrowIcon} alt="" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 pr-4">
              {SIDEBAR_TABS.map((tab) => {
                const isTabActive = activeTab === tab.key;
                if (!isTabActive) return null;

                return (
                  <div key={tab.key} className="flex flex-col gap-2 mt-4">
                    {tab.subTabs ? (
                      tab.subTabs.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <button
                            key={sub.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) setOpen(false);
                              navigate(sub.path);
                            }}
                            style={
                              isSubActive
                                ? {
                                  backgroundColor: tab.bg,
                                  color: "#ffffff",
                                  borderColor: tab.bg,
                                }
                                : {
                                  backgroundColor: "#ffffff",
                                  color: "#1a1a1a",
                                  borderColor: "transparent",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                }
                            }
                            className="h-[44px] w-full px-4 rounded-xl text-sm font-bold transition-all flex items-center border-2"
                          >
                            {sub.label}
                          </button>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => {
                          if (window.innerWidth < 1024) setOpen(false);
                          navigate(tab.path);
                        }}
                        style={{
                          backgroundColor: tab.bg,
                          color: "#ffffff",
                          borderColor: tab.bg,
                        }}
                        className="h-[44px] w-full px-4 rounded-xl shadow-sm text-sm font-bold flex items-center border-2"
                      >
                        {tab.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
