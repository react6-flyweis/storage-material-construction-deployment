import React from "react";
import { Button } from "@/components/ui/button";

interface ProjectDetailsNavButtonsProps {
  onViewBOM?: () => void;
  onViewDrawings?: () => void;
  onMaterialDelivery?: () => void;
  onBundleScan?: () => void;
}

export const ProjectDetailsNavButtons: React.FC<ProjectDetailsNavButtonsProps> = ({
  onViewBOM,
  onViewDrawings,
  onMaterialDelivery,
  onBundleScan,
}) => {
  const buttons = [
    { label: "View BOM", onClick: onViewBOM },
    { label: "View Drawings & Photos", onClick: onViewDrawings },
    { label: "Material Delivery", onClick: onMaterialDelivery },
    { label: "Bundle Scan", onClick: onBundleScan },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
      {buttons.map((btn) => (
        <Button
          key={btn.label}
          onClick={btn.onClick}
          className="h-10 sm:h-11 bg-brand-blue hover:bg-[#163e7e] text-white font-medium text-xs sm:text-sm rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.98] w-full"
        >
          {btn.label}
        </Button>
      ))}
    </div>
  );
};
