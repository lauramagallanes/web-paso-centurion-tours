import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { apiService } from '../../services/apiService';
import { fixArrayEncoding } from '../../utils/encodingFixer';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import SenderoCardV2 from '../../components/common/SenderoCardV2';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImageGridGallery from '../../components/common/ImageGridGallery';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import LoginRequiredModal from '../../components/common/LoginRequiredModal';
import AddedToCartModal from '../../components/common/AddedToCartModal';
import './ActivityDetails.css';

registerLocale('es', es);

const DIA_MAP: Record<string, number> = {
  DOMINGO: 0, LUNES: 1, MARTES: 2, MIERCOLES: 3,
  JUEVES: 4, VIERNES: 5, SABADO: 6,
};

interface SenderoDisponibilidadWindow {
  id: string;
  senderoId: string;
  fechaInicio: string;
  fechaFin: string;
  turno: 'MANANA' | 'TARDE';
  diasSemana: string | null;
  cuposTotal: number;
  activo: boolean;
}

interface SenderoBloqueoPublic {
  id: string;
  senderoId: string;
  fechaInicio: string;
  fechaFin: string;
  turno: 'MANANA' | 'TARDE' | null;
  motivo: string | null;
}

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
  const { state: authState } = useAuth();
  const restoredBookingRef = useRef(false);

  // State
  const [sendero, setSendero] = useState<SenderoDetails | null>(null);
  const [relatedSenderos, setRelatedSenderos] = useState<RelatedSendero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [selectedTurno, setSelectedTurno] = useState<'MANANA' | 'TARDE'>('MANANA');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddedModal, setShowAddedModal] = useState(false);

  // Availability state
  const [availabilityWindows, setAvailabilityWindows] = useState<SenderoDisponibilidadWindow[]>([]);
  const [bloqueos, setBloqueos] = useState<SenderoBloqueoPublic[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<{
    disponible: boolean;
    cuposRestantes: number;
    cuposTotal: number;
    mensajeUsuario?: string;
    alternativas?: Array<{ id: string; nombre: string }>;
  } | null>(null);
  const [checkingDisponibilidad, setCheckingDisponibilidad] = useState(false);
  const [disponibilidadError, setDisponibilidadError] = useState<string | null>(null);
  // Monotonic counter to discard stale availability responses when the user
  // switches fecha/turno faster than the network returns.
  const disponibilidadGenRef = useRef(0);
  

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Restore booking state from sessionStorage after login redirect
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`booking_sendero_${id}`);
      if (saved) {
        const data = JSON.parse(saved);
        sessionStorage.removeItem(`booking_sendero_${id}`);
        if (data.date) {
          const parsed = new Date(data.date);
          if (!isNaN(parsed.getTime())) setSelectedDate(parsed);
        }
        if (data.participants) setParticipantsCount(data.participants);
        if (data.turno === 'MANANA' || data.turno === 'TARDE') setSelectedTurno(data.turno);
        restoredBookingRef.current = true;
      }
    } catch { /* ignore */ }
  }, [id]);

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
            const imagesPromise = apiService.getSenderoImages(sendero.id)
              .then(imagesResponse => Array.isArray(imagesResponse) ? imagesResponse : [])
              .catch(() => [] as any[]);

            loadRelatedSenderos(fixedData);

            let senderoImages = await imagesPromise;

            if (senderoImages.length === 0 && sendero.urlImagen) {
              senderoImages = [{
                id: 'main',
                url: sendero.urlImagen,
                descripcion: 'Imagen principal del sendero',
                esPrincipal: true
              }];
            }
            
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
                url: img.url || img.urlImagen,
                descripcion: img.descripcion || 'Imagen del sendero'
              })) : [{
                id: 'default',
                url: '/placeholder-sendero.svg',
                descripcion: 'Imagen del sendero'
              }]
            };
            
            setSendero(transformedSendero);
          } else {
            setError('Sendero no encontrado');
          }
        } else {
          setError(response.error || 'Error al cargar los detalles');
        }
      } catch {
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    // OPTIMIZACIÓN: Cargar senderos relacionados en segundo plano (no bloquea render principal)
    const loadRelatedSenderos = (allSenderos: any[]) => {
      setTimeout(() => {
        const relatedSenderos: RelatedSendero[] = allSenderos
          .filter((s: any) => s.id !== id)
          .slice(0, 3)
          .map((s: any) => {
            const difficultyMap: Record<string, string> = {
              'FACIL': 'Fácil',
              'MODERADO': 'Moderado', 
              'DIFICIL': 'Difícil'
            };
            
            let imagenPrincipal = '/placeholder-sendero.svg';
            
            if (s.imagenPrincipal && s.imagenPrincipal.trim() !== '') {
              imagenPrincipal = s.imagenPrincipal.trim();
            } else if (s.urlImagen && s.urlImagen.trim() !== '') {
              imagenPrincipal = s.urlImagen.trim();
            }
            
            return {
              id: s.id,
              nombre: s.nombre,
              descripcion: s.descripcion,
              duracion: `${s.duracionHoras}h`,
              dificultad: difficultyMap[s.dificultad] || s.dificultad,
              precio: s.precioPorPersona,
              moneda: 'UYU',
              imagenPrincipal: imagenPrincipal,
              totalImagenes: 0
            };
          });
        
        setRelatedSenderos(relatedSenderos);
      }, 0);
    };

    loadSenderoDetails();
  }, [id]);

  // Load favorite status
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.id === id));
  }, [id]);

  // Load active availability windows for this sendero (used by calendar filterDate)
  useEffect(() => {
    if (!sendero) return;
    const loadWindows = async () => {
      try {
        const res = await apiService.getSenderoDisponibilidades(sendero.id);
        if (res.success && Array.isArray(res.data)) {
          setAvailabilityWindows(res.data.filter(w => w.activo));
        }
      } catch {
        setAvailabilityWindows([]);
      }
    };
    loadWindows();
  }, [sendero]);

  // Load admin-defined date blocks so the calendar can hide them.
  useEffect(() => {
    if (!sendero) return;
    let alive = true;
    apiService.listSenderoBloqueos(sendero.id, false)
      .then(data => { if (alive) setBloqueos(data); })
      .catch(() => { if (alive) setBloqueos([]); });
    return () => { alive = false; };
  }, [sendero]);

  // Convert Date -> "YYYY-MM-DD" using local timezone (avoid UTC drift).
  const dateToIsoLocal = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Returns true if there's an active availability window for date+turno that
  // isn't shadowed by a block for that turno.
  const isWindowMatch = (w: SenderoDisponibilidadWindow, date: Date): boolean => {
    const start = new Date(w.fechaInicio + 'T00:00:00');
    const end = new Date(w.fechaFin + 'T23:59:59');
    if (date < start || date > end) return false;
    if (!w.diasSemana || w.diasSemana.trim() === '') return true;
    const allowedDows = w.diasSemana
      .split(',')
      .map(s => s.trim().toUpperCase())
      .map(s => DIA_MAP[s])
      .filter(d => d !== undefined);
    return allowedDows.length === 0 || allowedDows.includes(date.getDay());
  };

  const isTurnoBlocked = (date: Date, turno: 'MANANA' | 'TARDE'): boolean => {
    return bloqueos.some(b => {
      const start = new Date(b.fechaInicio + 'T00:00:00');
      const end = new Date(b.fechaFin + 'T23:59:59');
      if (date < start || date > end) return false;
      return b.turno === null || b.turno === turno;
    });
  };

  // Disabled in the calendar = no remaining (window AND not blocked) for any turno.
  const isSenderoDateAvailable = (date: Date): boolean => {
    if (availabilityWindows.length === 0) return false;
    const turnos: Array<'MANANA' | 'TARDE'> = ['MANANA', 'TARDE'];
    return turnos.some(t => {
      if (isTurnoBlocked(date, t)) return false;
      return availabilityWindows.some(w => w.turno === t && isWindowMatch(w, date));
    });
  };

  // Check availability whenever date or turno changes.
  // Uses a generation counter to ignore stale responses if the user changes
  // the inputs faster than the network responds.
  useEffect(() => {
    if (!sendero || !selectedDate) {
      setDisponibilidad(null);
      setDisponibilidadError(null);
      setCheckingDisponibilidad(false);
      return;
    }
    const gen = ++disponibilidadGenRef.current;
    setCheckingDisponibilidad(true);
    setDisponibilidad(null);
    setDisponibilidadError(null);

    const checkAvailability = async () => {
      try {
        const fechaStr = dateToIsoLocal(selectedDate);
        const res = await apiService.checkSenderoDisponibilidad(
          sendero.id,
          fechaStr,
          selectedTurno
        );
        if (gen !== disponibilidadGenRef.current) return; // stale
        if (res && res.success && res.data) {
          setDisponibilidad(res.data);
        } else {
          setDisponibilidadError('No se pudo verificar disponibilidad.');
        }
      } catch (err) {
        if (gen !== disponibilidadGenRef.current) return; // stale
        console.error('Error verificando disponibilidad de sendero', err);
        setDisponibilidadError('No se pudo verificar disponibilidad. Intentá de nuevo.');
      } finally {
        if (gen === disponibilidadGenRef.current) {
          setCheckingDisponibilidad(false);
        }
      }
    };
    checkAvailability();
  }, [sendero, selectedDate, selectedTurno]);

  // Re-clamp participants when cuposRestantes shrinks (e.g. user changes date/turno).
  // When cuposRestantes is 0 we still keep the counter at 1 (the UI just blocks booking).
  useEffect(() => {
    if (!sendero || !disponibilidad) return;
    const restantes = Math.max(0, disponibilidad.cuposRestantes ?? 0);
    const effectiveMax = Math.min(sendero.maxParticipantes, restantes);
    if (effectiveMax <= 0) {
      if (participantsCount !== 1) setParticipantsCount(1);
      return;
    }
    if (participantsCount > effectiveMax) {
      setParticipantsCount(effectiveMax);
    }
  }, [disponibilidad, sendero, participantsCount]);

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

  // Effective participant cap.
  // Rules:
  //  - If the sendero isn't loaded yet, cap is 0 (block everything).
  //  - If there's no selected date, fall back to the sendero's capacidad.
  //  - If we're waiting for availability or the fetch failed, freeze the cap at
  //    the current count so the user cannot pass a potentially unsafe value.
  //  - Otherwise, cap = min(capacidadMaximaGrupo, cuposRestantes).
  const cupoMaximo = (() => {
    if (!sendero) return 0;
    if (!selectedDate) return sendero.maxParticipantes;
    if (checkingDisponibilidad || disponibilidadError || !disponibilidad) {
      return participantsCount;
    }
    const restantes = Math.max(0, disponibilidad.cuposRestantes ?? 0);
    return Math.min(sendero.maxParticipantes, restantes);
  })();
  const sinCuposParaFechaTurno =
    !!selectedDate && !!disponibilidad && !disponibilidadError && (
      !disponibilidad.disponible ||
      (disponibilidad.cuposRestantes ?? 0) <= 0
    );

  const handleParticipantsChange = (change: number) => {
    if (cupoMaximo <= 0 && change > 0) return;
    const upper = Math.max(1, cupoMaximo);
    const newCount = Math.max(1, Math.min(upper, participantsCount + change));
    setParticipantsCount(newCount);
  };

  const handleAddToCart = () => {
    if (!sendero) return;

    if (!authState.isAuthenticated) {
      sessionStorage.setItem(`booking_sendero_${id}`, JSON.stringify({
        date: selectedDate ? dateToIsoLocal(selectedDate) : null,
        participants: participantsCount,
        turno: selectedTurno,
      }));
      setShowLoginModal(true);
      return;
    }

    const defaultDate = dateToIsoLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const fechaReserva = selectedDate ? dateToIsoLocal(selectedDate) : defaultDate;

    addItem({
      id: sendero.id,
      type: 'sendero',
      name: sendero.nombre,
      description: sendero.descripcion,
      image: sendero.imagenes[0]?.url || '/placeholder-sendero.svg',
      price: totalPrice,
      currency: sendero.moneda,
      fecha: fechaReserva,
      personas: participantsCount,
      turno: selectedTurno,
      duracion: sendero.duracion,
    });

    setShowAddedModal(true);
  };

  const handleBookNow = () => {
    if (!sendero) return;

    if (!authState.isAuthenticated) {
      sessionStorage.setItem(`booking_sendero_${id}`, JSON.stringify({
        date: selectedDate ? dateToIsoLocal(selectedDate) : null,
        participants: participantsCount,
        turno: selectedTurno,
      }));
      setShowLoginModal(true);
      return;
    }

    const defaultDate = dateToIsoLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const fechaReserva = selectedDate ? dateToIsoLocal(selectedDate) : defaultDate;

    addItem({
      id: sendero.id,
      type: 'sendero',
      name: sendero.nombre,
      description: sendero.descripcion,
      image: sendero.imagenes[0]?.url || '/placeholder-sendero.svg',
      price: totalPrice,
      currency: sendero.moneda,
      fecha: fechaReserva,
      personas: participantsCount,
      turno: selectedTurno,
      duracion: sendero.duracion,
    });

    navigate('/checkout');
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

  // Prepare images for ImageGallery
  const galleryImages = sendero.imagenes.map((img, index) => ({
    id: img.id || `img-${index}`,
    url: img.url,
    descripcion: img.descripcion || sendero.nombre,
    orden: index,
    esPrincipal: index === 0,
  }));

  return (
    <div className="activity-details-page">
      <div className="details-container">
        <Breadcrumbs
          items={[
            { label: 'Inicio', path: '/' },
            { label: 'Actividades', path: '/actividades' },
            { label: sendero.nombre, path: `/actividades/${id}` },
          ]}
          separator="chevron"
          showHome={false}
        />

        <div className="details-layout">
          {/* Main Content */}
          <div className="details-main-content">
            {/* Image Gallery */}
            <div className="details-image-gallery">
              {galleryImages.length > 0 ? (
                <ImageGridGallery
                  images={galleryImages}
                  altText={sendero.nombre}
                />
              ) : (
                <img 
                  src="/placeholder-sendero.svg" 
                  alt={sendero.nombre}
                />
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
              <h2 className="section-title">Información complementaria</h2>
              <div className="section-content">
                <ul className="benefits-list">
                  <li>Grupos de más de 10 personas: 10% de descuento en cada sendero</li>
                  <li>Niños menores de 12 años: 30% de descuento en senderos</li>
                  <li>Cada sendero incluye: entrada a los predios, guía de naturaleza especializada, botiquín de primeros auxilios</li>
                  <li>Traslados no incluidos desde el punto de encuentro hasta el inicio del sendero</li>
                </ul>
              </div>
            </div>

            {/* Duration */}
            <div className="details-section">
              <h2 className="section-title">Duración:</h2>
              <div className="section-content">
                <p>{sendero.duracion} aproximadamente</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="details-section">
              <h2 className="section-title">Métodos de pago</h2>
              <div className="section-content">
                <div className="payment-methods">
                  <div className="payment-method">Tarjeta de crédito o débito</div>
                  <div className="payment-method">Efectivo</div>
                  <div className="payment-method">Transferencia</div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            {/* Price */}
            <div className="booking-price">
              <div className="price-amount">${(sendero.precio ?? 0).toLocaleString()} UYU</div>
              <div className="price-unit">Por persona</div>
            </div>

            {/* Booking Form */}
            <div className="booking-form">
              {/* Date */}
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => setSelectedDate(date)}
                  filterDate={isSenderoDateAvailable}
                  minDate={new Date()}
                  dateFormat="EEE dd/MM/yyyy"
                  locale="es"
                  placeholderText="Seleccionar fecha"
                  className="form-input"
                  calendarClassName="room-datepicker"
                />
              </div>

              {/* Horario */}
              <div className="form-group">
                <label className="form-label">Horario</label>
                <select
                  className="form-input"
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value as 'MANANA' | 'TARDE')}
                >
                  <option value="MANANA">Mañana</option>
                  <option value="TARDE">Tarde</option>
                </select>
              </div>

              {/* Cupos / Availability feedback (visible antes de tocar el +) */}
              {selectedDate && (
                <div className="form-group">
                  {checkingDisponibilidad ? (
                    <p className="avail-checking">Verificando disponibilidad…</p>
                  ) : disponibilidadError ? (
                    <p className="avail-error">{disponibilidadError}</p>
                  ) : disponibilidad ? (
                    disponibilidad.disponible && (disponibilidad.cuposRestantes ?? 0) > 0 ? (
                      <p className="avail-ok">
                        Cupos disponibles: <strong>{disponibilidad.cuposRestantes}</strong>
                        {' de '}{disponibilidad.cuposTotal}
                      </p>
                    ) : (
                      <div>
                        <p className="avail-error">Sin cupos para esta fecha y horario</p>
                        {disponibilidad.mensajeUsuario && (
                          <p className="avail-message">{disponibilidad.mensajeUsuario}</p>
                        )}
                        {disponibilidad.alternativas && disponibilidad.alternativas.length > 0 && (
                          <div>
                            {disponibilidad.alternativas.map(alt => (
                              <button
                                key={alt.id}
                                className="avail-alt-link"
                                onClick={() => navigate(`/actividades/${alt.id}`)}
                              >
                                → Ver {alt.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ) : null}
                </div>
              )}

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
                    >−</button>
                    <span className="participant-count">{participantsCount}</span>
                    <button
                      className="participant-btn"
                      onClick={() => handleParticipantsChange(1)}
                      disabled={participantsCount >= cupoMaximo || cupoMaximo <= 0 || sinCuposParaFechaTurno}
                    >+</button>
                  </div>
                </div>
                {selectedDate && disponibilidad && !disponibilidadError && cupoMaximo > 0 && participantsCount >= cupoMaximo && !sinCuposParaFechaTurno && (
                  <p className="avail-message">Alcanzaste el máximo de cupos disponibles.</p>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="booking-total">
              <div className="total-row">
                <span className="total-label">${(sendero.precio ?? 0).toLocaleString()} UYU × {participantsCount} asistentes</span>
                <span className="total-amount">${(totalPrice ?? 0).toLocaleString()} UYU</span>
              </div>
              <div className="total-row">
                <span>Total</span>
                <span>${(totalPrice ?? 0).toLocaleString()} UYU</span>
              </div>
            </div>

            {/* Buttons */}
            {(() => {
              // Block booking when:
              //  - fetch is in flight (we don't know yet)
              //  - fetch failed (we can't confirm cupos)
              //  - turno está lleno o la cantidad de participantes supera los cupos restantes
              const bookingDisabled =
                checkingDisponibilidad ||
                !!disponibilidadError ||
                (!!selectedDate && !disponibilidad) ||
                sinCuposParaFechaTurno ||
                (!!disponibilidad && participantsCount > (disponibilidad.cuposRestantes ?? 0));
              return (
                <div className="booking-buttons">
                  <button
                    className="btn-primary"
                    onClick={handleBookNow}
                    disabled={bookingDisabled}
                  >
                    Reservar Ahora
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleAddToCart}
                    disabled={bookingDisabled}
                  >
                    Agregar al carrito
                  </button>
                </div>
              );
            })()}

            {/* Note */}
            <div className="booking-note">
              Puedes agregar esta reserva a tu carrito y volver a pagarla más tarde.
            </div>
          </div>
        </div>

        {/* Related Senderos */}
        {relatedSenderos.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>
              Senderos relacionados
            </h2>
            <div className="related-grid">
              {relatedSenderos.map((related) => (
                <SenderoCardV2
                  key={related.id}
                  id={related.id}
                  nombre={related.nombre}
                  descripcion={related.descripcion}
                  imagenUrl={related.imagenPrincipal || ''} // Convert to simple string
                  duracion={related.duracion}
                  dificultad={related.dificultad as 'Fácil' | 'Moderado' | 'Difícil'}
                  precio={related.precio}
                  moneda={related.moneda}
                  maxParticipants={related.maxParticipantes}
                  onViewDetails={handleRelatedSenderoClick}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnPath={`/actividades/${id}`}
      />

      {/* Added to Cart Modal */}
      <AddedToCartModal
        isOpen={showAddedModal}
        onClose={() => setShowAddedModal(false)}
        itemName={sendero?.nombre || ''}
        itemType="sendero"
      />
    </div>
  );
};

export default ActivityDetails;