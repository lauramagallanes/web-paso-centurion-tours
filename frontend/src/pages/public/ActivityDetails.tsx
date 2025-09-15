import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { imageStorageService } from '../../services/imageStorageService';
import { fixArrayEncoding } from '../../utils/encodingFixer';
import { useCart } from '../../contexts/CartContext';
import ActivityCard from '../../components/common/ActivityCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ActivityDetails.css';

interface SenderoDetails {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  precio: number;
  moneda: string;
  maxParticipantes: number;
  ubicacion: string;
  imagenes: Array<{
    id: string;
    url: string;
    descripcion?: string;
  }>;
}

interface RelatedSendero {
  id: string;
  nombre: string;
  descripcion: string;
  imagenPrincipal: string;
  duracion: string;
  dificultad: string;
  precio: number;
  moneda: string;
  maxParticipantes: number;
  incluye: string[];
  tieneGaleria: boolean;
  totalImagenes: number;
}

const ActivityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // State
  const [sendero, setSendero] = useState<SenderoDetails | null>(null);
  const [relatedSenderos, setRelatedSenderos] = useState<RelatedSendero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [participantsCount, setParticipantsCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load sendero details
  useEffect(() => {
    const loadSenderoDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.getSenderos();
        if (response.success) {
          const fixedData = fixArrayEncoding(response.data);
          const sendero = fixedData.find((s: any) => s.id === id);
          
          if (sendero) {
            const imageStats = imageStorageService.getSenderoImageStats(sendero.id);
            const senderoImages = imageStorageService.getSenderoImages(sendero.id);
            
            const transformedSendero: SenderoDetails = {
              id: sendero.id,
              nombre: sendero.nombre,
              descripcion: sendero.descripcion,
              duracion: `${sendero.duracionHoras} hora${sendero.duracionHoras !== 1 ? 's' : ''}`,
              precio: sendero.precioPorPersona,
              moneda: 'UYU',
              maxParticipantes: sendero.capacidadMaximaGrupo,
              ubicacion: 'Paso Centurión, Uruguay - Ruta 7 km 439',
              imagenes: senderoImages.length > 0 ? senderoImages.map(img => ({
                id: img.id,
                url: img.url,
                descripcion: img.descripcion
              })) : [{
                id: 'default',
                url: '/placeholder-sendero.svg',
                descripcion: 'Imagen del sendero'
              }]
            };
            
            setSendero(transformedSendero);
            
            // Load related senderos
            const relatedSenderos: RelatedSendero[] = fixedData
              .filter((s: any) => s.id !== id)
              .slice(0, 3)
              .map((s: any) => {
                const relatedImageStats = imageStorageService.getSenderoImageStats(s.id);
                const difficultyMap: Record<string, string> = {
                  'FACIL': 'Fácil',
                  'MODERADO': 'Moderado', 
                  'DIFICIL': 'Difícil'
                };
                
                return {
                  id: s.id,
                  nombre: s.nombre,
                  descripcion: s.descripcion,
                  imagenPrincipal: relatedImageStats.principal?.url || s.imagenPrincipal || '/placeholder-sendero.svg',
                  duracion: `${s.duracionHoras} hora${s.duracionHoras !== 1 ? 's' : ''}`,
                  dificultad: difficultyMap[s.nivelDificultad] || 'Moderado',
                  precio: s.precioPorPersona,
                  moneda: 'UYU',
                  maxParticipantes: s.capacidadMaximaGrupo,
                  incluye: ['Guía especializado', 'Equipo básico'],
                  tieneGaleria: relatedImageStats.total > 1,
                  totalImagenes: relatedImageStats.total
                };
              });
            
            setRelatedSenderos(relatedSenderos);
          } else {
            setError('Sendero no encontrado');
          }
        } else {
          setError(response.error || 'Error al cargar los detalles');
        }
      } catch (err) {
        console.error('Error loading sendero details:', err);
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    loadSenderoDetails();
  }, [id]);

  // Load favorite status
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.id === id));
  }, [id]);

  // Handlers
  const handleFavoriteToggle = () => {
    if (!sendero) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updatedFavorites;
    
    if (isFavorite) {
      updatedFavorites = favorites.filter((fav: any) => fav.id !== sendero.id);
    } else {
      const favoriteItem = {
        id: sendero.id,
        type: 'activity',
        name: sendero.nombre,
        description: sendero.descripcion,
        image: sendero.imagenes[0]?.url || '/placeholder-sendero.svg',
        price: sendero.precio,
        currency: sendero.moneda,
        addedAt: new Date().toISOString()
      };
      updatedFavorites = [...favorites, favoriteItem];
    }
    
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleParticipantsChange = (change: number) => {
    const newCount = Math.max(1, Math.min(sendero?.maxParticipantes || 10, participantsCount + change));
    setParticipantsCount(newCount);
  };

  const handleAddToCart = () => {
    if (!sendero) return;

    addItem({
      id: sendero.id,
      type: 'activity',
      name: sendero.nombre,
      description: sendero.descripcion,
      image: sendero.imagenes[0]?.url || '/placeholder-sendero.svg',
      price: sendero.precio,
      currency: sendero.moneda,
      date: selectedDate ? new Date(selectedDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participants: participantsCount,
      duration: sendero.duracion
    });

    navigate('/carrito');
  };

  const handleBookNow = () => {
    // For now, just add to cart and navigate
    handleAddToCart();
  };

  const handleRelatedSenderoClick = (senderoId: string) => {
    navigate(`/actividades/${senderoId}`);
  };

  const totalPrice = sendero ? sendero.precio * participantsCount : 0;

  if (isLoading) {
    return (
      <div className="activity-details-page">
        <div className="details-container">
          <LoadingSpinner size="lg" />
          <p>Cargando detalles del sendero...</p>
        </div>
      </div>
    );
  }

  if (error || !sendero) {
    return (
      <div className="activity-details-page">
        <div className="details-container">
          <h2>Error</h2>
          <p>{error || 'Sendero no encontrado'}</p>
          <button onClick={() => navigate('/actividades')}>
            Volver a Actividades
          </button>
        </div>
      </div>
    );
  }

  // Get up to 4 images for gallery
  const galleryImages = sendero.imagenes.slice(0, 4);
  while (galleryImages.length < 4) {
    galleryImages.push({
      id: `placeholder-${galleryImages.length}`,
      url: '/placeholder-sendero.svg',
      descripcion: 'Imagen del sendero'
    });
  }

  return (
    <div className="activity-details-page">
      <div className="details-container">
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <a href="/" style={{ textDecoration: 'none', color: '#666' }}>Inicio</a>
          {' > '}
          <a href="/tours" style={{ textDecoration: 'none', color: '#666' }}>Tours</a>
          {' > '}
          <span style={{ color: '#333' }}>{sendero.nombre}</span>
        </nav>

        <div className="details-layout">
          {/* Main Content */}
          <div className="details-main-content">
            {/* Image Gallery */}
            <div className="details-image-gallery">
              <div className="gallery-grid">
                <div className="gallery-main-image">
                  <img 
                    src={galleryImages[0]?.url} 
                    alt={sendero.nombre}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-sendero.svg';
                    }}
                  />
                </div>
                <div className="gallery-small-image">
                  <img 
                    src={galleryImages[1]?.url} 
                    alt={sendero.nombre}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-sendero.svg';
                    }}
                  />
                </div>
                <div className="gallery-small-image">
                  <img 
                    src={galleryImages[2]?.url} 
                    alt={sendero.nombre}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-sendero.svg';
                    }}
                  />
                </div>
              </div>

              {sendero.imagenes.length > 1 && (
                <button className="view-all-photos">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M16,10L13.5,13L11,10.5L8,14H20L16,10M2,6V20A2,2 0 0,0 4,22H18V20H4V6H2Z" />
                  </svg>
                  Ver todas las fotos
                </button>
              )}

              {/* Favorite Button */}
              <button 
                className={`details-favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={handleFavoriteToggle}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>

            {/* Title and Location */}
            <div className="details-header">
              <h1 className="details-title">{sendero.nombre}</h1>
              <p className="details-location">{sendero.ubicacion}</p>
            </div>

            {/* Description */}
            <div className="details-section">
              <h2 className="section-title">Descripción:</h2>
              <div className="section-content">
                <p>{sendero.descripcion}</p>
              </div>
            </div>

            {/* Special Benefits */}
            <div className="details-section">
              <h2 className="section-title">Beneficios Especiales</h2>
              <div className="section-content">
                <ul className="benefits-list">
                  <li>*Grupos de más de 10 personas: 10% de descuento en cada sendero</li>
                  <li>*Niños menores de 12 años: 30% de descuento en senderos</li>
                  <li>*Cada sendero incluye: entrada a los predios, guía de naturaleza especializada, botiquín de primeros auxilios</li>
                  <li>*Traslados no incluidos desde el punto de encuentro hasta el inicio del sendero</li>
                </ul>
              </div>
            </div>

            {/* Duration */}
            <div className="details-section">
              <h2 className="section-title">Duración:</h2>
              <div className="section-content">
                <p>5 min hasta inicio del sendero (2.5 km) 4 horas de caminata aproximadamente (4 km)</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="details-section">
              <h2 className="section-title">Métodos de pago</h2>
              <div className="section-content">
                <div className="payment-methods">
                  <div className="payment-method">Efectivo</div>
                  <div className="payment-method">Transferencia</div>
                  <div className="payment-method">MercadoPago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            {/* Price */}
            <div className="booking-price">
              <div className="price-amount">${sendero.precio.toLocaleString()} UYU</div>
              <div className="price-unit">Por persona</div>
            </div>

            {/* Booking Form */}
            <div className="booking-form">
              {/* Date */}
              <div className="form-group">
                <label className="form-label">Fechas</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Participants */}
              <div className="form-group">
                <label className="form-label">Participantes</label>
                <div className="participants-control">
                  <span>Agregar participantes</span>
                  <div className="participants-buttons">
                    <button 
                      className="participant-btn"
                      onClick={() => handleParticipantsChange(-1)}
                      disabled={participantsCount <= 1}
                    >
                      −
                    </button>
                    <span className="participant-count">{participantsCount}</span>
                    <button 
                      className="participant-btn"
                      onClick={() => handleParticipantsChange(1)}
                      disabled={participantsCount >= sendero.maxParticipantes}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Horario */}
              <div className="form-group">
                <label className="form-label">Horario</label>
                <select className="form-input">
                  <option>Am</option>
                  <option>Pm</option>
                </select>
              </div>
            </div>

            {/* Total */}
            <div className="booking-total">
              <div className="total-row">
                <span className="total-label">${sendero.precio.toLocaleString()} UYU x {participantsCount} asistentes</span>
                <span className="total-amount">${totalPrice.toLocaleString()} uyu</span>
              </div>
              <div className="total-row">
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>Total</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>${totalPrice.toLocaleString()}uyu</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="booking-buttons">
              <button className="btn-primary" onClick={handleBookNow}>
                Reservar Ahora
              </button>
              <button className="btn-secondary" onClick={handleAddToCart}>
                Agregar al carrito
              </button>
            </div>

            {/* Note */}
            <div className="booking-note">
              Puedes agregar esta reserva a tu carrito y volver a pagarla más tarde.
            </div>
          </div>
        </div>

        {/* Related Senderos */}
        {relatedSenderos.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '2rem' }}>
              Senderos relacionados
            </h2>
            <div className="related-grid">
              {relatedSenderos.map((related) => (
                <ActivityCard
                  key={related.id}
                  id={related.id}
                  name={related.nombre}
                  description={related.descripcion}
                  imagenPrincipal={related.imagenPrincipal}
                  totalImagenes={related.totalImagenes}
                  tieneGaleria={related.tieneGaleria}
                  duration={related.duracion}
                  difficulty={related.dificultad as 'Fácil' | 'Moderado' | 'Difícil'}
                  price={related.precio}
                  currency={related.moneda}
                  maxParticipants={related.maxParticipants}
                  includes={related.incluye}
                  onViewDetails={handleRelatedSenderoClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDetails;