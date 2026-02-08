import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ImageGallery.css';

interface ImageData {
  id: string;
  url: string;
  descripcion?: string;
  orden: number;
  esPrincipal?: boolean;
  thumbnailUrl?: string; // For progressive loading
}

interface ImageGalleryProps {
  images: ImageData[];
  maxVisibleImages?: number;
  showControls?: boolean; // Admin controls
  onImageReorder?: (imageIds: string[]) => void;
  onSetMainImage?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
  className?: string;
}

interface LazyImageProps {
  src: string;
  alt: string;
  thumbnailSrc?: string;
  className?: string;
  onClick?: () => void;
}

// Lazy Image Component with progressive loading
const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  thumbnailSrc, 
  className = '', 
  onClick 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageToShow, setImageToShow] = useState(thumbnailSrc || src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Progressive loading: thumbnail → full image
  useEffect(() => {
    if (!isInView) return;

    if (thumbnailSrc && imageToShow === thumbnailSrc) {
      const img = new Image();
      img.onload = () => {
        setImageToShow(src);
        setIsLoaded(true);
      };
      img.onerror = () => setHasError(true);
      img.src = src;
    } else {
      setIsLoaded(true);
    }
  }, [isInView, src, thumbnailSrc, imageToShow]);

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-container ${className} ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
      onClick={onClick}
    >
      {isInView && (
        <>
          <img
            src={imageToShow}
            alt={alt}
            className={`lazy-image ${isLoaded ? 'fade-in' : 'blur'}`}
            onLoad={() => !thumbnailSrc && setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
          {!isLoaded && !hasError && (
            <div className="image-loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
          {hasError && (
            <div className="image-error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21,5V6.5L9.5,18H5C3.89,18 3,17.1 3,16V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M17.5,8A1.5,1.5 0 0,0 16,6.5A1.5,1.5 0 0,0 14.5,8A1.5,1.5 0 0,0 16,9.5A1.5,1.5 0 0,0 17.5,8M13.5,15.5L10.5,11.5L8.5,14.5H6L13.5,15.5Z" />
              </svg>
              <span>Error al cargar</span>
            </div>
          )}
        </>
      )}
      {!isInView && <div className="image-placeholder"></div>}
    </div>
  );
};

// Lightbox Modal Component
interface LightboxProps {
  images: ImageData[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  showControls?: boolean;
  onImageReorder?: (imageIds: string[]) => void;
  onSetMainImage?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  showControls,
  onImageReorder,
  onSetMainImage,
  onDeleteImage
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setActiveIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
          break;
        case 'ArrowRight':
          setActiveIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const currentImage = images[activeIndex];

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lightbox-header">
          <div className="image-counter">
            {activeIndex + 1} / {images.length}
          </div>
          
          {showControls && currentImage && (
            <div className="lightbox-controls">
              {!currentImage.esPrincipal && (
                <button 
                  className="control-btn"
                  onClick={() => onSetMainImage?.(currentImage.id)}
                  title="Establecer como imagen principal"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                  </svg>
                  Principal
                </button>
              )}
              <button 
                className="control-btn delete"
                onClick={() => onDeleteImage?.(currentImage.id)}
                title="Eliminar imagen"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                </svg>
                Eliminar
              </button>
            </div>
          )}
          
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        {/* Main Image */}
        <div className="lightbox-main">
          {images.length > 1 && (
            <button 
              className="nav-btn prev"
              onClick={() => setActiveIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
              </svg>
            </button>
          )}
          
          <div className="main-image">
            <LazyImage
              src={currentImage?.url || ''}
              alt={currentImage?.descripcion || `Imagen ${activeIndex + 1}`}
              className="lightbox-image"
            />
          </div>
          
          {images.length > 1 && (
            <button 
              className="nav-btn next"
              onClick={() => setActiveIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="lightbox-thumbnails">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`thumbnail ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                <LazyImage
                  src={image.thumbnailUrl || image.url}
                  alt={image.descripcion || `Thumbnail ${index + 1}`}
                  className="thumbnail-image"
                />
                {image.esPrincipal && (
                  <div className="main-indicator">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {currentImage?.descripcion && (
          <div className="lightbox-description">
            {currentImage.descripcion}
          </div>
        )}
      </div>
    </div>
  );
};

// Main ImageGallery Component
const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  maxVisibleImages = 4,
  showControls = false,
  onImageReorder,
  onSetMainImage,
  onDeleteImage,
  className = ''
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sort images by order
  const sortedImages = [...images].sort((a, b) => a.orden - b.orden);
  const visibleImages = sortedImages.slice(0, maxVisibleImages);
  const remainingCount = Math.max(0, sortedImages.length - maxVisibleImages);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Drag and drop for reordering (admin only)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!showControls) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !showControls) return;

    const newImages = [...sortedImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update order and notify parent
    const reorderedIds = newImages.map(img => img.id);
    onImageReorder?.(reorderedIds);
    setDraggedIndex(null);
  };

  if (images.length === 0) {
    return (
      <div className={`image-gallery empty ${className}`}>
        <div className="empty-gallery">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,5V6.5L9.5,18H5C3.89,18 3,17.1 3,16V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M17.5,8A1.5,1.5 0 0,0 16,6.5A1.5,1.5 0 0,0 14.5,8A1.5,1.5 0 0,0 16,9.5A1.5,1.5 0 0,0 17.5,8M13.5,15.5L10.5,11.5L8.5,14.5H6L13.5,15.5Z" />
          </svg>
          <p>No hay imágenes disponibles</p>
        </div>
      </div>
    );
  }

  const shouldUseCollage = className && (className.includes('details') || className.includes('activity') || className.includes('accommodation'));
  
  return (
    <>
      <div className={`image-gallery ${className} ${showControls ? 'admin-mode' : ''}`}>
        <div className={`gallery-grid ${shouldUseCollage ? 'gallery-grid-collage' : ''}`}>
          {visibleImages.map((image, index) => (
            <div
              key={image.id}
              className={`gallery-item ${index === 0 ? 'main-item' : ''} ${image.esPrincipal ? 'is-main' : ''} gallery-item-${index}`}
              draggable={showControls}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => openLightbox(index)}
            >
              <LazyImage
                src={image.url}
                alt={image.descripcion || `Imagen ${index + 1}`}
                thumbnailSrc={image.thumbnailUrl}
                className="gallery-image"
              />
              
              {image.esPrincipal && (
                <div className="main-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                  </svg>
                </div>
              )}

              {/* Show overlay on last visible image if there are more */}
              {index === maxVisibleImages - 1 && remainingCount > 0 && (
                <div className="more-images-overlay">
                  <span className="more-count">+{remainingCount}</span>
                  <span className="more-text">Ver todas las fotos</span>
                </div>
              )}

              {showControls && (
                <div className="admin-controls">
                  {!image.esPrincipal && (
                    <button
                      className="control-btn set-main"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetMainImage?.(image.id);
                      }}
                      title="Establecer como principal"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="control-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage?.(image.id);
                    }}
                    title="Eliminar imagen"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                    </svg>
                  </button>
                </div>
              )}
              
              {showControls && (
                <div className="drag-handle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <Lightbox
        images={sortedImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        showControls={showControls}
        onImageReorder={onImageReorder}
        onSetMainImage={onSetMainImage}
        onDeleteImage={onDeleteImage}
      />
    </>
  );
};

export default ImageGallery;
