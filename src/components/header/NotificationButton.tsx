import { useNavigate } from "react-router-dom";
import BellIcon from "../../assets/bellicon.svg";
import { useUnreadNotificationCountQuery } from "@/modules/notifications/notifications.hooks";

export interface NotificationButtonProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

export default function NotificationButton({
  count,
  onClick,
  className = "",
}: NotificationButtonProps) {
  const navigate = useNavigate();
  const { data: unreadNotifications } = useUnreadNotificationCountQuery();

  const totalCount =
    typeof count === "number" ? count : (unreadNotifications ?? 0);
  const displayCount = totalCount > 99 ? "99+" : totalCount;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/notifications");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Notifications"
      aria-label={`Notifications${totalCount > 0 ? ` (${totalCount} unread)` : ""}`}
      className={`relative inline-flex items-center justify-center cursor-pointer p-1 rounded-full hover:opacity-80 transition-opacity focus:outline-none ${className}`}
    >
      <span className="rounded-full border p-1">
        {" "}
        <img src={BellIcon} className=" w-5 min-w-5" alt="Bell icon" />
      </span>
      {totalCount > 0 && (
        <span
          className="absolute lg:-top-2 -top-1 lg:left-5 left-4 px-1 lg:min-w-5 lg:h-5 min-w-4 h-4 flex items-center justify-center text-white bg-red-500 rounded-full text-[10px] font-bold shadow-sm"
          data-testid="unread-badge"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}
