import CardHeader from "../dashboard/CardHeader";
import { Check, ChevronDown } from "lucide-react";

export interface TimelineStep {
  title: string;
  date: string;
  status: 'completed' | 'inprogress' | 'upcoming';
}

interface TimelineProps {
  steps: TimelineStep[];
  onViewAll?: () => void;
  className?: string;
}

export default function Timeline({ steps, onViewAll, className = "" }: TimelineProps) {
  return (
    <div className={`bg-white rounded border border-gray-100 shadow-sm h-full flex flex-col ${className}`}>
      <CardHeader
        title="Project Timeline (Overall)"
        action={
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Full Timeline</span>
            <ChevronDown size={15} className="text-gray-500" />
          </button>
        }
      />

      <div className="p-6 space-y-3.5 flex-1 flex flex-col justify-between">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
          >
            {/* Left: Icon, Title & Date */}
            <div className="flex items-center gap-3">
              {step.status === 'completed' ? (
                <div className="w-5 h-5 rounded bg-green-600 border-2 border-orange-500 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3.5} className="text-white" />
                </div>
              ) : step.status === 'inprogress' ? (
                <div className="w-5 h-5 rounded bg-slate-300 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded border border-gray-300 bg-white shrink-0" />
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{step.title}</span>
                <span className="text-xs text-gray-400 font-normal">{step.date}</span>
              </div>
            </div>

            {/* Right: Status Badge */}
            {step.status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                Completed
              </span>
            )}
            {step.status === 'inprogress' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shrink-0" />
                Inprogress
              </span>
            )}
            {step.status === 'upcoming' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shrink-0" />
                Upcoming
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
