import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { X, ZoomIn } from "lucide-react";
import type { ProjectPhoto } from "./types";

interface ProjectPhotosGalleryProps {
  photos: ProjectPhoto[];
  title?: string;
}

export const ProjectPhotosGallery: React.FC<ProjectPhotosGalleryProps> = ({
  photos,
  title = "Project Photos (Latest)",
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);

  return (
    <Card className="p-5 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 tracking-tight">
        {title}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative rounded-xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200/70 shadow-xs cursor-pointer"
          >
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Subtle Hover overlay */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="w-5 h-5 drop-shadow" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title}
              className="w-full max-h-[80vh] object-contain"
            />

            {selectedPhoto.title && (
              <div className="p-4 bg-white border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 text-center">
                  {selectedPhoto.title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
