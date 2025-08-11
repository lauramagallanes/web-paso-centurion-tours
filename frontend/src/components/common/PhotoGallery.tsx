import React, { useState, useCallback, useMemo } from 'react';
import PhotoViewer from './PhotoViewer';
import Icon from './Icon';
import './PhotoGallery.css';

interface Photo {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  photographer?: string;
  location?: string;
  thumbnail?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  showCaptions?: boolean;
  enableViewer?: boolean;
  enableLightbox?: boolean;
  className?: string;
  onPhotoClick?: (photo: Photo, index: number) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  layout = 'grid',
  columns = 3,
  gap = 'md',
  showCaptions = false,
  enableViewer = true,
  enableLightbox = true,
  className = '',
  onPhotoClick
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handlePhotoClick = useCallback((photo: Photo, index: number) => {
    if (onPhotoClick) {
      onPhotoClick(photo, index);
    }
    
    if (enableViewer) {
      setCurrentIndex(index);
      setViewerOpen(true);
    }
  }, [onPhotoClick, enableViewer]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const handleImageLoad = useCallback((photoId: string) => {
    setLoadedImages(prev => new Set([...prev, photoId]));
  }, []);

  const handleImageError = useCallback((photoId: string) => {
    setFailedImages(prev => new Set([...prev, photoId]));
  }, []);

  const galleryClasses = useMemo(() => {
    return [
      'photo-gallery',
      `photo-gallery-${layout}`,
      `photo-gallery-columns-${columns}`,
      `photo-gallery-gap-${gap}`,
      className
    ].filter(Boolean).join(' ');
  }, [layout, columns, gap, className]);

  if (!photos || photos.length === 0) {
    return (
      <div className="photo-gallery-empty">
        <Icon name="camera" size="lg" color="muted" />
        <p>No hay fotos para mostrar</p>
      </div>
    );
  }

  return (
    <>
      <div className={galleryClasses}>
        {photos.map((photo, index) => (
          <div 
            key={photo.id}
            className="photo-gallery-item"
            onClick={() => handlePhotoClick(photo, index)}
          >
            <div className="photo-item-container">
              {/* Loading State */}
              {!loadedImages.has(photo.id) && !failedImages.has(photo.id) && (
                <div className="photo-item-loading">
                  <Icon name="sun" size="md" className="loading" />
                </div>
              )}
              
              {/* Error State */}
              {failedImages.has(photo.id) && (
                <div className="photo-item-error">
                  <Icon name="close" size="md" color="error" />
                  <span>Error al cargar</span>
                </div>
              )}
              
              {/* Image */}
              {!failedImages.has(photo.id) && (
                <img
                  src={photo.thumbnail || photo.src}
                  alt={photo.alt}
                  className={`photo-item-image ${loadedImages.has(photo.id) ? 'loaded' : 'loading'}`}
                  onLoad={() => handleImageLoad(photo.id)}
                  onError={() => handleImageError(photo.id)}
                  loading="lazy"
                />
              )}
              
              {/* Overlay */}
              <div className="photo-item-overlay">
                <div className="photo-item-actions">
                  <button
                    className="photo-action-button"
                    aria-label={`Ver foto: ${photo.alt}`}
                  >
                    <Icon name="search" size="sm" />
                  </button>
                </div>
                
                {/* Caption */}
                {showCaptions && (photo.title || photo.description) && (
                  <div className="photo-item-caption">
                    {photo.title && (
                      <h4 className="photo-caption-title">{photo.title}</h4>
                    )}
                    {photo.description && (
                      <p className="photo-caption-description">{photo.description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Viewer */}
      {enableViewer && enableLightbox && (
        <PhotoViewer
          photos={photos}
          currentIndex={currentIndex}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          showThumbnails={photos.length > 1}
          showInfo={true}
          enableKeyboard={true}
          enableSwipe={true}
        />
      )}
    </>
  );
};

export default PhotoGallery;