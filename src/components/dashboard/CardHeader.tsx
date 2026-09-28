import React from "react";

export interface CardHeaderProps {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  onViewAll?: () => void;
  showViewAll?: boolean;
  viewAllText?: string;
  className?: string;
}

export default function CardHeader({
  title,
  badge,
  action,
  onViewAll,
  showViewAll = true,
  viewAllText = "View All",
  className = "",
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          {title}
        </h3>
        {badge}
      </div>
      <div>
        {action !== undefined ? (
          action
        ) : showViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded transition-colors shadow-none cursor-pointer"
          >
            {viewAllText}
          </button>
        ) : null}
      </div>
    </div>
  );
}
