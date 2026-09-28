import React from 'react';
import CardHeader from '../dashboard/CardHeader';

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  iconBg: string;
  icon: React.ReactNode;
}

interface RecentActivityProps {
  activities?: Activity[];
  onViewAll?: () => void;
  className?: string;
}

export default function RecentActivity({ activities = [], onViewAll, className = "" }: RecentActivityProps) {
  const displayActivities = activities.slice(0, 5);

  return (
    <div className={`bg-white rounded border border-gray-100 shadow-sm flex flex-col h-full ${className}`}>
      <CardHeader
        title="Recent Activity"
        action={
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 bg-white border border-blue-500 hover:bg-blue-50 px-3.5 py-1.5 rounded transition-colors shadow-none cursor-pointer"
          >
            View All
          </button>
        }
      />

      <div className="flex-1 flex flex-col">
        {displayActivities.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-sm font-medium text-gray-400">
            No recent activity available
          </div>
        ) : (
          <div className="divide-y divide-gray-100 flex-1 flex flex-col justify-between">
            {displayActivities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: activity.iconBg }}
                  >
                    {activity.icon}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activity.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
