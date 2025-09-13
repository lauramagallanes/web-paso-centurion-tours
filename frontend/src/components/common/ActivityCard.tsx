import React from 'react';
import Card, { CardBody, CardFooter, CardImage } from './Card';
import Button from './Button';
import FavoriteButton from './FavoriteButton';
import { useCart } from '../../contexts/CartContext';
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
  const { addItem } = useCart();

  // Use imagenPrincipal if available, fallback to image for backward compatibility
  const displayImage = imagenPrincipal || image || '';
  const hasGallery = tieneGaleria || (totalImagenes && totalImagenes > 1);

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

  const handleAddToCart = () => {
    addItem({
      id,
      type: 'activity',
      name,
      description,
      image: displayImage,
      price,
      currency,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 1 week from now
      participants: 1,
      duration
    });
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Fácil':
        return 'var(--color-success)';
      case 'Moderado':
        return 'var(--color-warning)';
      case 'Difícil':
        return 'var(--color-error)';
      default:
        return 'var(--color-neutral-500)';
    }
  };

  return (
    <Card 
      variant="nature" 
      size="md" 
      hoverable 
      className={`activity-card ${className}`}
    >
      <div className="card-image-container">
        <CardImage 
          src={displayImage} 
          alt={name} 
          aspectRatio="video"
        />
        
        {/* Gallery indicator */}
        {hasGallery && totalImagenes && (
          <div className="gallery-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M16,10L13.5,13L11,10.5L8,14H20L16,10M2,6V20A2,2 0 0,0 4,22H18V20H4V6H2Z" />
            </svg>
            <span>{totalImagenes}</span>
          </div>
        )}
      </div>
      
      <div 
        className="card-badge"
        style={{ backgroundColor: getDifficultyColor(difficulty) }}
      >
        {difficulty}
      </div>

      <FavoriteButton
        item={{
          id,
          type: 'activity',
          name,
          description,
          image: displayImage,
          price,
          currency,
          difficulty,
          duration,
          maxParticipants,
          includes
        }}
        variant="card"
        size="sm"
      />

      <CardBody>
        <div className="mb-4">
          <h3 className="card-title text-xl font-semibold mb-2 text-text">
            {name}
          </h3>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="activity-details mb-4">
          <div className="flex items-center gap-4 text-sm text-text-muted mb-2">
            <span className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{duration}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>👥</span>
              <span>Máx. {maxParticipants}</span>
            </span>
          </div>
        </div>

        {includes && includes.length > 0 && (
          <div className="activity-includes mb-4">
            <h4 className="text-sm font-medium text-text mb-2">Incluye:</h4>
            <ul className="text-xs text-text-secondary space-y-1">
              {includes.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
              {includes.length > 3 && (
                <li className="text-text-muted">
                  +{includes.length - 3} más...
                </li>
              )}
            </ul>
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
              por persona
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleAddToCart}
              leftIcon="🛒"
            >
              Agregar
            </Button>
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewDetails}
                leftIcon="👁️"
              >
                Ver detalles
              </Button>
            )}
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleBookClick}
              leftIcon="📅"
            >
              Reservar
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ActivityCard;
