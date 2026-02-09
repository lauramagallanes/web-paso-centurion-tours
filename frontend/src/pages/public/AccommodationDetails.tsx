import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Users, 
  Bed, 
  Clock, 
  MapPin, 
  Calendar,
  Plus,
  Minus,
  ShoppingCart
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import ImageGridGallery from '../../components/common/ImageGridGallery';
import { alojamientoApiService, AlojamientoResponse } from '../../services/alojamientoApiService';
import { useTheme } from '../../contexts/ThemeContext';
import './AccommodationDetails.css';

const AccommodationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [accommodation, setAccommodation] = useState<AlojamientoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Booking states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (id) {
      loadAccommodation();
      loadFavoriteStatus();
    }
  }, [id]);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      calculatePrice();
      checkAvailability();
    }
  }, [checkInDate, checkOutDate, guestCount]);

  const loadAccommodation = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await alojamientoApiService.getAlojamientoById(id);
      setAccommodation(data);
    } catch (err) {
      console.error('Error loading accommodation:', err);
      setError('Error al cargar el alojamiento. Por favor, intenta de nuevo.');
      // Show mock data for development
      setAccommodation(getMockAccommodation());
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteStatus = () => {
    const savedFavorites = localStorage.getItem('accommodation-favorites');
    if (savedFavorites && id) {
      const favorites = JSON.parse(savedFavorites);
      setIsFavorite(favorites.includes(id));
    }
  };

  const calculatePrice = () => {
    if (!accommodation || !checkInDate || !checkOutDate) return;
    
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const total = accommodation.precioPorNoche * nights;
    setTotalPrice(total);
  };

  const checkAvailability = async () => {
    if (!accommodation || !checkInDate || !checkOutDate) return;
    
    setCheckingAvailability(true);
    try {
      const available = await alojamientoApiService.checkAvailability(
        accommodation.id,
        checkInDate.toISOString().split('T')[0],
        checkOutDate.toISOString().split('T')[0]
      );
      setIsAvailable(available);
    } catch (err) {
      console.error('Error checking availability:', err);
      setIsAvailable(false);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!id) return;
    
    const savedFavorites = localStorage.getItem('accommodation-favorites');
    const favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    if (isFavorite) {
      const newFavorites = favorites.filter((fav: string) => fav !== id);
      localStorage.setItem('accommodation-favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(id);
      localStorage.setItem('accommodation-favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const handleDateRangeSelect = (checkIn: Date, checkOut: Date) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
  };

  const handleGuestChange = (increment: boolean) => {
    if (!accommodation) return;
    
    const newCount = increment ? guestCount + 1 : guestCount - 1;
    if (newCount >= accommodation.capacidadMinima && newCount <= accommodation.capacidadMaxima) {
      setGuestCount(newCount);
    }
  };

  const handleReserveNow = () => {
    if (!accommodation || !checkInDate || !checkOutDate) return;

    const noches = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    navigate('/checkout', {
      state: {
        type: 'alojamiento',
        id: accommodation.id,
        nombre: accommodation.nombre,
        precio: totalPrice,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        fechaInicio: checkInDate.toISOString().split('T')[0],
        fechaFin: checkOutDate.toISOString().split('T')[0],
        huespedes: guestCount,
        noches: noches,
      }
    });
  };

  const handleAddToCart = () => {
    if (!accommodation || !checkInDate || !checkOutDate) return;

    // Navigate to checkout (can also add to cart context if needed)
    handleReserveNow();
  };

  const getMockAccommodation = (): AlojamientoResponse => ({
    id: id || '1',
    nombre: 'Habitación Surucuá',
    descripcion: 'Habitación rústica con vista al bosque, ideal para parejas o familias pequeñas. Cuenta con una cama matrimonial cómoda y una litera para niños. El espacio está decorado con materiales naturales que se integran perfectamente con el entorno selvático. Disfruta de la tranquilidad y los sonidos de la naturaleza desde tu habitación.',
    ubicacion: 'Paso Centurión, Uruguay - Ruta 7 km 439',
    capacidadMinima: 2,
    capacidadMaxima: 4,
    cantidadCamasDobles: 1,
    cantidadLiteras: 1,
    horaLlegada: '15:00',
    horaSalida: '11:00',
    precioPorNoche: 3000,
    imagenPrincipal: '',
    imagenes: [],
    totalImagenes: 0,
    tieneGaleria: false,
    activo: true,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  });

  const formatDates = () => {
    if (!checkInDate || !checkOutDate) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    
    const checkInStr = checkInDate.toLocaleDateString('es-ES', options);
    const checkOutStr = checkOutDate.toLocaleDateString('es-ES', options);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return `${checkInStr} - ${checkOutStr} (${nights} noche${nights > 1 ? 's' : ''})`;
  };

  if (loading) {
    return (
      <div className="accommodation-details-page">
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="accommodation-details-page">
        <div className="container">
          <div className="error-state">
            <h2>Alojamiento no encontrado</h2>
            <p>{error || 'El alojamiento que buscas no existe o no está disponible.'}</p>
            <Link to="/alojamientos" className="back-link">
              <ArrowLeft size={20} />
              Volver a alojamientos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="accommodation-details-page" 
      style={{ 
        width: '100%', 
        margin: 0,
        ...(theme === 'dark' ? {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          minHeight: '100vh'
        } : {})
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="details-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link> / 
            <Link to="/alojamientos">Alojamientos</Link> / 
            <span>{accommodation.nombre}</span>
          </div>
          
          <div className="title-section">
            <div className="title-left">
              <h1>{accommodation.nombre}</h1>
              <div className="location-info">
                <MapPin size={16} />
                <span>{accommodation.ubicacion}</span>
              </div>
            </div>
            
            <button 
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
            >
              <Heart className={`heart-icon ${isFavorite ? 'filled' : ''}`} />
              {isFavorite ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="details-content">
          {/* Left Column - Images and Info */}
          <div className="details-left">
            {/* Image Gallery */}
            {(() => {
              // Build images array: combine imagenes array with imagenPrincipal if needed
              const allImages = [];
              
              // Add imagenPrincipal as first image if it exists and is not already in imagenes
              if (accommodation.imagenPrincipal) {
                const principalExists = accommodation.imagenes?.some(img => img.url === accommodation.imagenPrincipal);
                if (!principalExists) {
                  allImages.push({
                    id: 'principal',
                    url: accommodation.imagenPrincipal,
                    descripcion: accommodation.nombre,
                  });
                }
              }
              
              // Add all images from imagenes array
              if (accommodation.imagenes && accommodation.imagenes.length > 0) {
                accommodation.imagenes.forEach((img, index) => {
                  allImages.push({
                    id: img.id || `img-${index}`,
                    url: img.url,
                    descripcion: img.descripcion || accommodation.nombre,
                  });
                });
              }
              
              // If we have any images, use ImageGridGallery
              if (allImages.length > 0) {
                return (
                  <ImageGridGallery
                    images={allImages}
                    altText={accommodation.nombre}
                  />
                );
              }
              
              // Fallback to placeholder
              return (
                <div className="hero-image">
                  <img
                    src="/placeholder-sendero.svg"
                    alt={accommodation.nombre}
                  />
                </div>
              );
            })()}

            {/* Accommodation Info */}
            <div className="accommodation-info">
              <div className="info-section">
                <h2>Descripción</h2>
                <p>{accommodation.descripcion}</p>
              </div>

              <div className="info-section">
                <h2>Características</h2>
                <div className="features-grid">
                  <div className="feature-item">
                    <Users className="feature-icon" />
                    <div>
                      <strong>Capacidad</strong>
                      <span>{accommodation.capacidadMinima}-{accommodation.capacidadMaxima} personas</span>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <Bed className="feature-icon" />
                    <div>
                      <strong>Camas</strong>
                      <span>
                        {accommodation.cantidadCamasDobles > 0 && `${accommodation.cantidadCamasDobles} cama${accommodation.cantidadCamasDobles > 1 ? 's' : ''} doble${accommodation.cantidadCamasDobles > 1 ? 's' : ''}`}
                        {accommodation.cantidadCamasDobles > 0 && accommodation.cantidadLiteras > 0 && ', '}
                        {accommodation.cantidadLiteras > 0 && `${accommodation.cantidadLiteras} litera${accommodation.cantidadLiteras > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <Clock className="feature-icon" />
                    <div>
                      <strong>Horarios</strong>
                      <span>Check-in: {accommodation.horaLlegada} - Check-out: {accommodation.horaSalida}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="details-right">
            <div className="booking-card">
              <div className="booking-header">
                <div className="price-info">
                  <span className="price">${accommodation.precioPorNoche.toLocaleString('es-UY')} UYU</span>
                  <span className="period">por noche</span>
                </div>
              </div>

              <div className="booking-form">
                {/* Date Selection */}
                <div className="form-group">
                  <label>Fechas</label>
                  <button 
                    className="date-selector"
                    onClick={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} />
                    <span>
                      {checkInDate && checkOutDate 
                        ? formatDates()
                        : 'Seleccionar fechas'
                      }
                    </span>
                  </button>
                </div>

                {/* Guest Selection */}
                <div className="form-group">
                  <label>Huéspedes</label>
                  <div className="guest-selector">
                    <button 
                      className="guest-btn"
                      onClick={() => handleGuestChange(false)}
                      disabled={guestCount <= accommodation.capacidadMinima}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="guest-count">
                      {guestCount} huésped{guestCount > 1 ? 'es' : ''}
                    </span>
                    <button 
                      className="guest-btn"
                      onClick={() => handleGuestChange(true)}
                      disabled={guestCount >= accommodation.capacidadMaxima}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                {checkInDate && checkOutDate && (
                  <div className="price-breakdown">
                    <div className="price-line">
                      <span>
                        ${accommodation.precioPorNoche.toLocaleString('es-UY')} UYU x {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))} noche{Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}
                      </span>
                      <span>${totalPrice.toLocaleString('es-UY')} UYU</span>
                    </div>
                    <div className="price-total">
                      <span>Total</span>
                      <span>${totalPrice.toLocaleString('es-UY')} UYU</span>
                    </div>
                  </div>
                )}

                {/* Availability Status */}
                {checkInDate && checkOutDate && (
                  <div className={`availability-status ${isAvailable === true ? 'available' : isAvailable === false ? 'unavailable' : 'checking'}`}>
                    {checkingAvailability ? (
                      <span>Verificando disponibilidad...</span>
                    ) : isAvailable === true ? (
                      <span>✅ Disponible para estas fechas</span>
                    ) : isAvailable === false ? (
                      <span>❌ No disponible para estas fechas</span>
                    ) : null}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="booking-actions">
                  <button 
                    className="reserve-btn"
                    onClick={handleReserveNow}
                    disabled={!checkInDate || !checkOutDate || isAvailable === false || checkingAvailability}
                  >
                    Reservar Ahora
                  </button>
                  
                  <button 
                    className="cart-btn"
                    onClick={handleAddToCart}
                    disabled={!checkInDate || !checkOutDate || isAvailable === false || checkingAvailability}
                  >
                    <ShoppingCart size={20} />
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Picker Modal */}
      <DateRangePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateRangeSelect={handleDateRangeSelect}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
      />
    </div>
  );
};

export default AccommodationDetails;
