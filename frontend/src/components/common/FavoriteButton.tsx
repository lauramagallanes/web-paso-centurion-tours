import React from 'react';
import { useFavorites, FavoriteItem } from '../../contexts/FavoritesContext';
import Icon from './Icon';
import './FavoriteButton.css';

interface FavoriteButtonProps {
  item: Omit<FavoriteItem, 'addedAt'>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'floating';
  showTooltip?: boolean;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  item,
  size = 'md',
  variant = 'default',
  showTooltip = true,
  className = ''
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isItemFavorite = isFavorite(item.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item);
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'favorite-btn-sm';
      case 'lg': return 'favorite-btn-lg';
      default: return 'favorite-btn-md';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'card': return 'favorite-btn-card';
      case 'floating': return 'favorite-btn-floating';
      default: return 'favorite-btn-default';
    }
  };

  return (
    <button
      className={`favorite-button ${getSizeClass()} ${getVariantClass()} ${isItemFavorite ? 'active' : ''} ${className}`}
      onClick={handleClick}
      aria-label={isItemFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      title={showTooltip ? (isItemFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos') : undefined}
    >
      <Icon 
        name={isItemFavorite ? 'heart-filled' : 'heart'} 
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
        color={isItemFavorite ? 'error' : 'muted'}
        className="favorite-icon"
      />
      {variant === 'default' && (
        <span className="favorite-text">
          {isItemFavorite ? 'En Favoritos' : 'Favorito'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
