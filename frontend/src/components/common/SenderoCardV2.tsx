import React, { useState } from 'react';
import './SenderoCardV2.css';

export interface SenderoCardV2Props {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  duracion: string;
  dificultad: string;
  precio: number;
  moneda: string;
  maxParticipants: number;
  onViewDetails: (id: string) => void;
  galeria?: string[]; // Array of image URLs for gallery
}

const SenderoCardV2: React.FC<SenderoCardV2Props> = ({
  id,
  nombre,
  imagenUrl,
  precio,
  moneda,
  onViewDetails,
  galeria
}) => {
  
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Build image gallery: main image + gallery images
  const images = galeria && galeria.length > 0 ? [imagenUrl, ...galeria] : [imagenUrl];
  const currentImage = images[currentImageIndex] || imagenUrl;
  const hasMultipleImages = images.length > 1;
  
  const handleClick = () => {
    console.log('🎯 SenderoCardV2 clicked:', id, nombre);
    onViewDetails(id);
  };

  const handleImageError = () => {
    console.log('❌ SenderoCardV2 image failed to load:', currentImage);
    setImageError(true);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    console.log('❤️ Favorite toggled for:', nombre);
  };

  return (
    <div className="sendero-card-v2" onClick={handleClick}>
      {/* Image Section with Gallery Navigation */}
      <div className="sendero-card-v2-image-container">
        {currentImage && !imageError ? (
          <img 
            src={currentImage}
            alt={nombre}
            onError={handleImageError}
            className="sendero-card-v2-image"
            crossOrigin="anonymous"
            loading="lazy"
          />
        ) : (
          <div className="sendero-card-v2-placeholder">
            <span className="sendero-card-v2-placeholder-icon">🌲</span>
          </div>
        )}
        
        {/* Gallery Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button 
              className="sendero-card-v2-nav-arrow prev"
              onClick={handlePrevImage}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button 
              className="sendero-card-v2-nav-arrow next"
              onClick={handleNextImage}
              aria-label="Imagen siguiente"
            >
              ›
            </button>
          </>
        )}
        
        {/* Favorite Button */}
        <button 
          className={`sendero-card-v2-favorite ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
          aria-label={`${isFavorite ? 'Quitar de' : 'Agregar a'} favoritos`}
        >
          {isFavorite ? '❤️' : '♡'}
        </button>
      </div>

      {/* Content Section - Minimal */}
      <div className="sendero-card-v2-content">
        <h3 className="sendero-card-v2-title">{nombre}</h3>
        
        <div className="sendero-card-v2-footer">
          <span className="sendero-card-v2-icon">📷</span>
          <span className="sendero-card-v2-price">
            ${precio.toLocaleString()} {moneda}
          </span>
          <span className="sendero-card-v2-per-person">Por persona</span>
        </div>
      </div>
    </div>
  );
};

export default SenderoCardV2;
