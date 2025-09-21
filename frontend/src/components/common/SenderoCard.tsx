import React from 'react';
import './SenderoCard.css';

export interface SenderoCardProps {
  id: string;
  nombre: string;
  descripcion: string;
  imagenPrincipal: string;
  duracion: string;
  dificultad: 'Fácil' | 'Moderado' | 'Difícil';
  precio: number;
  moneda: string;
  maxParticipants: number;
  onViewDetails: (id: string) => void;
}

const SenderoCard: React.FC<SenderoCardProps> = ({
  id,
  nombre,
  descripcion,
  imagenPrincipal,
  duracion,
  dificultad,
  precio,
  moneda,
  maxParticipants,
  onViewDetails
}) => {
  
  const handleViewDetails = () => {
    console.log('🎯 Navigating to sendero details:', id);
    onViewDetails(id);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('❌ Image failed to load:', imagenPrincipal);
    (e.target as HTMLImageElement).src = '/placeholder-sendero.svg';
  };

  // Add cache buster to force fresh image load
  const imageUrl = imagenPrincipal && imagenPrincipal.trim() !== '' 
    ? `${imagenPrincipal}?v=${Date.now()}` 
    : '/placeholder-sendero.svg';

  console.log('🖼️ SenderoCard rendering:', {
    id,
    nombre,
    imagenPrincipal,
    finalImageUrl: imageUrl
  });

  return (
    <div className="sendero-card" onClick={handleViewDetails}>
      {/* Image Section */}
      <div className="sendero-card-image">
        <img 
          src={imageUrl}
          alt={nombre}
          onError={handleImageError}
        />
        
        {/* Favorite Button */}
        <button 
          className="sendero-card-favorite"
          onClick={(e) => e.stopPropagation()}
        >
          ♡
        </button>
      </div>

      {/* Content Section */}
      <div className="sendero-card-content">
        <div className="sendero-card-price">
          💰 {moneda} {precio.toLocaleString()}
        </div>
        
        <h3 className="sendero-card-title">{nombre}</h3>
        
        <p className="sendero-card-description">
          {descripcion.length > 80 ? `${descripcion.substring(0, 80)}...` : descripcion}
        </p>
        
        <div className="sendero-card-details">
          <span className="sendero-card-duration">⏱️ {duracion}</span>
          <span className={`sendero-card-difficulty difficulty-${dificultad.toLowerCase()}`}>
            🥾 {dificultad}
          </span>
          <span className="sendero-card-capacity">👥 {maxParticipants} max</span>
        </div>
        
        <button className="sendero-card-button">
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default SenderoCard;
