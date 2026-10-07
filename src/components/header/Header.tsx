import { useLocation } from "react-router-dom";
import SearchIcon from "../../assets/searchIcon.svg";
import Logo from "../../assets/steel building depot logo file Final without BG.png";
import { useSearch } from "../../context/SearchContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NotificationButton from "./NotificationButton";
import UserMenu from "./UserMenu";

type Props = {
  count?: number;
  onToggleSidebar: () => void;
  isPanelCollapsed?: boolean;
  onPanelToggle?: () => void;
};

const hideSearchOnRoutes = ["/notifications", "/communication"];

export default function Header({
  count,
  onToggleSidebar,
  isPanelCollapsed,
  onPanelToggle,
}: Props) {
  const { search, setSearch } = useSearch();
  const location = useLocation();

  return (
    <header className="h-[81px] bg-white flex items-center justify-between lg:px-6 px-2 lg:pl-8 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <div className="space-y-[3px]">
            <span className="block w-5 h-[3px] bg-black"></span>
            <span className="block w-5 h-[3px] bg-black"></span>
            <span className="block w-5 h-[3px] bg-black"></span>
          </div>
        </button>

        {/* Panel collapse toggle — desktop only, left of search */}
        <button
          type="button"
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-[#F0F4FF] hover:bg-[#dde6ff] text-[#1D51A4] transition-colors shrink-0 cursor-pointer"
          onClick={onPanelToggle}
          title={isPanelCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isPanelCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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

      <div className="flex lg:gap-8 gap-3 items-center">
        <div className="flex items-center gap-4">
          {" "}
          <NotificationButton count={count} />
          <UserMenu />
        </div>
        <img
          src={Logo}
          alt="Steel Building Depot Logo"
          className="w-[100px] sm:w-[140px] lg:w-[170px] xl:w-[220px]"
        />
      </div>
    </header>
  );
}
