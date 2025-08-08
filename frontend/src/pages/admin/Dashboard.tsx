import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';

interface DashboardStats {
  totalReservas: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  reservasCanceladas: number;
  habitacionesDisponibles: number;
  senderosMasPopulares: Array<{
    id: number;
    nombre: string;
    totalReservas: number;
  }>;
  ingresosMensuales: number;
  reservasRecientes: Array<{
    id: number;
    tipoReserva: string;
    nombreContacto: string;
    fechaCreacion: string;
    estado: string;
    total: number;
  }>;
}

const Dashboard: React.FC = () => {
  const { data: stats, loading, error, execute: loadStats } = useApi<DashboardStats>();

  useEffect(() => {
    loadStats('/api/admin/dashboard/stats');
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(price);
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
    switch (estado) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'CONFIRMADA':
        return <Badge bg="success">Confirmada</Badge>;
      case 'CANCELADA':
        return <Badge bg="danger">Cancelada</Badge>;
      case 'COMPLETADA':
        return <Badge bg="info">Completada</Badge>;
      default:
        return <Badge bg="secondary">{estado}</Badge>;
    }
  };

  const getTipoReservaBadge = (tipo: string) => {
    return tipo === 'ALOJAMIENTO' ? (
      <Badge bg="primary">
        <i className="fas fa-bed me-1"></i>
        Alojamiento
      </Badge>
    ) : (
      <Badge bg="success">
        <i className="fas fa-hiking me-1"></i>
        Sendero
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error al cargar el dashboard</Alert.Heading>
        {error}
      </Alert>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-tachometer-alt me-2"></i>
          Dashboard Administrativo
        </h2>
        <small className="text-muted">
          Última actualización: {new Date().toLocaleTimeString()}
        </small>
      </div>

      {/* Estadísticas principales */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <div className="stat-icon text-primary mb-2">
                <i className="fas fa-calendar-check fa-2x"></i>
              </div>
              <h3 className="text-primary">{stats?.totalReservas || 0}</h3>
              <p className="text-muted mb-0">Total Reservas</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <div className="stat-icon text-warning mb-2">
                <i className="fas fa-clock fa-2x"></i>
              </div>
              <h3 className="text-warning">{stats?.reservasPendientes || 0}</h3>
              <p className="text-muted mb-0">Pendientes</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <div className="stat-icon text-success mb-2">
                <i className="fas fa-check-circle fa-2x"></i>
              </div>
              <h3 className="text-success">{stats?.reservasConfirmadas || 0}</h3>
              <p className="text-muted mb-0">Confirmadas</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <div className="stat-icon text-info mb-2">
                <i className="fas fa-dollar-sign fa-2x"></i>
              </div>
              <h3 className="text-info">{stats?.ingresosMensuales ? formatPrice(stats.ingresosMensuales) : '$0'}</h3>
              <p className="text-muted mb-0">Ingresos del Mes</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Reservas recientes */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Reservas Recientes
              </h5>
            </Card.Header>
            <Card.Body>
              {stats?.reservasRecientes && stats.reservasRecientes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.reservasRecientes.map((reserva) => (
                        <tr key={reserva.id}>
                          <td>#{reserva.id}</td>
                          <td>{reserva.nombreContacto}</td>
                          <td>{getTipoReservaBadge(reserva.tipoReserva)}</td>
                          <td>{formatDate(reserva.fechaCreacion)}</td>
                          <td>{getEstadoBadge(reserva.estado)}</td>
                          <td className="fw-bold">{formatPrice(reserva.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-inbox fa-3x mb-3"></i>
                  <p>No hay reservas recientes</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Senderos más populares */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-star me-2"></i>
                Senderos Populares
              </h5>
            </Card.Header>
            <Card.Body>
              {stats?.senderosMasPopulares && stats.senderosMasPopulares.length > 0 ? (
                <div>
                  {stats.senderosMasPopulares.map((sendero, index) => (
                    <div key={sendero.id} className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <Badge bg="primary" pill>#{index + 1}</Badge>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0">{sendero.nombre}</h6>
                        <small className="text-muted">{sendero.totalReservas} reservas</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-hiking fa-2x mb-3"></i>
                  <p>Sin datos de senderos</p>
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
                <i className="fas fa-bolt me-2"></i>
                Acciones Rápidas
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-2">
                  <div className="quick-action-card p-3 text-center border rounded h-100">
                    <i className="fas fa-plus-circle fa-2x text-primary mb-2"></i>
                    <h6>Nueva Habitación</h6>
                    <small className="text-muted">Agregar alojamiento</small>
                  </div>
                </Col>
                <Col md={3} className="mb-2">
                  <div className="quick-action-card p-3 text-center border rounded h-100">
                    <i className="fas fa-route fa-2x text-success mb-2"></i>
                    <h6>Nuevo Sendero</h6>
                    <small className="text-muted">Crear excursión</small>
                  </div>
                </Col>
                <Col md={3} className="mb-2">
                  <div className="quick-action-card p-3 text-center border rounded h-100">
                    <i className="fas fa-user-tie fa-2x text-info mb-2"></i>
                    <h6>Nuevo Guía</h6>
                    <small className="text-muted">Registrar guía</small>
                  </div>
                </Col>
                <Col md={3} className="mb-2">
                  <div className="quick-action-card p-3 text-center border rounded h-100">
                    <i className="fas fa-file-export fa-2x text-warning mb-2"></i>
                    <h6>Exportar Datos</h6>
                    <small className="text-muted">Reportes Excel</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
