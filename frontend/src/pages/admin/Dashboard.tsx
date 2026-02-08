import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';
import { useDashboardStats } from '../../hooks/useAdminApi';
import Icon from '../../components/common/Icon';

interface DashboardStats {
  totalReservas: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  reservasCanceladas: number;
  habitacionesDisponibles: number;
  senderosMasPopulares: Array<{
    id: string;
    nombre: string;
    totalReservas: number;
  }>;
  ingresosMensuales: number;
  reservasRecientes: Array<{
    id: string;
    tipoReserva: string;
    nombreContacto: string;
    fechaCreacion: string;
    estado: string;
    total: number;
  }>;
}

const Dashboard: React.FC = () => {
  const { data: stats, loading, error, execute: loadStats } = useApi<DashboardStats>();
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Cargando estadísticas del dashboard...');
      await loadStats('/dashboard/admin/stats');
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'CONFIRMADA':
        return <Badge bg="success">Confirmada</Badge>;
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'CANCELADA':
        return <Badge bg="danger">Cancelada</Badge>;
      default:
        return <Badge bg="secondary">{estado}</Badge>;
    }
  };

  if (loading && !stats) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // If backend not available or no data, show empty dashboard
  if (error || !stats) {
    const emptyStats = {
      totalReservas: 0,
      reservasPendientes: 0,
      reservasConfirmadas: 0,
      reservasCanceladas: 0,
      habitacionesDisponibles: 0,
      ingresosMensuales: 0,
      senderosMasPopulares: [],
      reservasRecientes: []
    };
    
    // Continue with empty data instead of showing error
    return (
      <div className="dashboard">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>
              <Icon name="home" size="md" className="me-2" />
              Dashboard Administrativo
            </h2>
            <p className="text-muted mb-0">Resumen de la actividad del sistema</p>
          </div>
          <Button 
            variant="outline-primary" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Actualizando...
              </>
            ) : (
              <>
                <Icon name="refresh" size="sm" className="me-2" />
                Actualizar
              </>
            )}
          </Button>
        </div>

        {/* Métricas principales - vacías */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <div className="display-4 text-primary mb-2">0</div>
                <h6 className="card-title text-muted">Total Reservas</h6>
                <small className="text-muted">Todas las reservas</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <div className="display-4 text-warning mb-2">0</div>
                <h6 className="card-title text-muted">Pendientes</h6>
                <small className="text-muted">Por confirmar</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <div className="display-4 text-success mb-2">0</div>
                <h6 className="card-title text-muted">Confirmadas</h6>
                <small className="text-muted">Reservas activas</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <div className="display-4 text-info mb-2">$0</div>
                <h6 className="card-title text-muted">Ingresos del Mes</h6>
                <small className="text-muted">Total facturado</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Senderos más populares - vacío */}
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <Icon name="hiking" size="sm" className="me-2" />
                  <h5 className="mb-0">Senderos Más Populares</h5>
                </div>
                <div className="text-center py-4">
                  <Icon name="hiking" size="lg" className="text-muted mb-3" />
                  <p className="text-muted">No hay senderos con reservas aún</p>
                  <small className="text-muted">Los senderos más populares aparecerán aquí cuando tengas reservas</small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Reservas recientes - vacío */}
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <Icon name="calendar" size="sm" className="me-2" />
                    <h5 className="mb-0">Reservas Recientes</h5>
                  </div>
                </div>
                <div className="text-center py-4">
                  <Icon name="calendar" size="lg" className="text-muted mb-3" />
                  <p className="text-muted">No hay reservas aún</p>
                  <small className="text-muted">Las reservas recientes aparecerán aquí</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <Icon name="home" size="md" className="me-2" />
            Dashboard Administrativo
          </h2>
          <p className="text-muted mb-0">Resumen de la actividad del sistema</p>
        </div>
        <Button 
          variant="outline-primary" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Actualizando...
            </>
          ) : (
            <>
              <Icon name="refresh" size="sm" className="me-2" />
              Actualizar
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error al cargar el dashboard</Alert.Heading>
          {error}
        </Alert>
      )}

      {stats && (
        <>
          {/* Métricas principales */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-primary mb-2">
                    {stats.totalReservas || 0}
                  </div>
                  <h6 className="card-title text-muted">Total Reservas</h6>
                  <small className="text-muted">Todas las reservas</small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-warning mb-2">
                    {stats.reservasPendientes || 0}
                  </div>
                  <h6 className="card-title text-muted">Pendientes</h6>
                  <small className="text-muted">Requieren atención</small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-success mb-2">
                    {stats.reservasConfirmadas || 0}
                  </div>
                  <h6 className="card-title text-muted">Confirmadas</h6>
                  <small className="text-muted">Listas para ejecutar</small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-info mb-2">
                    {formatCurrency(stats.ingresosMensuales || 0)}
                  </div>
                  <h6 className="card-title text-muted">Ingresos Mes</h6>
                  <small className="text-muted">Mes actual</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Senderos más populares */}
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <Icon name="hiking" size="sm" className="me-2" />
                    Senderos Más Populares
                  </h5>
                </Card.Header>
                <Card.Body>
                  {stats.senderosMasPopulares && stats.senderosMasPopulares.length > 0 ? (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Sendero</th>
                            <th className="text-center">Reservas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.senderosMasPopulares.map((sendero, index) => (
                            <tr key={sendero.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Badge bg="primary" className="me-2">#{index + 1}</Badge>
                                  {sendero.nombre}
                                </div>
                              </td>
                              <td className="text-center">
                                <Badge bg="info">{sendero.totalReservas}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <Icon name="hiking" size="lg" className="mb-2" />
                      <p>No hay datos de senderos aún</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Reservas recientes */}
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <Icon name="calendar" size="sm" className="me-2" />
                    Reservas Recientes
                  </h5>
                  <Button variant="outline-primary" size="sm" href="/admin/reservations">
                    Ver todas
                  </Button>
                </Card.Header>
                <Card.Body>
                  {stats.reservasRecientes && stats.reservasRecientes.length > 0 ? (
                    <div className="table-responsive">
                      <Table size="sm">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.reservasRecientes.slice(0, 5).map((reserva) => (
                            <tr key={reserva.id}>
                              <td>
                                <div>
                                  <strong>{reserva.nombreContacto}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {formatCurrency(reserva.total)}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <Badge bg="secondary" className="text-wrap">
                                  {reserva.tipoReserva}
                                </Badge>
                              </td>
                              <td>
                                {getEstadoBadge(reserva.estado)}
                              </td>
                              <td>
                                <small>{formatDate(reserva.fechaCreacion)}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <Icon name="calendar" size="lg" className="mb-2" />
                      <p>No hay reservas recientes</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Acciones rápidas */}
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <Icon name="search" size="sm" className="me-2" />
                    Acciones Rápidas
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <div className="d-grid">
                        <Button variant="success" href="/admin/trails">
                          <Icon name="hiking" size="sm" className="me-2" />
                          Gestionar Senderos
                        </Button>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="d-grid">
                        <Button variant="info" href="/admin/rooms">
                          <Icon name="bed" size="sm" className="me-2" />
                          Gestionar Alojamientos
                        </Button>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="d-grid">
                        <Button variant="warning" href="/admin/reservations">
                          <Icon name="calendar" size="sm" className="me-2" />
                          Ver Reservas
                        </Button>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="d-grid">
                        <Button variant="secondary" href="/admin/guides">
                          <Icon name="user" size="sm" className="me-2" />
                          Gestionar Guías
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alertas y notificaciones */}
          {stats.reservasPendientes > 0 && (
            <Row className="mt-4">
              <Col md={12}>
                <Alert variant="warning" className="d-flex align-items-center">
                  <Icon name="calendar" size="md" className="me-3" />
                  <div>
                    <strong>Atención requerida:</strong> Tienes {stats.reservasPendientes} reserva(s) pendiente(s) de confirmación.
                    <div className="mt-2">
                      <Button variant="outline-warning" size="sm" href="/admin/reservations?filter=pending">
                        Revisar reservas pendientes
                      </Button>
                    </div>
                  </div>
                </Alert>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;