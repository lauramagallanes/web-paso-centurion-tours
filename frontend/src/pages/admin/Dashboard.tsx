import React, { useEffect } from 'react';
import { Card, Row, Col, Badge, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useReservasAdmin } from '../../hooks/useAdminApi';
import Icon from '../../components/common/Icon';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { reservas, loading, error, loadReservas } = useReservasAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    loadReservas();
  }, []);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(amount);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Computed stats
  const total = reservas.length;
  const pendientes = reservas.filter(r => r.estado === 'PENDIENTE').length;
  const confirmadas = reservas.filter(r => r.estado === 'CONFIRMADA').length;
  const canceladas = reservas.filter(r => r.estado === 'CANCELADA').length;

  const ingresosMes = reservas
    .filter(r => {
      const d = new Date(r.fechaCreacion);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + (r.montoPagado || 0), 0);

  // Top senderos
  const senderoCounts: Record<string, { nombre: string; count: number }> = {};
  reservas
    .filter(r => r.tipoReserva === 'SENDERO')
    .forEach(r => {
      const nombre = r.sendero?.nombre || r.informacionAdicional?.split('|')[0]?.trim() || 'Sendero';
      if (!senderoCounts[nombre]) senderoCounts[nombre] = { nombre, count: 0 };
      senderoCounts[nombre].count++;
    });
  const topSenderos = Object.values(senderoCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Recent reservations (last 5)
  const recientes = [...reservas].slice(0, 5);

  // Próximas reservaciones (próximos 7 días)
  const in7days = new Date(now);
  in7days.setDate(now.getDate() + 7);
  const proximas = reservas
    .filter(r => {
      const f = new Date(r.fechaReserva);
      return f >= now && f <= in7days && (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE');
    })
    .sort((a, b) => new Date(a.fechaReserva).getTime() - new Date(b.fechaReserva).getTime())
    .slice(0, 5);

  const getEstadoBadge = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'CONFIRMADA': return <Badge bg="success">Confirmada</Badge>;
      case 'PENDIENTE': return <Badge bg="warning" text="dark">Pendiente</Badge>;
      case 'CANCELADA': return <Badge bg="danger">Cancelada</Badge>;
      case 'COMPLETADA': return <Badge bg="info">Completada</Badge>;
      default: return <Badge bg="secondary">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><Icon name="home" size="md" className="me-2" />Dashboard Administrativo</h2>
          <p className="text-muted mb-0">Resumen de la actividad del sistema</p>
        </div>
        <Button variant="outline-primary" onClick={loadReservas} disabled={loading}>
          <Icon name="refresh" size="sm" className="me-2" />Actualizar
        </Button>
      </div>

      {error && <Alert variant="warning" className="mb-4">No se pudo cargar datos completos: {error}</Alert>}

      {/* Métricas principales */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="py-4">
              <div className="display-4 fw-bold text-primary mb-1">{total}</div>
              <div className="text-muted fw-semibold">Total Reservas</div>
              <small className="text-muted">Todas las reservas</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="py-4">
              <div className="display-4 fw-bold text-warning mb-1">{pendientes}</div>
              <div className="text-muted fw-semibold">Pendientes</div>
              <small className="text-muted">Requieren atención</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="py-4">
              <div className="display-4 fw-bold text-success mb-1">{confirmadas}</div>
              <div className="text-muted fw-semibold">Confirmadas</div>
              <small className="text-muted">Listas para ejecutar</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body className="py-4">
              <div className="fs-3 fw-bold text-info mb-1">{formatPrice(ingresosMes)}</div>
              <div className="text-muted fw-semibold">Ingresos del Mes</div>
              <small className="text-muted">Total cobrado este mes</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alertas */}
      {pendientes > 0 && (
        <Alert variant="warning" className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <strong>⚠ Atención:</strong> Tenés <strong>{pendientes}</strong> reserva{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de confirmación.
          </div>
          <Button variant="outline-warning" size="sm" onClick={() => navigate('/admin/reservations')}>
            Ver pendientes
          </Button>
        </Alert>
      )}

      <Row className="g-3 mb-4">
        {/* Próximas reservas */}
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0"><Icon name="calendar" size="sm" className="me-2" />Próximos 7 días</h5>
              <Button variant="outline-primary" size="sm" onClick={() => navigate('/admin/calendar')}>
                Ver calendario
              </Button>
            </Card.Header>
            <Card.Body>
              {proximas.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {proximas.map(r => (
                    <div key={r.id} className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                      <div>
                        <div className="fw-semibold">{r.nombreCliente}</div>
                        <small className="text-muted">
                          {r.tipoReserva === 'SENDERO'
                            ? (r.sendero?.nombre || r.informacionAdicional?.split('|')[0]?.trim() || 'Sendero')
                            : (r.habitacion?.nombre || 'Alojamiento')}
                          {' · '}{new Date(r.fechaReserva + 'T12:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })}
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={r.tipoReserva === 'SENDERO' ? 'success' : 'primary'}>
                          {r.tipoReserva === 'SENDERO' ? '🥾' : '🏠'} {r.cantidadPersonas}p
                        </Badge>
                        {getEstadoBadge(r.estado)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <Icon name="calendar" size="lg" className="mb-2" />
                  <p className="mb-0">No hay reservas en los próximos 7 días</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Senderos más populares */}
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0"><Icon name="hiking" size="sm" className="me-2" />Senderos Más Populares</h5>
              <small className="text-muted">{reservas.filter(r => r.tipoReserva === 'SENDERO').length} reservas totales</small>
            </Card.Header>
            <Card.Body>
              {topSenderos.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {topSenderos.map((s, i) => (
                    <div key={s.nombre} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={i === 0 ? 'warning' : i === 1 ? 'secondary' : 'light'} text={i < 2 ? 'dark' : 'dark'}>
                          #{i + 1}
                        </Badge>
                        <span>{s.nombre}</span>
                      </div>
                      <Badge bg="info">{s.count} reserva{s.count !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <Icon name="hiking" size="lg" className="mb-2" />
                  <p className="mb-0">No hay senderos con reservas aún</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        {/* Reservas recientes */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0"><Icon name="calendar" size="sm" className="me-2" />Reservas Recientes</h5>
              <Button variant="outline-primary" size="sm" onClick={() => navigate('/admin/reservations')}>
                Ver todas
              </Button>
            </Card.Header>
            <Card.Body>
              {recientes.length > 0 ? (
                <Table hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.nombreCliente}</strong></td>
                        <td>
                          <Badge bg={r.tipoReserva === 'SENDERO' ? 'success' : 'primary'}>
                            {r.tipoReserva === 'SENDERO' ? '🥾 Sendero' : '🏠 Alojamiento'}
                          </Badge>
                        </td>
                        <td>{formatPrice(r.precioTotal)}</td>
                        <td>{getEstadoBadge(r.estado)}</td>
                        <td><small className="text-muted">{formatDateTime(r.fechaCreacion)}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-4">
                  <p className="mb-0">No hay reservas registradas aún</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Resumen por tipo */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent border-bottom">
              <h5 className="mb-0">Resumen por Tipo</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span>🥾 Senderos</span>
                  <strong>{reservas.filter(r => r.tipoReserva === 'SENDERO').length}</strong>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: total > 0 ? `${(reservas.filter(r => r.tipoReserva === 'SENDERO').length / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span>🏠 Alojamiento</span>
                  <strong>{reservas.filter(r => r.tipoReserva === 'ALOJAMIENTO').length}</strong>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: total > 0 ? `${(reservas.filter(r => r.tipoReserva === 'ALOJAMIENTO').length / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <hr />
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span className="text-warning fw-semibold">● Pendientes</span>
                  <strong>{pendientes}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-success fw-semibold">● Confirmadas</span>
                  <strong>{confirmadas}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-danger fw-semibold">● Canceladas</span>
                  <strong>{canceladas}</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Acciones rápidas */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h6 className="mb-3 text-muted">Acciones Rápidas</h6>
          <Row className="g-2">
            {[
              { label: 'Calendario', icon: '📅', path: '/admin/calendar', variant: 'outline-dark' },
              { label: 'Reservas', icon: '📋', path: '/admin/reservations', variant: 'outline-primary' },
              { label: 'Senderos', icon: '🥾', path: '/admin/trails', variant: 'outline-success' },
              { label: 'Habitaciones', icon: '🏠', path: '/admin/rooms', variant: 'outline-info' },
              { label: 'Guías', icon: '👤', path: '/admin/guides', variant: 'outline-secondary' },
            ].map(a => (
              <Col key={a.path} xs={6} md={4} lg={2}>
                <div className="d-grid">
                  <Button variant={a.variant as any} size="sm" onClick={() => navigate(a.path)}>
                    {a.icon} {a.label}
                  </Button>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
