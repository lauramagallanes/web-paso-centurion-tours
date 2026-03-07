import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiService } from '../../services/apiService';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImageGridGallery from '../../components/common/ImageGridGallery';
import LoginRequiredModal from '../../components/common/LoginRequiredModal';
import AddedToCartModal from '../../components/common/AddedToCartModal';
import './RoomDetails.css';

interface RoomDetails {
  id: string;
  numero: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  capacidadMinima: number;
  capacidadMaxima: number;
  cantidadCamasDobles: number;
  cantidadLiteras: number;
  precioPorNoche: number;
  horaLlegada: string;
  horaSalida: string;
  activa: boolean;
  imagenes: Array<{
    id: string;
    url: string;
    descripcion?: string;
  }>;
}

interface RelatedRoom {
  id: string;
  nombre: string;
  numero: string;
  descripcion: string;
  imagenPrincipal: string;
  capacidadMaxima: number;
  precioPorNoche: number;
  totalImagenes: number;
}

const RoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { theme } = useTheme();
  const { state: authState } = useAuth();

  // State
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [relatedRooms, setRelatedRooms] = useState<RelatedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guestsCount, setGuestsCount] = useState(2);
  const [isFavorite, setIsFavorite] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddedModal, setShowAddedModal] = useState(false);

  // Ref to track if booking state was restored from sessionStorage
  const restoredBookingRef = useRef(false);

  // Restore booking state from sessionStorage (after login/signup redirect)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`booking_${id}`);
      if (saved) {
        const data = JSON.parse(saved);
        sessionStorage.removeItem(`booking_${id}`);
        if (data.checkIn) setCheckInDate(new Date(data.checkIn));
        if (data.checkOut) setCheckOutDate(new Date(data.checkOut));
        if (data.guests) setGuestsCount(data.guests);
        restoredBookingRef.current = true;
      }
    } catch { /* ignore */ }
  }, [id]);
  
  // Gallery modal state - REMOVED: Now using ImageGallery component

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load room details - OPTIMIZADO: Llamadas paralelas
  useEffect(() => {
    const loadRoomDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // OPTIMIZACIÓN 1: Hacer llamadas en paralelo donde sea posible
        const [response, imagesResponse] = await Promise.all([
          apiService.getAlojamientoById(id),
          apiService.getAlojamientoImages(id).catch(err => {
            console.error('❌ Error loading images from API:', err);
            return [];
          })
        ]);
        
        if (response.success && response.data) {
          const room = response.data;

          let roomImages: any[] = Array.isArray(imagesResponse) ? imagesResponse : [];

          if (roomImages.length === 0) {
            const imageUrl = room.imagenPrincipalUrl || room.imagenPrincipal || room.urlImagen;
            if (imageUrl) {
              roomImages = [{
                id: 'main',
                url: imageUrl,
                descripcion: 'Imagen principal de la habitación',
                esPrincipal: true
              }];
            }
          }
          
          const transformedRoom: RoomDetails = {
            id: room.id,
            numero: room.numero || room.nombre,
            nombre: room.nombre,
            descripcion: room.descripcion || 'Acogedora habitación en nuestro ecolodge',
            ubicacion: room.ubicacion || 'Paso Centurión, Uruguay',
            capacidadMinima: room.capacidadMinima || 1,
            capacidadMaxima: room.capacidadMaxima || 2,
            cantidadCamasDobles: room.cantidadCamasDobles || 0,
            cantidadLiteras: room.cantidadLiteras || 0,
            precioPorNoche: room.precioPorNoche || room.precioPorPersonaNoche || 0,
            horaLlegada: room.horaLlegada || '14:00',
            horaSalida: room.horaSalida || '10:00',
            activa: room.activa ?? room.activo ?? true,
            imagenes: roomImages.length > 0 ? roomImages.map(img => ({
              id: img.id,
              url: img.url || img.urlImagen,
              descripcion: img.descripcion || 'Imagen de la habitación'
            })) : [{
              id: 'default',
              url: '/placeholder-sendero.svg',
              descripcion: 'Imagen de la habitación'
            }]
          };
          
          setRoom(transformedRoom);
          // Only set default guests if we didn't restore from sessionStorage
          if (!restoredBookingRef.current) {
            setGuestsCount(transformedRoom.capacidadMinima);
          }
          
          // OPTIMIZACIÓN 2: Cargar habitaciones relacionadas después (no bloquea el render principal)
          // Se ejecuta en segundo plano sin await
          loadRelatedRooms();
        } else {
          setError(response.error || 'Error al cargar los detalles');
        }
      } catch (err) {
        console.error('Error loading room details:', err);
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    // OPTIMIZACIÓN 3: Cargar habitaciones relacionadas en segundo plano
    const loadRelatedRooms = async () => {
      try {
        const allRoomsResponse = await apiService.getAlojamientos();
        if (allRoomsResponse.success && Array.isArray(allRoomsResponse.data)) {
          const relatedRooms: RelatedRoom[] = allRoomsResponse.data
            .filter((r: any) => r.id !== id && (r.activa ?? r.activo ?? true))
            .slice(0, 3)
            .map((r: any) => {
              let imagenPrincipal = '/placeholder-sendero.svg';
              
              if (r.imagenPrincipalUrl && r.imagenPrincipalUrl.trim() !== '') {
                imagenPrincipal = r.imagenPrincipalUrl.trim();
              } else if (r.urlImagen && r.urlImagen.trim() !== '') {
                imagenPrincipal = r.urlImagen.trim();
              }
              
              return {
                id: r.id,
                nombre: r.nombre,
                numero: r.numero || r.nombre,
                descripcion: r.descripcion || '',
                imagenPrincipal: imagenPrincipal,
                capacidadMaxima: r.capacidadMaxima || 2,
                precioPorNoche: r.precioPorNoche || r.precioPorPersonaNoche || 0,
                totalImagenes: 0
              };
            });
          
          setRelatedRooms(relatedRooms);
        }
      } catch (relatedError) {
        console.error('Error loading related rooms:', relatedError);
        setRelatedRooms([]);
      }
    };

    loadRoomDetails();
  }, [id]);

  // Load favorite status
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.id === id));
  }, [id]);

  // Load blocked dates for the next 6 months
  useEffect(() => {
    const loadBlockedDates = async () => {
      if (!id) return;
      try {
        const desde = new Date().toISOString().split('T')[0];
        const hasta = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const result = await apiService.getFechasBloqueadas(id, desde, hasta);
        if (Array.isArray(result)) {
          // Convert date strings (YYYY-MM-DD) to Date objects for react-datepicker
          const dates = result.map((dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
          });
          setBlockedDates(dates);
        }
      } catch (err) {
        console.error('Error loading blocked dates:', err);
      }
    };
    loadBlockedDates();
  }, [id]);

  // Handlers
  const handleFavoriteToggle = () => {
    if (!room) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updatedFavorites;
    
    if (isFavorite) {
      updatedFavorites = favorites.filter((fav: any) => fav.id !== room.id);
    } else {
      const favoriteItem = {
        id: room.id,
        type: 'room',
        name: room.nombre,
        description: room.descripcion,
        image: room.imagenes[0]?.url || '/placeholder-sendero.svg',
        price: room.precioPorNoche,
        currency: 'UYU',
        addedAt: new Date().toISOString()
      };
      updatedFavorites = [...favorites, favoriteItem];
    }
    
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleGuestsChange = (change: number) => {
    const newCount = Math.max(room?.capacidadMinima || 1, Math.min(room?.capacidadMaxima || 10, guestsCount + change));
    setGuestsCount(newCount);
  };

  const handleAddToCart = () => {
    if (!room || !checkInDate || !checkOutDate) {
      alert('Por favor selecciona las fechas de entrada y salida');
      return;
    }

    // Check authentication - save booking state before redirecting to login
    if (!authState.isAuthenticated) {
      sessionStorage.setItem(`booking_${id}`, JSON.stringify({
        checkIn: checkInDate?.toISOString(),
        checkOut: checkOutDate?.toISOString(),
        guests: guestsCount,
      }));
      setShowLoginModal(true);
      return;
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      alert('La fecha de salida debe ser posterior a la fecha de entrada');
      return;
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    addItem({
      id: room.id,
      type: 'alojamiento',
      name: room.nombre,
      description: room.descripcion,
      image: room.imagenes[0]?.url || '/placeholder-sendero.svg',
      price: room.precioPorNoche * guestsCount * nights,
      currency: 'UYU',
      checkIn: formatDate(checkInDate),
      checkOut: formatDate(checkOutDate),
      huespedes: guestsCount,
      noches: nights,
    });

    setShowAddedModal(true);
  };

  const handleBookNow = () => {
    handleAddToCart();
  };

  const handleRelatedRoomClick = (roomId: string) => {
    navigate(`/habitaciones/${roomId}`);
  };

  // Gallery handlers removed - ImageGallery handles this internally

  // Calculate nights and total price
  const nights = checkInDate && checkOutDate 
    ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  // Price is per person per night, so multiply by guests and nights
  const totalPrice = room ? room.precioPorNoche * guestsCount * nights : 0;

  if (isLoading) {
    return (
      <div className="room-details-page">
        <div className="details-container">
          <LoadingSpinner size="lg" />
          <p>Cargando detalles de la habitación...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="room-details-page">
        <div className="details-container">
          <h2>Error</h2>
          <p>{error || 'Habitación no encontrada'}</p>
          <button onClick={() => navigate('/alojamientos')}>
            Volver a Alojamientos
          </button>
        </div>
      </div>
    );
  }

  // Gallery images are now handled by ImageGallery component

  return (
    <div 
      className="room-details-page"
      style={{
        ...(theme === 'dark' ? {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          minHeight: '100vh',
          width: '100%',
          margin: 0
        } : {})
      }}
    >
      <div className="details-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb-nav" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          <a href="/">Inicio</a>
          {' > '}
          <a href="/alojamientos">Alojamientos</a>
          {' > '}
          <span>{room.nombre}</span>
        </nav>

        <div className="details-layout">
          {/* Main Content */}
          <div className="details-main-content">
            {/* Image Gallery */}
            <div className="details-image-gallery" style={{ position: 'relative', marginBottom: '2rem' }}>
              {room.imagenes && room.imagenes.length > 0 ? (
                <>
                  <ImageGridGallery
                    images={room.imagenes.map((img, index) => ({
                      id: img.id || `img-${index}`,
                      url: img.url,
                      descripcion: img.descripcion || room.nombre,
                    }))}
                    altText={room.nombre}
                  />
                  {/* Favorite Button */}
                  <button 
                    className={`details-favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={handleFavoriteToggle}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <img 
                    src="/placeholder-sendero.svg" 
                    alt={room.nombre}
                    style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  {/* Favorite Button */}
                  <button 
                    className={`details-favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={handleFavoriteToggle}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Title and Location */}
            <div className="details-header">
              <h1 className="details-title">{room.nombre}</h1>
              <p className="details-location">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {room.ubicacion}
              </p>
            </div>

            {/* Room Info */}
            <div className="details-section">
              <h2 className="section-title">Información de la habitación</h2>
              <div className="section-content">
                <div className="room-info-grid">
                  <div className="room-info-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <div>
                      <strong>Capacidad:</strong> {room.capacidadMinima} - {room.capacidadMaxima} personas
                    </div>
                  </div>
                  <div className="room-info-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v5h1.33L4 19h1l.67-2h12.67l.66 2h1l.67-2H22v-5c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <div>
                      <strong>Camas:</strong> {room.cantidadCamasDobles} doble{room.cantidadCamasDobles !== 1 ? 's' : ''}, {room.cantidadLiteras} litera{room.cantidadLiteras !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="room-info-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <div>
                      <strong>Check-in:</strong> {room.horaLlegada} hrs | <strong>Check-out:</strong> {room.horaSalida} hrs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="details-section">
              <h2 className="section-title">Descripción</h2>
              <div className="section-content">
                <p>{room.descripcion}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="details-section">
              <h2 className="section-title">Comodidades</h2>
              <div className="section-content">
                <ul className="amenities-list">
                  <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>
                    </svg>
                    Baño privado
                  </li>
                  <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    </svg>
                    Ropa de cama y toallas
                  </li>
                  <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16z"/>
                    </svg>
                    Armario/closet
                  </li>
                  <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Vista al campo/bosque
                  </li>
                  <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    </svg>
                    Acceso a áreas comunes
                  </li>
                </ul>
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
              <div className="price-amount">${(room.precioPorNoche ?? 0).toLocaleString()} UYU</div>
              <div className="price-unit">Por noche por persona</div>
            </div>

            {/* Booking Form */}
            <div className="booking-form">
              {/* Check-in Date */}
              <div className="form-group">
                <label className="form-label">Entrada</label>
                <DatePicker
                  selected={checkInDate}
                  onChange={(date: Date | null) => {
                    setCheckInDate(date);
                    // Reset checkout if it's before new checkin
                    if (checkOutDate && date && date >= checkOutDate) {
                      setCheckOutDate(null);
                    }
                  }}
                  excludeDates={blockedDates}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                  className="form-input"
                  calendarClassName="room-datepicker"
                />
              </div>

              {/* Check-out Date */}
              <div className="form-group">
                <label className="form-label">Salida</label>
                <DatePicker
                  selected={checkOutDate}
                  onChange={(date: Date | null) => setCheckOutDate(date)}
                  excludeDates={blockedDates}
                  minDate={checkInDate || new Date()}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                  className="form-input"
                  calendarClassName="room-datepicker"
                />
              </div>

              {/* Guests */}
              <div className="form-group">
                <label className="form-label">Huéspedes</label>
                <div className="participants-control">
                  <span>Cantidad de huéspedes</span>
                  <div className="participants-buttons">
                    <button 
                      className="participant-btn"
                      onClick={() => handleGuestsChange(-1)}
                      disabled={guestsCount <= (room.capacidadMinima || 1)}
                    >
                      −
                    </button>
                    <span className="participant-count">{guestsCount}</span>
                    <button 
                      className="participant-btn"
                      onClick={() => handleGuestsChange(1)}
                      disabled={guestsCount >= room.capacidadMaxima}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="booking-total">
              <div className="total-row">
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>Total</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>${(totalPrice ?? 0).toLocaleString()} UYU</span>
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
              Puedes agregar esta reserva a tu carrito y completar el pago más tarde.
            </div>
          </div>
        </div>

        {/* Related Rooms */}
        {relatedRooms.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '2rem' }}>
              Otras habitaciones
            </h2>
            <div className="related-grid">
              {relatedRooms.map((related) => (
                <div 
                  key={related.id} 
                  className="related-room-card"
                  onClick={() => handleRelatedRoomClick(related.id)}
                >
                  <div className="related-room-image">
                    <img 
                      src={related.imagenPrincipal} 
                      alt={related.nombre}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-sendero.svg';
                      }}
                    />
                  </div>
                  <div className="related-room-content">
                    <h3>{related.nombre}</h3>
                    <p className="related-room-description">{related.descripcion}</p>
                    <div className="related-room-info">
                      <span>Hasta {related.capacidadMaxima} personas</span>
                      <span className="related-room-price">${(related.precioPorNoche ?? 0).toLocaleString()} UYU/noche</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Modal - Now handled by ImageGallery component */}
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnPath={`/alojamientos/${id}`}
      />

      {/* Added to Cart Modal */}
      <AddedToCartModal
        isOpen={showAddedModal}
        onClose={() => setShowAddedModal(false)}
        itemName={room?.nombre || ''}
        itemType="alojamiento"
      />
    </div>
  );
};

export default RoomDetails;

