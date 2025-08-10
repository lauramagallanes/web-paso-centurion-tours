import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { routes } from '../../utils/routes';
import './MyBookings.css';

interface Booking {
  id: string;
  type: 'activity' | 'accommodation';
  name: string;
  description: string;
  image: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  currency: string;
  participants?: number;
  duration?: string;
  checkIn?: string;
  checkOut?: string;
  bookingCode: string;
  contactInfo?: {
    phone: string;
    email: string;
  };
  location?: string;
  notes?: string;
}

const MyBookings: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Sample bookings data
  const sampleBookings: Booking[] = [
    {
      id: 'booking-001',
      type: 'activity',
      name: 'Observación de Aves Matutina',
      description: 'Experiencia de observación de aves con guía especializado.',
      image: '/src/assets/react.svg',
      date: '2025-01-15',
      status: 'confirmed',
      price: 2500,
      currency: 'UYU',
      participants: 2,
      duration: '3-4 horas',
      bookingCode: 'TIN-ACT-001',
      contactInfo: {
        phone: '+598 98394653',
        email: 'reservas@tinambu.com'
      },
      location: 'Sendero del Mirador',
      notes: 'Traer ropa cómoda y protector solar'
    },
    {
      id: 'booking-002',
      type: 'accommodation',
      name: 'Cabaña del Bosque',
      description: 'Acogedora cabaña familiar rodeada de vegetación nativa.',
      image: '/src/assets/react.svg',
      date: '2025-01-20',
      status: 'pending',
      price: 4500,
      currency: 'UYU',
      participants: 4,
      checkIn: '2025-01-20',
      checkOut: '2025-01-22',
      bookingCode: 'TIN-ACC-002',
      contactInfo: {
        phone: '+598 98394653',
        email: 'alojamiento@tinambu.com'
      },
      location: 'Zona Norte',
      notes: 'Check-in a partir de las 15:00'
    }
  ];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setBookings(sampleBookings);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    };

    if (state.isAuthenticated) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [state.isAuthenticated]);

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
    if (filterType !== 'all' && booking.type !== filterType) return false;
    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!state.isAuthenticated) {
    return (
      <div className="bookings-page">
        <div className="container">
          <div className="auth-required">
            <Card variant="nature" size="lg" className="auth-card">
              <CardBody>
                <div className="auth-content">
                  <div className="auth-icon">🔐</div>
                  <h2 className="auth-title">Acceso Requerido</h2>
                  <p className="auth-description">
                    Para ver tus reservas necesitas iniciar sesión en tu cuenta.
                  </p>
                  <div className="auth-actions">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={() => navigate(routes.login)}
                    >
                      Iniciar Sesión
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="bookings-hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Mis Reservas</h1>
              <p className="hero-subtitle">Cargando tus reservas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <section className="bookings-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Mis Reservas</h1>
            <p className="hero-subtitle">
              Gestiona tus experiencias en Tinambú. Aquí encontrarás todas tus 
              reservas de actividades y alojamientos.
            </p>
          </div>
        </div>
      </section>

      <section className="bookings-filters">
        <div className="container">
          <div className="filters-container">
            <div className="filter-group">
              <h3 className="filter-title">Estado</h3>
              <div className="filter-buttons">
                {[
                  { value: 'all', label: 'Todas', icon: '📋' },
                  { value: 'confirmed', label: 'Confirmadas', icon: '✅' },
                  { value: 'pending', label: 'Pendientes', icon: '⏳' }
                ].map(status => (
                  <button
                    key={status.value}
                    className={`filter-button ${filterStatus === status.value ? 'active' : ''}`}
                    onClick={() => setFilterStatus(status.value)}
                  >
                    <span className="filter-icon">{status.icon}</span>
                    <span className="filter-label">{status.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bookings-content">
        <div className="container">
          {sortedBookings.length > 0 ? (
            <div className="bookings-grid">
              {sortedBookings.map((booking) => (
                <Card key={booking.id} variant="booking" size="lg" className="booking-card">
                  <CardHeader>
                    <div className="booking-header">
                      <div className="booking-type">
                        <span className="type-icon">
                          {booking.type === 'activity' ? '🥾' : '🏠'}
                        </span>
                        <span className="type-label">
                          {booking.type === 'activity' ? 'Actividad' : 'Alojamiento'}
                        </span>
                      </div>
                      <div className={`booking-status status-${booking.status}`}>
                        {getStatusText(booking.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardBody>
                    <div className="booking-content">
                      <div className="booking-info">
                        <h3 className="booking-name">{booking.name}</h3>
                        <p className="booking-description">{booking.description}</p>
                        
                        <div className="booking-details">
                          <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <span className="detail-text">
                              {booking.type === 'accommodation' ? 
                                `${formatDate(booking.checkIn!)} - ${formatDate(booking.checkOut!)}` :
                                formatDate(booking.date)
                              }
                            </span>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-icon">💰</span>
                            <span className="detail-text">
                              ${booking.price.toLocaleString()} {booking.currency}
                            </span>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-icon">🔖</span>
                            <span className="detail-text">{booking.bookingCode}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter>
                    <div className="booking-actions">
                      <Button 
                        variant="outline" 
                        size="sm"
                        leftIcon="📞"
                        onClick={() => window.open(`tel:${booking.contactInfo?.phone}`)}
                      >
                        Contactar
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="no-bookings">
              <Card variant="nature" size="lg">
                <CardBody>
                  <div className="no-bookings-content">
                    <div className="no-bookings-icon">📋</div>
                    <h3 className="no-bookings-title">No tienes reservas</h3>
                    <p className="no-bookings-description">
                      Explora nuestras actividades y alojamientos.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(routes.activities)}
                    >
                      Ver Actividades
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyBookings;