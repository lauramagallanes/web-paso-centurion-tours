import React, { useState, useEffect, useCallback } from 'react';
import './ImageGridGallery.css';

interface ImageData {
  id: string;
  url: string;
  descripcion?: string;
}

interface ImageGridGalleryProps {
  images: ImageData[];
  altText?: string;
}

const ImageGridGallery: React.FC<ImageGridGalleryProps> = ({ images, altText = 'Gallery' }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || !Array.isArray(images) || images.length === 0) {
    return (
      <div className="image-grid-empty">
        <p>No hay imágenes disponibles</p>
      </div>
    );
  }

  const displayImages = images.slice(0, 5);
  const remainingCount = Math.max(0, images.length - 5);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, closeLightbox, nextImage, prevImage]);

  return (
    <>
      <div className="image-grid-gallery-v2">
        {displayImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={`image-grid-item-v2 image-grid-item-${index}`}
            onClick={() => openLightbox(index)}
            aria-label={image.descripcion || `${altText} ${index + 1}`}
          >
            <img
              src={image.url}
              alt={image.descripcion || `${altText} ${index + 1}`}
              loading="lazy"
            />
            {index === 4 && remainingCount > 0 && (
              <div className="image-grid-overlay-count">
                <span className="overlay-count-number">+{remainingCount}</span>
                <span className="overlay-count-label">Ver todas las fotos</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <div className="image-grid-lightbox" onClick={closeLightbox} role="dialog" aria-modal="true">
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Cerrar">
            ×
          </button>

          <button
            className="lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            aria-label="Imagen anterior"
          >
            ‹
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[currentImageIndex].url}
              alt={images[currentImageIndex].descripcion || altText}
            />
            <div className="lightbox-counter">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>

          <button
            className="lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            aria-label="Siguiente imagen"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
};

export default ImageGridGallery;
