import React from 'react';
import Card, { CardBody, CardFooter, CardImage } from './Card';
import Button from './Button';

export interface AccommodationCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  capacity: {
    min: number;
    max: number;
  };
  price: number;
  currency: string;
  amenities: string[];
  availability: boolean;
  rating?: number;
  onBook?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  className?: string;
}

const AccommodationCard: React.FC<AccommodationCardProps> = ({
  id,
  name,
  description,
  image,
  capacity,
  price,
  currency,
  amenities,
  availability,
  rating,
  onBook,
  onViewDetails,
  className = ''
}) => {
  const handleBookClick = () => {
    if (onBook) {
      onBook(id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i}>⭐</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half">⭐</span>);
    }

    return stars;
  };

  return (
    <Card 
      variant="default" 
      size="md" 
      hoverable 
      className={`accommodation-card ${className}`}
    >
      <CardImage 
        src={image} 
        alt={name} 
        aspectRatio="video"
      />
      
      {!availability && (
        <div 
          className="card-badge"
          style={{ backgroundColor: 'var(--color-error)' }}
        >
          No Disponible
        </div>
      )}

      <CardBody>
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="card-title text-xl font-semibold text-text">
              {name}
            </h3>
            {rating && (
              <div className="flex items-center gap-1 text-sm">
                {renderStars(rating)}
                <span className="text-text-muted ml-1">({rating})</span>
              </div>
            )}
          </div>
          
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="accommodation-details mb-4">
          <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
            <span className="flex items-center gap-1">
              <span>👥</span>
              <span>{capacity.min}-{capacity.max} personas</span>
            </span>
            <span className={`flex items-center gap-1 ${availability ? 'text-success' : 'text-error'}`}>
              <span>{availability ? '✅' : '❌'}</span>
              <span>{availability ? 'Disponible' : 'Ocupado'}</span>
            </span>
          </div>
        </div>

        {amenities && amenities.length > 0 && (
          <div className="accommodation-amenities mb-4">
            <h4 className="text-sm font-medium text-text mb-2">Comodidades:</h4>
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 4).map((amenity, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 text-text border"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-text-muted">
                  +{amenities.length - 4} más
                </span>
              )}
            </div>
          </div>
        )}
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <div className="price-info">
            <span className="card-price">
              {currency} {price.toLocaleString()}
            </span>
            <span className="card-price-unit ml-1">
              por noche
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewDetails}
            >
              Ver Detalles
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleBookClick}
              disabled={!availability}
              leftIcon="🏠"
            >
              {availability ? 'Reservar' : 'No disponible'}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AccommodationCard;
