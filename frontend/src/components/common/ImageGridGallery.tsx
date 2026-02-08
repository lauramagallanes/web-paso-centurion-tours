import React, { useState } from 'react';
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

  // Validación: asegurar que images sea un array válido
  if (!images || !Array.isArray(images) || images.length === 0) {
    return (
      <div className="image-grid-empty">
        <p>No hay imágenes disponibles</p>
      </div>
    );
  }

  // Tomar máximo 5 imágenes
  const displayImages = images.slice(0, 5);
  const remainingCount = Math.max(0, images.length - 5);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="image-grid-empty">
        <p>No hay imágenes disponibles</p>
      </div>
    );
  }

  // Estilos inline para forzar el layout correcto
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '8px',
    height: '500px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
  };

  const itemStyles: React.CSSProperties[] = [
    { gridColumn: '1', gridRow: '1 / 3' }, // Item 0 - imagen principal (grande)
    { gridColumn: '2', gridRow: '1' },      // Item 1
    { gridColumn: '3', gridRow: '1' },      // Item 2
    { gridColumn: '2', gridRow: '2' },      // Item 3
    { gridColumn: '3', gridRow: '2' },      // Item 4
  ];

  const baseItemStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  };

  return (
    <>
      <div className="image-grid-gallery-v2" style={gridStyle}>
        {displayImages.map((image, index) => (
          <div
            key={image.id}
            className={`image-grid-item-v2 image-grid-item-${index}`}
            style={{ ...baseItemStyle, ...itemStyles[index] }}
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.url}
              alt={image.descripcion || `${altText} ${index + 1}`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {index === 4 && remainingCount > 0 && (
              <div className="image-grid-overlay">
                <span>+{remainingCount}</span>
                <span>Ver todas las fotos</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="image-grid-lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            ×
          </button>
          
          <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
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
          
          <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            ›
          </button>
        </div>
      )}
    </>
  );
};

export default ImageGridGallery;
