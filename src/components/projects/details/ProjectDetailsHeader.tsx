import React from "react";
import { ArrowLeft } from "lucide-react";

interface ProjectDetailsHeaderProps {
  title?: string;
  onBack?: () => void;
}

export const ProjectDetailsHeader: React.FC<ProjectDetailsHeaderProps> = ({
  title = "Project Details",
  onBack,
}) => {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        type="button"
        className="inline-flex items-center gap-2 bg-brand-accent hover:bg-[#1D4ED8] active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
    </div>
  );
};
