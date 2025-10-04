import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Bed } from 'lucide-react';
import './AccommodationCard.css';
import { AlojamientoResponse } from '../../services/alojamientoApiService';

interface AccommodationCardProps {
  accommodation: AlojamientoResponse;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

const AccommodationCard: React.FC<AccommodationCardProps> = ({
  accommodation,
  onToggleFavorite,
  isFavorite = false
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(accommodation.id);
    }
  };

  const getMainImageUrl = () => {
    if (accommodation.imagenPrincipal) {
      return accommodation.imagenPrincipal;
    }
    
    if (accommodation.imagenes && accommodation.imagenes.length > 0) {
      const principalImage = accommodation.imagenes.find(img => img.esPrincipal);
      return principalImage ? principalImage.url : accommodation.imagenes[0].url;
    }
    
    return '/placeholder-sendero.svg';
  };

  const formatCapacity = () => {
    if (accommodation.capacidadMinima === accommodation.capacidadMaxima) {
      return `${accommodation.capacidadMinima} persona${accommodation.capacidadMinima > 1 ? 's' : ''}`;
    }
    return `${accommodation.capacidadMinima}-${accommodation.capacidadMaxima} personas`;
  };

  const formatBedConfiguration = () => {
    const config = [];
    
    if (accommodation.cantidadCamasDobles > 0) {
      config.push(`${accommodation.cantidadCamasDobles} cama${accommodation.cantidadCamasDobles > 1 ? 's' : ''} doble${accommodation.cantidadCamasDobles > 1 ? 's' : ''}`);
    }
    
    if (accommodation.cantidadLiteras > 0) {
      config.push(`${accommodation.cantidadLiteras} litera${accommodation.cantidadLiteras > 1 ? 's' : ''}`);
    }
    
    return config.join(', ') || 'Configuración no especificada';
  };

  return (
    <Link to={`/alojamientos/${accommodation.id}`} className="accommodation-card-link">
      <div className="accommodation-card">
        {/* Image Section */}
        <div className="accommodation-card__image-container">
          <img
            src={getMainImageUrl()}
            alt={accommodation.nombre}
            className="accommodation-card__image"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-sendero.svg';
            }}
          />
          
          {/* Gallery Indicator */}
          {accommodation.tieneGaleria && (
            <div className="accommodation-card__gallery-indicator">
              📷 {accommodation.totalImagenes}
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            className={`accommodation-card__favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart className={`heart-icon ${isFavorite ? 'filled' : ''}`} />
          </button>
        </div>

        {/* Content Section */}
        <div className="accommodation-card__content">
          {/* Title */}
          <h3 className="accommodation-card__title">
            {accommodation.nombre}
          </h3>

          {/* Capacity Info */}
          <div className="accommodation-card__info-row">
            <div className="accommodation-card__capacity">
              <Users className="icon" size={16} />
              <span>ocupación: {formatCapacity()} max {accommodation.capacidadMaxima}</span>
            </div>
          </div>

          {/* Bed Configuration */}
          <div className="accommodation-card__info-row">
            <div className="accommodation-card__beds">
              <Bed className="icon" size={16} />
              <span>{formatBedConfiguration()}</span>
            </div>
          </div>

          {/* Location (if available) */}
          {accommodation.ubicacion && (
            <div className="accommodation-card__location">
              📍 {accommodation.ubicacion}
            </div>
          )}

          {/* Price Section */}
          <div className="accommodation-card__price-section">
            <div className="accommodation-card__price">
              <span className="price-amount">Desde ${accommodation.precioPorNoche.toLocaleString('es-UY')} UYU</span>
              <span className="price-period">por noche x persona</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AccommodationCard;