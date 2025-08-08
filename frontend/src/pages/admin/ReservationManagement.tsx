import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';

interface Reserva {
  id: number;
  tipoReserva: 'ALOJAMIENTO' | 'SENDERO';
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto?: string;
  numeroPersonas: number;
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  total: number;
  observaciones?: string;
  // Datos específicos según tipo
  habitacion?: {
    id: number;
    numero: string;
    nombre: string;
  };
  sendero?: {
    id: number;
    nombre: string;
    nivelDificultad: string;
  };
  guia?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  turno?: 'MANANA' | 'TARDE';
}

const ReservationManagement: React.FC = () => {
  const { data: reservas = [], loading, error, execute: loadReservas } = useApi<Reserva[]>();
  const { loading: actionLoading, execute: executeAction } = useApi();
  
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'confirm' | 'cancel' | 'edit'>('view');
  const [observacionesAdmin, setObservacionesAdmin] = useState('');
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    busqueda: ''
  });

  useEffect(() => {
    loadReservas('/api/admin/reservas');
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-UY');
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

  const getTipoIcon = (tipo: string) => {
    return tipo === 'ALOJAMIENTO' ? (
      <i className="fas fa-bed text-primary"></i>
    ) : (
      <i className="fas fa-hiking text-success"></i>
    );
  };

  const handleAction = async (reserva: Reserva, action: 'view' | 'confirm' | 'cancel' | 'edit') => {
    setSelectedReserva(reserva);
    setModalAction(action);
    setObservacionesAdmin('');
    setShowModal(true);
  };

  const executeReservaAction = async () => {
    if (!selectedReserva) return;

    try {
      let endpoint = '';
      let method = 'PUT';
      let body: any = {};

      switch (modalAction) {
        case 'confirm':
          endpoint = `/api/admin/reservas/${selectedReserva.id}/confirmar`;
          body = { observacionesAdmin };
          break;
        case 'cancel':
          endpoint = `/api/admin/reservas/${selectedReserva.id}/cancelar`;
          body = { observacionesAdmin };
          break;
        default:
          return;
      }

      await executeAction(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Recargar reservas
      await loadReservas('/api/admin/reservas');
      setShowModal(false);
      setSelectedReserva(null);
      
    } catch (error) {
      console.error('Error ejecutando acción:', error);
    }
  };

  const filtrarReservas = (reservas: Reserva[]) => {
    return reservas.filter(reserva => {
      const matchEstado = !filtros.estado || reserva.estado === filtros.estado;
      const matchTipo = !filtros.tipo || reserva.tipoReserva === filtros.tipo;
      const matchBusqueda = !filtros.busqueda || 
        reserva.nombreContacto.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.emailContacto.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.id.toString().includes(filtros.busqueda);
      
      return matchEstado && matchTipo && matchBusqueda;
    });
  };

  const reservasFiltradas = filtrarReservas(reservas);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-calendar-alt me-2"></i>
          Gestión de Reservas
        </h2>
        <Badge bg="info" className="fs-6">
          {reservasFiltradas.length} reservas
        </Badge>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error al cargar reservas</Alert.Heading>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADA">Confirmada</option>
                  <option value="CANCELADA">Cancelada</option>
                  <option value="COMPLETADA">Completada</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                >
                  <option value="">Todos los tipos</option>
                  <option value="ALOJAMIENTO">Alojamiento</option>
                  <option value="SENDERO">Sendero</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre, email o ID..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  />
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de reservas */}
      <Card>
        <Card.Body>
          {reservasFiltradas.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Cliente</th>
                    <th>Fechas</th>
                    <th>Personas</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasFiltradas.map((reserva) => (
                    <tr key={reserva.id}>
                      <td>#{reserva.id}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {getTipoIcon(reserva.tipoReserva)}
                          <span className="ms-2">
                            {reserva.tipoReserva === 'ALOJAMIENTO' ? 'Alojamiento' : 'Sendero'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{reserva.nombreContacto}</strong>
                          <br />
                          <small className="text-muted">{reserva.emailContacto}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{formatDate(reserva.fechaInicio)}</strong>
                          {reserva.tipoReserva === 'ALOJAMIENTO' && (
                            <>
                              <br />
                              <small className="text-muted">hasta {formatDate(reserva.fechaFin)}</small>
                            </>
                          )}
                          {reserva.turno && (
                            <>
                              <br />
                              <small className="text-muted">
                                {reserva.turno === 'MANANA' ? 'Mañana' : 'Tarde'}
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>{reserva.numeroPersonas}</td>
                      <td>{getEstadoBadge(reserva.estado)}</td>
                      <td className="fw-bold">{formatPrice(reserva.total)}</td>
                      <td>
                        <div className="btn-group-vertical btn-group-sm">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleAction(reserva, 'view')}
                            className="mb-1"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          {reserva.estado === 'PENDIENTE' && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleAction(reserva, 'confirm')}
                                className="mb-1"
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleAction(reserva, 'cancel')}
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="fas fa-search fa-3x mb-3"></i>
              <h5>No se encontraron reservas</h5>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalle/acción */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === 'view' && 'Detalle de Reserva'}
            {modalAction === 'confirm' && 'Confirmar Reserva'}
            {modalAction === 'cancel' && 'Cancelar Reserva'}
            {modalAction === 'edit' && 'Editar Reserva'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {selectedReserva && (
            <div>
              {/* Información básica */}
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Información del Cliente</h6>
                  <p><strong>Nombre:</strong> {selectedReserva.nombreContacto}</p>
                  <p><strong>Email:</strong> {selectedReserva.emailContacto}</p>
                  {selectedReserva.telefonoContacto && (
                    <p><strong>Teléfono:</strong> {selectedReserva.telefonoContacto}</p>
                  )}
                  <p><strong>Personas:</strong> {selectedReserva.numeroPersonas}</p>
                </Col>
                <Col md={6}>
                  <h6>Información de la Reserva</h6>
                  <p><strong>ID:</strong> #{selectedReserva.id}</p>
                  <p><strong>Tipo:</strong> {selectedReserva.tipoReserva}</p>
                  <p><strong>Estado:</strong> {getEstadoBadge(selectedReserva.estado)}</p>
                  <p><strong>Total:</strong> {formatPrice(selectedReserva.total)}</p>
                  <p><strong>Creada:</strong> {formatDateTime(selectedReserva.fechaCreacion)}</p>
                </Col>
              </Row>

              {/* Detalles específicos */}
              <Row className="mb-3">
                <Col md={12}>
                  <h6>Detalles Específicos</h6>
                  {selectedReserva.tipoReserva === 'ALOJAMIENTO' ? (
                    <div>
                      <p><strong>Habitación:</strong> {selectedReserva.habitacion?.numero} - {selectedReserva.habitacion?.nombre}</p>
                      <p><strong>Check-in:</strong> {formatDate(selectedReserva.fechaInicio)}</p>
                      <p><strong>Check-out:</strong> {formatDate(selectedReserva.fechaFin)}</p>
                    </div>
                  ) : (
                    <div>
                      <p><strong>Sendero:</strong> {selectedReserva.sendero?.nombre}</p>
                      <p><strong>Dificultad:</strong> {selectedReserva.sendero?.nivelDificultad}</p>
                      <p><strong>Fecha:</strong> {formatDate(selectedReserva.fechaInicio)}</p>
                      <p><strong>Turno:</strong> {selectedReserva.turno === 'MANANA' ? 'Mañana' : 'Tarde'}</p>
                      {selectedReserva.guia && (
                        <p><strong>Guía:</strong> {selectedReserva.guia.nombre} {selectedReserva.guia.apellido}</p>
                      )}
                    </div>
                  )}
                </Col>
              </Row>

              {/* Observaciones del cliente */}
              {selectedReserva.observaciones && (
                <Row className="mb-3">
                  <Col md={12}>
                    <h6>Observaciones del Cliente</h6>
                    <p className="bg-light p-3 rounded">{selectedReserva.observaciones}</p>
                  </Col>
                </Row>
              )}

              {/* Campo para observaciones del admin en acciones */}
              {(modalAction === 'confirm' || modalAction === 'cancel') && (
                <Row>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>
                        Observaciones {modalAction === 'confirm' ? 'de confirmación' : 'de cancelación'}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={observacionesAdmin}
                        onChange={(e) => setObservacionesAdmin(e.target.value)}
                        placeholder={`Ingresa las observaciones para ${modalAction === 'confirm' ? 'confirmar' : 'cancelar'} la reserva...`}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {modalAction === 'view' ? 'Cerrar' : 'Cancelar'}
          </Button>
          
          {modalAction === 'confirm' && (
            <Button 
              variant="success" 
              onClick={executeReservaAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  Confirmar Reserva
                </>
              )}
            </Button>
          )}
          
          {modalAction === 'cancel' && (
            <Button 
              variant="danger" 
              onClick={executeReservaAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Cancelando...
                </>
              ) : (
                <>
                  <i className="fas fa-times me-2"></i>
                  Cancelar Reserva
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReservationManagement;
