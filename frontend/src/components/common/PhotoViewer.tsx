import React, { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import './PhotoViewer.css';

interface Photo {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  photographer?: string;
  location?: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showThumbnails?: boolean;
  showInfo?: boolean;
  enableKeyboard?: boolean;
  enableSwipe?: boolean;
  className?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  showThumbnails = true,
  showInfo = true,
  enableKeyboard = true,
  enableSwipe = true,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const currentPhoto = photos[currentIndex];
  const hasMultiplePhotos = photos.length > 1;

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !enableKeyboard) return;

    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (onPrevious && hasMultiplePhotos) {
          onPrevious();
        }
        break;
      case 'ArrowRight':
        if (onNext && hasMultiplePhotos) {
          onNext();
        }
        break;
      case ' ':
        event.preventDefault();
        setShowControls(!showControls);
        break;
    }
  }, [isOpen, enableKeyboard, onClose, onNext, onPrevious, hasMultiplePhotos, showControls]);

  useEffect(() => {
    if (enableKeyboard) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enableKeyboard]);

  // Touch/Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipe || !touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = Math.abs(touchStart.y - touch.clientY);
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0 && onNext && hasMultiplePhotos) {
        onNext();
      } else if (deltaX < 0 && onPrevious && hasMultiplePhotos) {
        onPrevious();
      }
    }
    
    setTouchStart(null);
  };

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [showControls]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div 
      className={`photo-viewer ${className}`}
      onClick={handleBackdropClick}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="photo-viewer-overlay" />
      
      {/* Header Controls */}
      <div className={`photo-viewer-header ${showControls ? 'visible' : 'hidden'}`}>
        <div className="photo-counter">
          {currentIndex + 1} / {photos.length}
        </div>
        <div className="photo-actions">
          <button
            className="photo-action-btn"
            onClick={toggleZoom}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            <Icon name={isZoomed ? 'search' : 'search'} size="sm" />
          </button>
          <button
            className="photo-action-btn photo-close-btn"
            onClick={onClose}
            aria-label="Cerrar visor"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="photo-viewer-main">
        {/* Navigation Arrows */}
        {hasMultiplePhotos && onPrevious && (
          <button
            className={`photo-nav-btn photo-nav-prev ${showControls ? 'visible' : 'hidden'}`}
            onClick={onPrevious}
            aria-label="Foto anterior"
          >
            <Icon name="chevron-left" size="lg" />
          </button>
        )}

        {/* Image Container */}
        <div className={`photo-container ${isZoomed ? 'zoomed' : ''}`}>
          {isLoading && (
            <div className="photo-loading">
              <Icon name="sun" size="lg" className="loading" />
            </div>
          )}
          
          {imageError ? (
            <div className="photo-error">
              <Icon name="close" size="lg" color="error" />
              <p>Error al cargar la imagen</p>
            </div>
          ) : (
            <img
              src={currentPhoto.src}
              alt={currentPhoto.alt}
              className="photo-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={toggleZoom}
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {hasMultiplePhotos && onNext && (
          <button
            className={`photo-nav-btn photo-nav-next ${showControls ? 'visible' : 'hidden'}`}
            onClick={onNext}
            aria-label="Foto siguiente"
          >
            <Icon name="chevron-right" size="lg" />
          </button>
        )}
      </div>

      {/* Photo Info */}
      {showInfo && (currentPhoto.title || currentPhoto.description) && (
        <div className={`photo-info ${showControls ? 'visible' : 'hidden'}`}>
          {currentPhoto.title && (
            <h3 className="photo-title">{currentPhoto.title}</h3>
          )}
          {currentPhoto.description && (
            <p className="photo-description">{currentPhoto.description}</p>
          )}
          <div className="photo-meta">
            {currentPhoto.photographer && (
              <span className="photo-photographer">
                <Icon name="camera" size="xs" />
                {currentPhoto.photographer}
              </span>
            )}
            {currentPhoto.location && (
              <span className="photo-location">
                <Icon name="home" size="xs" />
                {currentPhoto.location}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {showThumbnails && hasMultiplePhotos && (
        <div className={`photo-thumbnails ${showControls ? 'visible' : 'hidden'}`}>
          <div className="thumbnails-container">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  // This would need to be handled by parent component
                  // For now, we'll just show the thumbnail
                }}
                aria-label={`Ver foto ${index + 1}: ${photo.alt}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="thumbnail-image"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoViewer;

