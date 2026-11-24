import { useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  HelpCircle,
  PlayCircle,
  RotateCcw,
  Truck,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notify } from "../tour.adapter";
import { tourCoordinator } from "../tour.service";
import { useTourStore } from "../tour.store";
import type { TourDefinition } from "../tour.types";
import { constructionOverviewTour } from "../tours/construction-overview.tour";
import { dispatchFlowTour } from "../tours/dispatch-flow.tour";
import { projectDetailsTour } from "../tours/project-details.tour";

interface TourMenuEntry {
  tour: TourDefinition;
  label: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
}

const TOUR_MENU: TourMenuEntry[] = [
  {
    tour: constructionOverviewTour,
    label: "Start Walkthrough",
    hint: "Every page and its main actions",
    icon: PlayCircle,
    iconClassName: "text-[#1D51A4]",
  },
  {
    tour: projectDetailsTour,
    label: "Project Details Guide",
    hint: "Every section and page of a project",
    icon: FolderOpen,
    iconClassName: "text-[#A855F7]",
  },
  {
    tour: dispatchFlowTour,
    label: "Delivery & Dispatch Guide",
    hint: "Receive, scan and verify bundles",
    icon: Truck,
    iconClassName: "text-[#FD8D5B]",
  },
];

const ICON_BUTTON =
  "size-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer";

export function TourHubMenu() {
  const navigate = useNavigate();
  const { isAudioMuted, toggleAudioMute, resetAllTours, setHasSeenWelcomeModal } = useTourStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLaunch = (tour: TourDefinition) => {
    setIsOpen(false);
    tourCoordinator.init(navigate);
    void tourCoordinator.startTour(tour);
  };

  const handleToggleMute = () => {
    toggleAudioMute();
    notify(isAudioMuted ? "Voice guidance enabled" : "Voice guidance muted");
  };

  const handleReset = () => {
    resetAllTours();
    // Forget the progress without popping up the welcome dialog right away.
    setHasSeenWelcomeModal(true);
    notify("Walkthrough history reset");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        data-tour="tour-hub-btn"
        title="Product Walkthrough"
        aria-label="Product walkthrough"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 rounded-full text-gray-700 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <HelpCircle className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Product Walkthrough
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleMute}
                className={ICON_BUTTON}
                title={isAudioMuted ? "Unmute voice guidance" : "Mute voice guidance"}
              >
                {isAudioMuted ? (
                  <VolumeX className="size-4 text-red-500" />
                ) : (
                  <Volume2 className="size-4 text-blue-600" />
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={ICON_BUTTON}
                title="Reset walkthrough history"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>

          {TOUR_MENU.map(({ tour, label, hint, icon: Icon, iconClassName }) => (
            <button
              key={tour.id}
              type="button"
              onClick={() => handleLaunch(tour)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Icon className={`size-4 shrink-0 ${iconClassName}`} />
              <span>
                <span className="block font-medium">
                  {label} <span className="text-xs text-slate-400">· {tour.estimatedMinutes} min</span>
                </span>
                <span className="block text-xs text-slate-500">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
