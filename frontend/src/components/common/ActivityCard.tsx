import React, { useState, useEffect } from 'react';
import { imageStorageService } from '../../services/imageStorageService';
import './ActivityCard.css';

export interface ActivityCardProps {
  id: string;
  name: string;
  description: string;
  image?: string; // For backward compatibility
  imagenPrincipal?: string; // New field from API
  totalImagenes?: number; // New field to show gallery indicator
  tieneGaleria?: boolean; // New field to show gallery indicator
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil';
  price: number;
  currency: string;
  maxParticipants: number;
  includes: string[];
  onBook?: (id: string) => void;
  onViewDetails?: (id: string) => void; // New prop for view details
  className?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  name,
  description,
  image,
  imagenPrincipal,
  totalImagenes,
  tieneGaleria,
  duration,
  difficulty,
  price,
  currency,
  maxParticipants,
  includes,
  onBook,
  onViewDetails,
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load images - prioritize imagenPrincipal from API over localStorage
  useEffect(() => {
    const loadImages = () => {
      console.log('🖼️ ActivityCard loading images for:', id);
      console.log('🖼️ imagenPrincipal:', imagenPrincipal);
      console.log('🖼️ image (fallback):', image);
      
      // Priority 1: Use imagenPrincipal from API if available
      if (imagenPrincipal && imagenPrincipal.trim() !== '') {
        console.log('✅ Using imagenPrincipal from API');
        setImages([imagenPrincipal]);
        return;
      }
      
      // Priority 2: Use legacy image prop if available
      if (image && image.trim() !== '') {
        console.log('✅ Using legacy image prop');
        setImages([image]);
        return;
      }
      
      // Priority 3: Try localStorage as fallback (for backward compatibility)
      const storedImages = imageStorageService.getSenderoImages(id);
      if (storedImages.length > 0) {
        console.log('✅ Using images from localStorage:', storedImages.length);
        const imageUrls = storedImages.map(img => img.url);
        setImages(imageUrls);
        return;
      }
      
      // Priority 4: Default placeholder
      console.log('⚠️ No images found, using placeholder');
      setImages(['/placeholder-sendero.svg']);
    };

    loadImages();
  }, [id, imagenPrincipal, image]);

  // Load favorite status from localStorage
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.id === id));
  }, [id]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updatedFavorites;
    
    if (isFavorite) {
      updatedFavorites = favorites.filter((fav: any) => fav.id !== id);
    } else {
      const favoriteItem = {
        id,
        type: 'activity',
        name,
        description,
        image: images[0] || '',
        price,
        currency,
        difficulty,
        duration,
        maxParticipants,
        includes,
        addedAt: new Date().toISOString()
      };
      updatedFavorites = [...favorites, favoriteItem];
    }
    
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  const handleIndicatorClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const currentImage = images[currentImageIndex] || '/placeholder-sendero.svg';
  const hasMultipleImages = images.length > 1;

  return (
    <div className={`activity-card ${className}`}>
      {/* Image Carousel */}
      <div className="card-image-carousel">
        <img 
          src={currentImage} 
          alt={name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-sendero.svg';
          }}
        />
        
        {/* Navigation arrows - only show if multiple images */}
        {hasMultipleImages && (
          <>
            <button 
              className="carousel-nav prev" 
              onClick={handlePrevImage}
              aria-label="Imagen anterior"
            >
              <svg viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            
            <button 
              className="carousel-nav next" 
              onClick={handleNextImage}
              aria-label="Imagen siguiente"
            >
              <svg viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </>
        )}

        {/* Image indicators - only show if multiple images */}
        {hasMultipleImages && (
          <div className="carousel-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`carousel-indicator ${index === currentImageIndex ? 'active' : ''}`}
                onClick={(e) => handleIndicatorClick(index, e)}
                aria-label={`Ver imagen ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Favorite Button */}
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteToggle}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <h3 className="card-title">{name}</h3>
        
        <div className="card-price-section">
          <svg className="card-camera-icon" viewBox="0 0 24 24">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5A3.5 3.5 0 0 1 12 15.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.32-.07.65-.07.97c0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63Z"/>
          </svg>
          <span className="card-price">{currency} {price.toLocaleString()}</span>
          <span className="card-price-unit">Por persona</span>
        </div>

        <button 
          className="card-details-btn"
          onClick={handleViewDetails}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default ActivityCard;