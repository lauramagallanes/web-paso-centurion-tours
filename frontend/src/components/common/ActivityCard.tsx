import React from 'react';
import Card, { CardBody, CardFooter, CardImage } from './Card';
import Button from './Button';
import FavoriteButton from './FavoriteButton';
import { useCart } from '../../contexts/CartContext';

export interface ActivityCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil';
  price: number;
  currency: string;
  maxParticipants: number;
  includes: string[];
  onBook?: (id: string) => void;
  className?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  name,
  description,
  image,
  duration,
  difficulty,
  price,
  currency,
  maxParticipants,
  includes,
  onBook,
  className = ''
}) => {
  const { addItem } = useCart();

  const handleBookClick = () => {
    if (onBook) {
      onBook(id);
    }
  };

  const handleAddToCart = () => {
    addItem({
      id,
      type: 'activity',
      name,
      description,
      image,
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
      <CardImage 
        src={image} 
        alt={name} 
        aspectRatio="video"
      />
      
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
          image,
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
          
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleAddToCart}
              leftIcon="🛒"
            >
              Agregar
            </Button>
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
