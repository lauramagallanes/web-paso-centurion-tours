import React, { useState } from 'react';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';
import AccommodationCard from '../../components/common/AccommodationCard';
import ActivityCard from '../../components/common/ActivityCard';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import './Favorites.css';

const Favorites: React.FC = () => {
  const { state, clearFavorites } = useFavorites();
  const { addItem } = useCart();
  const [filter, setFilter] = useState<'all' | 'accommodation' | 'activity'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'price'>('recent');

  const filteredItems = state.items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.price - b.price;
      default:
        return 0;
    }
  });

  const handleAddAllToCart = () => {
    filteredItems.forEach(item => {
      const cartItem = {
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        image: item.image,
        price: item.price,
        currency: item.currency,
        // Default values for cart
        ...(item.type === 'accommodation' ? {
          checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          checkOut: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          guests: item.capacity?.min || 1
        } : {
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          participants: 1,
          duration: item.duration
        })
      };
      addItem(cartItem);
    });
  };

  if (state.count === 0) {
    return (
      <div className="favorites-page">
        <div className="container">
          <div className="favorites-header">
            <h1 className="page-title">❤️ Mis Favoritos</h1>
            <p className="page-description">
              Guarda tus alojamientos y actividades favoritas para encontrarlos fácilmente.
            </p>
          </div>

          <EmptyState
            illustration="empty-favorites"
            title="Aún no tienes favoritos"
            description="Explora nuestros alojamientos y actividades, y marca como favoritos los que más te gusten para encontrarlos fácilmente después."
            primaryAction={{
              label: "Ver Alojamientos",
              onClick: () => window.location.href = '/alojamientos',
              variant: "primary"
            }}
            secondaryAction={{
              label: "Ver Actividades",
              onClick: () => window.location.href = '/actividades',
              variant: "secondary"
            }}
            className="favorites-empty-state"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="container">
        {/* Header */}
        <div className="favorites-header">
          <div className="header-content">
            <h1 className="page-title">
              ❤️ Mis Favoritos
              <span className="favorites-count">({state.count})</span>
            </h1>
            <p className="page-description">
              Tus alojamientos y actividades favoritas en un solo lugar.
            </p>
          </div>
          
          <div className="header-actions">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleAddAllToCart}
              disabled={filteredItems.length === 0}
              leftIcon="🛒"
            >
              Agregar Todo al Carrito
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearFavorites}
              className="clear-favorites"
            >
              Limpiar Favoritos
            </Button>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="favorites-controls">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({state.count})
            </button>
            <button
              className={`filter-tab ${filter === 'accommodation' ? 'active' : ''}`}
              onClick={() => setFilter('accommodation')}
            >
              🏠 Alojamientos ({state.items.filter(i => i.type === 'accommodation').length})
            </button>
            <button
              className={`filter-tab ${filter === 'activity' ? 'active' : ''}`}
              onClick={() => setFilter('activity')}
            >
              🏃 Actividades ({state.items.filter(i => i.type === 'activity').length})
            </button>
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-select" className="sort-label">Ordenar por:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'price')}
              className="sort-select"
            >
              <option value="recent">Más recientes</option>
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="favorites-results">
          {filteredItems.length === 0 ? (
            <div className="no-results">
              <p>No hay {filter === 'all' ? 'favoritos' : filter === 'accommodation' ? 'alojamientos' : 'actividades'} para mostrar.</p>
            </div>
          ) : (
            <div className="favorites-grid">
              {sortedItems.map((item) => (
                <div key={item.id} className="favorite-item">
                  {item.type === 'accommodation' ? (
                    <AccommodationCard
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      image={item.image}
                      capacity={item.capacity || { min: 1, max: 4 }}
                      price={item.price}
                      currency={item.currency}
                      amenities={item.amenities || []}
                      availability={true}
                      rating={item.rating}
                      onBook={(id) => console.log('Book accommodation:', id)}
                      onViewDetails={(id) => console.log('View details:', id)}
                    />
                  ) : (
                    <ActivityCard
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      image={item.image}
                      difficulty={item.difficulty || 'Moderado'}
                      duration={item.duration || '3 horas'}
                      price={item.price}
                      currency={item.currency}
                      maxParticipants={item.maxParticipants || 8}
                      includes={item.includes || []}
                      onBook={(id) => console.log('Book activity:', id)}
                    />
                  )}
                  <div className="favorite-added-date">
                    Agregado el {new Date(item.addedAt).toLocaleDateString('es-UY', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
