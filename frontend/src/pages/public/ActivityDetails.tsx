import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { imageStorageService } from '../../services/imageStorageService';
import { fixArrayEncoding } from '../../utils/encodingFixer';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import Button from '../../components/common/Button';
import FavoriteButton from '../../components/common/FavoriteButton';
import ImageGallery from '../../components/common/ImageGallery';
import DatePickerModal from '../../components/common/DatePickerModal';
import ParticipantsSelector from '../../components/common/ParticipantsSelector';
import ActivityCard from '../../components/common/ActivityCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ActivityDetails.css';

interface SenderoDetails {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  dificultad: 'Fácil' | 'Moderado' | 'Difícil';
  precio: number;
  moneda: string;
  maxParticipantes: number;
  incluye: string[];
  ubicacion?: string;
  imagenPrincipal: string;
  imagenes: Array<{
    id: string;
    url: string;
    descripcion?: string;
    orden: number;
    esPrincipal: boolean;
  }>;
  tieneGaleria: boolean;
  totalImagenes: number;
  beneficios?: string[];
  ofertas?: Array<{
    titulo: string;
    descripcion: string;
    descuento?: number;
    validoHasta?: string;
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

interface PriceCalculation {
  precioBase: number;
  precioAdultos: number;
  precioNinos: number;
  descuentoNinos: number;
  descuentoGrupo: number;
  precioTotal: number;
  montoSeña: number;
  saldoRestante: number;
  detalleDescuentos?: string[];
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isParticipantsSelectorOpen, setIsParticipantsSelectorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  
  // Gallery state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Load sendero details
  useEffect(() => {
    const loadSenderoDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Since backend doesn't have getSenderoById, get all senderos and filter
        const response = await apiService.getSenderos();
        if (response.success) {
          // Fix encoding issues first
          const fixedData = fixArrayEncoding(response.data);
          console.log('🔧 Fixed encoding data for activity details:', fixedData);
          
          const sendero = fixedData.find((s: any) => s.id === id);
          if (sendero) {
            // Transform to SenderoDetails format with REAL data
            const imageStats = imageStorageService.getSenderoImageStats(sendero.id);
            const senderoImages = imageStorageService.getSenderoImages(sendero.id);
            
            // Map difficulty levels
            const difficultyMap: Record<string, string> = {
              'FACIL': 'Fácil',
              'MODERADO': 'Moderado', 
              'DIFICIL': 'Difícil',
              'EXPERTO': 'Experto'
            };
            
            console.log(`📄 ActivityDetails for ${sendero.nombre}:`, {
              realImages: senderoImages.length,
              principalImage: imageStats.principal?.url,
              realPrice: sendero.precioPorPersona,
              realDuration: sendero.duracionHoras
            });
            
            const transformedSendero: SenderoDetails = {
              id: sendero.id,
              nombre: sendero.nombre,
              descripcion: sendero.descripcion,
              duracion: `${sendero.duracionHoras} hora${sendero.duracionHoras !== 1 ? 's' : ''}`,
              dificultad: difficultyMap[sendero.nivelDificultad] as any || 'Moderado',
              precio: sendero.precioPorPersona,
              moneda: 'UYU',
              maxParticipantes: sendero.capacidadMaximaGrupo,
              incluye: [
                'Guía especializado',
                'Equipo básico de seguridad',
                'Refrigerio natural'
              ],
              ubicacion: 'Paso Centurión',
              imagenPrincipal: imageStats.principal?.url || sendero.imagenPrincipal || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
              imagenes: senderoImages.map(img => ({
                id: img.id,
                url: img.url,
                descripcion: img.descripcion,
                orden: img.orden,
                esPrincipal: img.esPrincipal
              })),
              tieneGaleria: imageStats.total > 1,
              totalImagenes: imageStats.total,
              beneficios: [
                'Experiencia única en naturaleza',
                'Guía experto local',
                'Grupos pequeños personalizados'
              ]
            };
            
            setSendero(transformedSendero);
            
            // Load related senderos (other senderos)
            const relatedSenderos: RelatedSendero[] = fixedData
              .filter((s: any) => s.id !== id)
              .slice(0, 3)
              .map((s: any) => {
                const relatedImageStats = imageStorageService.getSenderoImageStats(s.id);
                return {
                  id: s.id,
                  nombre: s.nombre,
                  descripcion: s.descripcion,
                  imagenPrincipal: relatedImageStats.principal?.url || s.imagenPrincipal || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
                  duracion: `${s.duracionHoras} hora${s.duracionHoras !== 1 ? 's' : ''}`,
                  dificultad: difficultyMap[s.nivelDificultad] || 'Moderado',
                  precio: s.precioPorPersona,
                  moneda: 'UYU'
                };
              });
            
            setRelatedSenderos(relatedSenderos);
          } else {
            setError('Sendero no encontrado');
          }
        } else {
          setError(response.error || 'Error al cargar los detalles del sendero');
        }
      } catch (err) {
        console.error('Error loading sendero details:', err);
        setError('Error de conexión al cargar los detalles');
      } finally {
        setIsLoading(false);
      }
    };

    loadSenderoDetails();
  }, [id]);

  // Calculate price when participants change
  const calculatePrice = useCallback(async () => {
    if (!id || adults === 0) {
      setPriceCalculation(null);
      return;
    }

    setIsCalculatingPrice(true);
    try {
      const response = await apiService.calculateSenderoPriceLive(id, adults, children);
      if (response.success) {
        setPriceCalculation(response.data);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [id, adults, children]);

  useEffect(() => {
    const timer = setTimeout(calculatePrice, 300);
    return () => clearTimeout(timer);
  }, [calculatePrice]);

  // Handlers
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const handleParticipantsSelect = (newAdults: number, newChildren: number, newPriceData?: any) => {
    setAdults(newAdults);
    setChildren(newChildren);
    if (newPriceData) {
      setPriceCalculation(newPriceData);
    }
    setIsParticipantsSelectorOpen(false);
  };

  const handleBookNow = () => {
    if (!sendero) return;
    
    // Navigate to booking page with selected options
    const bookingData = {
      senderoId: id,
      date: selectedDate?.toISOString(),
      adults,
      children,
      price: priceCalculation?.precioTotal || sendero.precio,
    };
    
    navigate('/reservar', { state: { bookingData, sendero } });
  };

  const handleAddToCart = () => {
    if (!sendero) return;

    addItem({
      id: sendero.id,
      type: 'activity',
      name: sendero.nombre,
      description: sendero.descripcion,
      image: sendero.imagenPrincipal,
      price: priceCalculation?.precioTotal || sendero.precio,
      currency: sendero.moneda,
      date: selectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participants: adults + children,
      duration: sendero.duracion
    });

    // Show confirmation or navigate to cart
    navigate('/carrito');
  };

  const handleRelatedSenderoClick = (senderoId: string) => {
    navigate(`/actividades/${senderoId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'var(--success-color)';
      case 'Moderado':
        return 'var(--warning-color)';
      case 'Difícil':
        return 'var(--error-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  if (isLoading) {
    return (
      <div className="activity-details-loading">
        <LoadingSpinner size="lg" />
        <p>Cargando detalles del sendero...</p>
      </div>
    );
  }

  if (error || !sendero) {
    return (
      <div className="activity-details-error">
        <div className="error-content">
          <h2>Error</h2>
          <p>{error || 'Sendero no encontrado'}</p>
          <Button onClick={() => navigate('/actividades')}>
            Volver a Actividades
          </Button>
        </div>
      </div>
    );
  }

  const totalParticipants = adults + children;
  const canBook = selectedDate && totalParticipants > 0 && adults > 0;

  return (
    <div className="activity-details">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb" aria-label="breadcrumb">
        <ol>
          <li><a href="/">Inicio</a></li>
          <li><a href="/actividades">Actividades</a></li>
          <li className="active" aria-current="page">{sendero.nombre}</li>
        </ol>
      </nav>

      {/* Hero Section with Image Gallery */}
      <section className="hero-section">
        <div className="hero-content">
{/* Removed redundant gallery - now using main image in info section */}
          
          {/* Main Info Section - Title, Location, Price */}
          <div className="main-info-section">
            {/* Hero Image */}
            <div className="hero-image-main">
              <img 
                src={sendero.imagenes?.[0]?.url || sendero.imagenPrincipal || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'} 
                alt={sendero.nombre}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop';
                }}
              />
            </div>

            {/* Title, Location and Meta */}
            <div className="main-info-header">
              <div className="title-and-location">
                <h1 className="activity-title">{sendero.nombre}</h1>
                <p className="activity-location">
                  {sendero.ubicacion || 'Paso Centurión, Uruguay - Ruta 7 km 439'}
                </p>
              </div>
              
              <div className="activity-meta">
                <div className="meta-item">
                  <span className="meta-label">Duración:</span>
                  <span>{sendero.duracion}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Dificultad:</span>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(sendero.dificultad) }}
                  >
                    {sendero.dificultad}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Max. participantes:</span>
                  <span>{sendero.maxParticipantes}</span>
                </div>
                <div className="meta-item">
                  <FavoriteButton
                    item={{
                      id: sendero.id,
                      type: 'activity',
                      name: sendero.nombre,
                      description: sendero.descripcion,
                      image: sendero.imagenPrincipal,
                      price: sendero.precio,
                      currency: sendero.moneda,
                      difficulty: sendero.dificultad,
                      duration: sendero.duracion,
                      maxParticipants: sendero.maxParticipantes,
                      includes: sendero.incluye
                    }}
                    variant="large"
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* Price Display */}
            <div className="price-display-main">
              <span className="price-amount-main">
                {sendero.moneda === 'UYU' ? '$' : sendero.moneda} 
                {sendero.precio.toLocaleString()}
              </span>
              <span className="price-unit-main">
                {sendero.moneda} Por persona
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="content-container">
        <div className="content-grid">
          {/* Left Column - Details */}
          <div className="details-column">
            {/* Description */}
            <section className="details-section">
              <h2>Descripción</h2>
              <p className="description">{sendero.descripcion}</p>
            </section>

            {/* What's Included */}
            {sendero.incluye && sendero.incluye.length > 0 && (
              <section className="details-section">
                <h2>¿Qué incluye?</h2>
                <ul className="includes-list">
                  {sendero.incluye.map((item, index) => (
                    <li key={index}>
                      <span className="check-icon">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Beneficios Especiales */}
            <section className="details-section">
              <h2>Beneficios Especiales</h2>
              <ul className="benefits-list">
                <li>
                  <span className="benefit-icon">👥</span>
                  *Grupos de más de 10 personas: 10% de descuento en cada sendero
                </li>
                <li>
                  <span className="benefit-icon">👶</span>
                  *Niños menores de 12 años: 30% de descuento en senderos
                </li>
                <li>
                  <span className="benefit-icon">🎒</span>
                  *Cada sendero incluye: entrada a los predios, guía de naturaleza especializada, botiquín de primeros auxilios
                </li>
                <li>
                  <span className="benefit-icon">🚫</span>
                  *Traslados no incluidos desde el punto de encuentro hasta el inicio del sendero
                </li>
              </ul>
            </section>

            {/* Duración */}
            <section className="details-section">
              <h2>Duración:</h2>
              <p className="duration-text">
                5 min hasta inicio del sendero (2.5 km) 4 horas de caminata aproximadamente (4 km)
              </p>
            </section>

            {/* Métodos de pago */}
            <section className="details-section">
              <h2>Métodos de pago</h2>
              <ul className="payment-methods">
                <li>Efectivo</li>
                <li>Transferencia</li>
                <li>MercadoPago</li>
              </ul>
            </section>

            {/* Special Offers */}
            {sendero.ofertas && sendero.ofertas.length > 0 && (
              <section className="details-section">
                <h2>Ofertas Especiales</h2>
                <div className="offers-grid">
                  {sendero.ofertas.map((oferta, index) => (
                    <div key={index} className="offer-card">
                      <h3>{oferta.titulo}</h3>
                      <p>{oferta.descripcion}</p>
                      {oferta.descuento && (
                        <div className="offer-discount">
                          {oferta.descuento}% de descuento
                        </div>
                      )}
                      {oferta.validoHasta && (
                        <div className="offer-expires">
                          Válido hasta: {new Date(oferta.validoHasta).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Booking */}
          <div className="booking-column">
            <div className="booking-card">
              <div className="booking-header">
                <div className="price-display">
                  <span className="currency">{sendero.moneda}</span>
                  <span className="amount">
                    {priceCalculation ? 
                      priceCalculation.precioTotal.toLocaleString() : 
                      sendero.precio.toLocaleString()
                    }
                  </span>
                  <span className="unit">por persona</span>
                </div>
                {isCalculatingPrice && (
                  <div className="price-loading">
                    <span>Calculando...</span>
                  </div>
                )}
              </div>

              <div className="booking-form">
                {/* Date Selection */}
                <div className="form-field">
                  <label>Fecha</label>
                  <button 
                    className="date-picker-trigger"
                    onClick={() => setIsDatePickerOpen(true)}
                  >
                    {selectedDate ? 
                      selectedDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 
                      'Seleccionar fecha'
                    }
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                    </svg>
                  </button>
                </div>

                {/* Participants Selection */}
                <div className="form-field">
                  <label>Participantes</label>
                  <button 
                    className="participants-trigger"
                    onClick={() => setIsParticipantsSelectorOpen(true)}
                  >
                    <div className="participants-summary">
                      <span>{totalParticipants} persona{totalParticipants !== 1 ? 's' : ''}</span>
                      <small>
                        {adults} adulto{adults !== 1 ? 's' : ''}
                        {children > 0 && `, ${children} niño${children !== 1 ? 's' : ''}`}
                      </small>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16,4C18.11,4 19.81,5.69 19.81,7.8C19.81,9.91 18.11,11.6 16,11.6C13.89,11.6 12.2,9.91 12.2,7.8C12.2,5.69 13.89,4 16,4M16,13.4C18.67,13.4 24,14.73 24,17.4V20H8V17.4C8,14.73 13.33,13.4 16,13.4M8,4C10.11,4 11.8,5.69 11.8,7.8C11.8,9.91 10.11,11.6 8,11.6C5.89,11.6 4.2,9.91 4.2,7.8C4.2,5.69 5.89,4 8,4M8,13.4C10.67,13.4 16,14.73 16,17.4V20H0V17.4C0,14.73 5.33,13.4 8,13.4Z" />
                    </svg>
                  </button>
                </div>

                {/* Price Breakdown */}
                {priceCalculation && (
                  <div className="price-breakdown">
                    <div className="breakdown-header">
                      <h4>Detalle de precio</h4>
                    </div>
                    <div className="breakdown-items">
                      {adults > 0 && (
                        <div className="breakdown-item">
                          <span>{adults} Adulto{adults > 1 ? 's' : ''}</span>
                          <span>${priceCalculation.precioAdultos.toLocaleString()}</span>
                        </div>
                      )}
                      {children > 0 && (
                        <div className="breakdown-item">
                          <span>{children} Niño{children > 1 ? 's' : ''} (30% desc.)</span>
                          <span>${priceCalculation.precioNinos.toLocaleString()}</span>
                        </div>
                      )}
                      {priceCalculation.descuentoGrupo > 0 && (
                        <div className="breakdown-item discount">
                          <span>Descuento de grupo</span>
                          <span>-${((priceCalculation.precioAdultos + priceCalculation.precioNinos) * priceCalculation.descuentoGrupo / 100).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="breakdown-total">
                      <span>Total</span>
                      <span>${priceCalculation.precioTotal.toLocaleString()}</span>
                    </div>
                    {priceCalculation.montoSeña > 0 && (
                      <div className="deposit-info">
                        <div className="deposit-item">
                          <span>Seña requerida (30%)</span>
                          <span>${priceCalculation.montoSeña.toLocaleString()}</span>
                        </div>
                        <div className="deposit-item">
                          <span>Saldo restante</span>
                          <span>${priceCalculation.saldoRestante.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Actions */}
                <div className="booking-actions">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={!canBook}
                    className="add-to-cart-btn"
                  >
                    Agregar al carrito
                  </Button>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleBookNow}
                    disabled={!canBook}
                    className="book-now-btn"
                  >
                    Reservar ahora
                  </Button>
                </div>

                {!canBook && (
                  <div className="booking-requirements">
                    {!selectedDate && <p>• Selecciona una fecha</p>}
                    {adults === 0 && <p>• Se requiere al menos 1 adulto</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Senderos */}
      {relatedSenderos.length > 0 && (
        <section className="related-section">
          <div className="container">
            <h2>Senderos relacionados</h2>
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
                  maxParticipants={related.maxParticipantes}
                  includes={related.incluye}
                  onViewDetails={handleRelatedSenderoClick}
                  onBook={() => navigate(`/actividades/${related.id}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        minDate={new Date()}
      />

      <ParticipantsSelector
        isOpen={isParticipantsSelectorOpen}
        onClose={() => setIsParticipantsSelectorOpen(false)}
        onSave={handleParticipantsSelect}
        senderoId={id!}
        initialAdults={adults}
        initialChildren={children}
        maxParticipants={sendero.maxParticipantes}
        showPriceCalculation={true}
      />

      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <ImageGallery
          images={sendero.imagenes}
          senderoName={sendero.nombre}
          onClose={() => setIsGalleryOpen(false)}
          showCompact={false}
          isModal={true}
        />
      )}
    </div>
  );
};

export default ActivityDetails;
