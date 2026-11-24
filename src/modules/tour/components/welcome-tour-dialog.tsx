import { useEffect, useState } from "react";
import { Compass, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { tourCoordinator } from "../tour.service";
import { useTourStore } from "../tour.store";
import { constructionOverviewTour } from "../tours/construction-overview.tour";

export function WelcomeTourDialog() {
  const navigate = useNavigate();
  const { hasSeenWelcomeModal, setHasSeenWelcomeModal, isAudioMuted, toggleAudioMute } =
    useTourStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (hasSeenWelcomeModal || window.innerWidth < 1024) return;
    const timer = window.setTimeout(() => setIsOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [hasSeenWelcomeModal]);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenWelcomeModal(true);
  };

  const handleStart = () => {
    handleClose();
    tourCoordinator.init(navigate);
    void tourCoordinator.startTour(constructionOverviewTour);
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      containerClassName="max-w-md items-center text-center gap-4"
    >
      <div className="size-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1D51A4]">
        <Compass className="size-6 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
        Welcome to the Construction Panel <Sparkles className="size-4 text-amber-500" />
      </h2>
      <p className="text-sm text-slate-600">
        Would you like a {constructionOverviewTour.estimatedMinutes}-minute guided tour of your
        projects, tasks, material requests, deliveries and team communication?
      </p>
      <button
        onClick={toggleAudioMute}
        type="button"
        className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
      >
        {isAudioMuted ? (
          <VolumeX className="size-4 text-red-500" />
        ) : (
          <Volume2 className="size-4 text-blue-600" />
        )}
        {isAudioMuted ? "Voice Guidance: Muted" : "Voice Guidance: Enabled"}
      </button>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button onClick={handleStart} className="bg-[#1D51A4] hover:bg-[#163f82] text-white">
          Start Tour ({constructionOverviewTour.estimatedMinutes} min)
        </Button>
        <Button
          variant="outline"
          onClick={handleClose}
          className="text-slate-600 border-slate-300"
        >
          Explore on My Own
        </Button>
      </div>
    </Modal>
  );
}
