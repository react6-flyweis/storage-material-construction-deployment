import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BellIcon from "../../assets/bellicon.svg";
import SearchIcon from "../../assets/searchIcon.svg";
import Logo from "../../assets/steel building depot logo file Final without BG.png";
import { useSearch } from "../../context/SearchContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { logoutApi } from "../../api/auth.api";
import { useUnreadNotificationCountQuery } from "@/modules/notifications/notifications.hooks";

type Props = {
  count?: number;
  onToggleSidebar: () => void;
  isPanelCollapsed?: boolean;
  onPanelToggle?: () => void;
};

const hideSearchOnRoutes = ["/notifications", "/communication"];

export default function Header({ count, onToggleSidebar, isPanelCollapsed, onPanelToggle }: Props) {
  const { data: unreadNotifications } = useUnreadNotificationCountQuery();
  const totalCount = typeof count === "number" ? count : (unreadNotifications ?? 0);
  const displayCount = totalCount > 99 ? "99+" : totalCount;
  const { search, setSearch } = useSearch();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      logout();
      navigate("/");
    }
  };

  return (
    <header className="h-[81px] bg-white flex items-center justify-between lg:px-6 px-2 lg:pl-8 shadow-sm">
      <div className="flex items-center gap-2">
        <button onClick={onToggleSidebar} className="p-2 lg:hidden">
          <div className="space-y-[3px]">
            <span className="block w-5 h-[3px] bg-black"></span>
            <span className="block w-5 h-[3px] bg-black"></span>
            <span className="block w-5 h-[3px] bg-black"></span>
          </div>
        </button>

        {/* Panel collapse toggle — desktop only, left of search */}
        <button
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-[#F0F4FF] hover:bg-[#dde6ff] text-[#1D51A4] transition-colors shrink-0"
          onClick={onPanelToggle}
          title={isPanelCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isPanelCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
        {!hideSearchOnRoutes.includes(location.pathname) && (
          <div className="flex flex-1 sm:flex-none gap-2 items-center px-2 border border-[#D1D5DB] rounded-[8px] h-[38px] max-w-[400px]">
            <img src={SearchIcon} alt="" className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[14px] outline-none w-full sm:w-[130px] lg:min-w-[256px]"
            />
          </div>
        )}
      </div>

      <div className="flex lg:gap-12 gap-3 items-center">
        <div
          className="relative cursor-pointer"
          onClick={() => navigate("/notifications")}
          title="Notifications"
        >
          <img src={BellIcon} className="lg:w-8 w-6 min-w-6" alt="" />
          {totalCount > 0 && (
            <span className="absolute lg:-top-2 -top-1 lg:left-5 left-4 px-1 lg:min-w-5 lg:h-5 min-w-4 h-4 flex items-center justify-center text-white bg-red-500 rounded-full text-[10px] font-bold">
              {displayCount}
            </span>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            className="text-gray-500 hover:text-gray-700 relative focus:outline-none bg-[#2563eb] rounded-full p-2"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-4 h-4 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 20.25a7.5 7.5 0 0 1 15 0"
              />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 pb-2 border-b border-gray-100">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  onClick={() => {
                    navigate("/profile");
                    setIsProfileOpen(false);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="black"
                    className="w-5 h-5 text-gray-200"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 20.25a7.5 7.5 0 0 1 15 0"
                    />
                  </svg>

                  <p className="text-[#000000]">My profile</p>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate("/settings");
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="black"
                    className="w-5 h-5 text-[#000]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                  <p className="text-[#3E4857]">Settings</p>
                </button>
              </div>
              <div className="px-2 pt-2">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left font-medium"
                  onClick={handleSignOut}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                    />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        <img
          src={Logo}
          alt=""
          className="w-[100px] sm:w-[140px] lg:w-[170px] xl:w-[220px]"
        />
      </div>
    </header>
  );
}
