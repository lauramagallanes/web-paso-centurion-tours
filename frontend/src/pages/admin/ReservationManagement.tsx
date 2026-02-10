import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Spinner, Row, Col, InputGroup, Dropdown } from 'react-bootstrap';
import { useReservasAdmin } from '../../hooks/useAdminApi';
import Icon from '../../components/common/Icon';
import BackendError from '../../components/common/BackendError';

interface Reserva {
  id: string;
  codigo: string;
  tipoReserva: 'ALOJAMIENTO' | 'SENDERO';
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente?: string;
  cantidadPersonas: number;
  fechaReserva: string;
  fechaCreacion: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  precioTotal: number;
  observaciones?: string;
  observacionesAdmin?: string;
  // Payment tracking fields
  estadoPago?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO';
  montoPagado?: number;
  saldoPendiente?: number;
  metodoPago?: string;
  placetoPayRequestId?: number;
  // Datos específicos según tipo
  habitacion?: {
    id: string;
    nombre: string;
  };
  sendero?: {
    id: string;
    nombre: string;
    nivelDificultad: string;
  };
  guia?: {
    id: string;
    nombre: string;
  };
  turno?: 'MANANA' | 'TARDE';
}

const ReservationManagement: React.FC = () => {
  const { 
    data: reservas = [], 
    loading, 
    error, 
    loadReservas,
    confirmarReserva,
    cancelarReserva,
    actualizarEstado,
    actualizarEstadoPago
  } = useReservasAdmin();
  
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'view' | 'confirm' | 'cancel'>('view');
  const [observacionesAdmin, setObservacionesAdmin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    estadoPago: '',
    busqueda: ''
  });

  useEffect(() => {
    loadReservas();
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
    return new Date(dateString).toLocaleString('es-UY', {
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
        return <Badge bg="warning" className="d-flex align-items-center gap-1">
          <Icon name="clock" size="xs" />
          Pendiente
        </Badge>;
      case 'CONFIRMADA':
        return <Badge bg="success" className="d-flex align-items-center gap-1">
          <Icon name="check" size="xs" />
          Confirmada
        </Badge>;
      case 'CANCELADA':
        return <Badge bg="danger" className="d-flex align-items-center gap-1">
          <Icon name="close" size="xs" />
          Cancelada
        </Badge>;
      case 'COMPLETADA':
        return <Badge bg="info" className="d-flex align-items-center gap-1">
          <Icon name="check-circle" size="xs" />
          Completada
        </Badge>;
      default:
        return <Badge bg="secondary">{estado}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'ALOJAMIENTO' ? (
      <Icon name="bed" size="sm" color="primary" />
    ) : (
      <Icon name="hiking" size="sm" color="success" />
    );
  };

  const getEstadoPagoBadge = (estadoPago?: string) => {
    switch (estadoPago) {
      case 'PENDIENTE':
        return <Badge bg="warning" className="d-flex align-items-center gap-1">
          <Icon name="clock" size="xs" />
          Pago Pendiente
        </Badge>;
      case 'PARCIAL':
        return <Badge bg="info" className="d-flex align-items-center gap-1">
          <Icon name="info" size="xs" />
          Pago Parcial
        </Badge>;
      case 'COMPLETO':
        return <Badge bg="success" className="d-flex align-items-center gap-1">
          <Icon name="check-circle" size="xs" />
          Pagado
        </Badge>;
      default:
        return <Badge bg="secondary">Sin pago</Badge>;
    }
  };

  const getTurnoText = (turno?: string) => {
    switch (turno) {
      case 'MANANA':
        return 'Mañana';
      case 'TARDE':
        return 'Tarde';
      default:
        return 'N/A';
    }
  };

  const handleAction = (reserva: Reserva, action: 'view' | 'confirm' | 'cancel') => {
    setSelectedReserva(reserva);
    setModalAction(action);
    setObservacionesAdmin(reserva.observacionesAdmin || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReserva(null);
    setObservacionesAdmin('');
    setActionLoading(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedReserva) return;

    setActionLoading(true);
    try {
      if (modalAction === 'confirm') {
        await confirmarReserva(selectedReserva.id, observacionesAdmin, selectedReserva.tipoReserva);
      } else if (modalAction === 'cancel') {
        await cancelarReserva(selectedReserva.id, observacionesAdmin, selectedReserva.tipoReserva);
      }
      
      // Recargar reservas
      await loadReservas();
      handleCloseModal();
    } catch (error) {
      console.error(`Error ${modalAction === 'confirm' ? 'confirmando' : 'cancelando'} reserva:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const filtrarReservas = () => {
    return reservas.filter(reserva => {
      const matchEstado = !filtros.estado || reserva.estado === filtros.estado;
      const matchTipo = !filtros.tipo || reserva.tipoReserva === filtros.tipo;
      const matchEstadoPago = !filtros.estadoPago || reserva.estadoPago === filtros.estadoPago;
      const matchBusqueda = !filtros.busqueda || 
        reserva.nombreCliente?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.emailCliente?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.codigo?.toLowerCase().includes(filtros.busqueda.toLowerCase());
      
      return matchEstado && matchTipo && matchEstadoPago && matchBusqueda;
    });
  };

  const reservasFiltradas = filtrarReservas();
  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === 'PENDIENTE').length,
    confirmadas: reservas.filter(r => r.estado === 'CONFIRMADA').length,
    canceladas: reservas.filter(r => r.estado === 'CANCELADA').length
  };

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

  // If backend not available, continue with empty reservas array

  return (
    <div className="reservation-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <Icon name="calendar" size="md" className="me-2" />
            Gestión de Reservas
          </h2>
          <p className="text-muted mb-0">Administra todas las reservas del sistema</p>
        </div>
        <Button variant="outline-primary" onClick={loadReservas} disabled={loading}>
          <Icon name="refresh" size="sm" className="me-2" />
          Actualizar
        </Button>
      </div>


      {/* Estadísticas rápidas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{stats.total}</h3>
              <small className="text-muted">Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{stats.pendientes}</h3>
              <small className="text-muted">Pendientes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{stats.confirmadas}</h3>
              <small className="text-muted">Confirmadas</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{stats.canceladas}</h3>
              <small className="text-muted">Canceladas</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADA">Confirmada</option>
                  <option value="CANCELADA">Cancelada</option>
                  <option value="COMPLETADA">Completada</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                >
                  <option value="">Todos los tipos</option>
                  <option value="SENDERO">Senderos</option>
                  <option value="ALOJAMIENTO">Alojamiento</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Estado Pago</Form.Label>
                <Form.Select
                  value={filtros.estadoPago}
                  onChange={(e) => setFiltros({...filtros, estadoPago: e.target.value})}
                >
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="PARCIAL">Parcial</option>
                  <option value="COMPLETO">Completo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre, email o código..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                  />
                  <Button variant="outline-secondary" onClick={() => setFiltros({...filtros, busqueda: ''})}>
                    <Icon name="close" size="sm" />
                  </Button>
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
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Personas</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Creada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasFiltradas.map((reserva) => (
                    <tr key={reserva.id}>
                      <td>
                        <code className="bg-light p-1 rounded">{reserva.codigo}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{reserva.nombreCliente}</strong>
                          <br />
                          <small className="text-muted">{reserva.emailCliente}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getTipoIcon(reserva.tipoReserva)}
                          <div>
                            <div>{reserva.tipoReserva}</div>
                            {reserva.sendero && (
                              <small className="text-muted">{reserva.sendero.nombre}</small>
                            )}
                            {reserva.habitacion && (
                              <small className="text-muted">{reserva.habitacion.nombre}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {formatDate(reserva.fechaReserva)}
                          {reserva.turno && (
                            <>
                              <br />
                              <small className="text-muted">{getTurnoText(reserva.turno)}</small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">{reserva.cantidadPersonas}</Badge>
                      </td>
                      <td>
                        <strong>{formatPrice(reserva.precioTotal)}</strong>
                      </td>
                      <td>
                        {getEstadoBadge(reserva.estado)}
                      </td>
                      <td>
                        {getEstadoPagoBadge(reserva.estadoPago)}
                        {reserva.montoPagado != null && reserva.montoPagado > 0 && (
                          <small className="d-block text-muted mt-1">
                            {formatPrice(reserva.montoPagado)} pagado
                          </small>
                        )}
                      </td>
                      <td>
                        <small>{formatDateTime(reserva.fechaCreacion)}</small>
                      </td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <Icon name="menu" size="sm" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                            <Dropdown.Item onClick={() => handleAction(reserva, 'view')}>
                              <Icon name="search" size="sm" className="me-2" />
                              Ver Detalles
                            </Dropdown.Item>
                            {reserva.estado === 'PENDIENTE' && (
                              <>
                                <Dropdown.Item 
                                  onClick={() => handleAction(reserva, 'confirm')}
                                  className="text-success"
                                >
                                  <Icon name="check" size="sm" className="me-2" />
                                  Confirmar
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleAction(reserva, 'cancel')}
                                  className="text-danger"
                                >
                                  <Icon name="close" size="sm" className="me-2" />
                                  Cancelar
                                </Dropdown.Item>
                              </>
                            )}
                            {reserva.estado === 'CONFIRMADA' && (
                              <>
                                <Dropdown.Item 
                                  onClick={async () => {
                                    if (confirm('¿Marcar esta reserva como completada?')) {
                                      await actualizarEstado(reserva.id, 'COMPLETADA', reserva.tipoReserva);
                                      await loadReservas();
                                    }
                                  }}
                                  className="text-info"
                                >
                                  <Icon name="check-circle" size="sm" className="me-2" />
                                  Completar
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleAction(reserva, 'cancel')}
                                  className="text-danger"
                                >
                                  <Icon name="close" size="sm" className="me-2" />
                                  Cancelar
                                </Dropdown.Item>
                              </>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <Icon name="calendar" size="3xl" className="mb-3" />
              <h5>No hay reservas</h5>
              <p>
                {filtros.estado || filtros.tipo || filtros.busqueda 
                  ? 'No se encontraron reservas con los filtros aplicados'
                  : 'Aún no hay reservas en el sistema'
                }
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para ver/confirmar/cancelar reserva */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === 'view' && 'Detalles de Reserva'}
            {modalAction === 'confirm' && 'Confirmar Reserva'}
            {modalAction === 'cancel' && 'Cancelar Reserva'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {selectedReserva && (
            <>
              <Row>
                <Col md={6}>
                  <h6>Información del Cliente</h6>
                  <p><strong>Nombre:</strong> {selectedReserva.nombreCliente}</p>
                  <p><strong>Email:</strong> {selectedReserva.emailCliente}</p>
                  {selectedReserva.telefonoCliente && (
                    <p><strong>Teléfono:</strong> {selectedReserva.telefonoCliente}</p>
                  )}
                </Col>
                <Col md={6}>
                  <h6>Información de Reserva</h6>
                  <p><strong>Código:</strong> <code>{selectedReserva.codigo}</code></p>
                  <p><strong>Estado:</strong> {getEstadoBadge(selectedReserva.estado)}</p>
                  <p><strong>Creada:</strong> {formatDateTime(selectedReserva.fechaCreacion)}</p>
                </Col>
              </Row>

              <hr />

              <Row>
                <Col md={6}>
                  <h6>Detalles del Servicio</h6>
                  <p><strong>Tipo:</strong> {selectedReserva.tipoReserva}</p>
                  {selectedReserva.sendero && (
                    <>
                      <p><strong>Sendero:</strong> {selectedReserva.sendero.nombre}</p>
                      <p><strong>Dificultad:</strong> {selectedReserva.sendero.nivelDificultad}</p>
                      {selectedReserva.turno && (
                        <p><strong>Turno:</strong> {getTurnoText(selectedReserva.turno)}</p>
                      )}
                    </>
                  )}
                  {selectedReserva.habitacion && (
                    <p><strong>Habitación:</strong> {selectedReserva.habitacion.nombre}</p>
                  )}
                  {selectedReserva.guia && (
                    <p><strong>Guía:</strong> {selectedReserva.guia.nombre}</p>
                  )}
                </Col>
                <Col md={6}>
                  <h6>Detalles de la Reserva</h6>
                  <p><strong>Fecha:</strong> {formatDate(selectedReserva.fechaReserva)}</p>
                  <p><strong>Personas:</strong> {selectedReserva.cantidadPersonas}</p>
                  <p><strong>Total:</strong> {formatPrice(selectedReserva.precioTotal)}</p>
                </Col>
              </Row>

              <hr />
              <Row>
                <Col md={12}>
                  <h6>Información de Pago</h6>
                  <div className="d-flex gap-3 mb-2">
                    <div>
                      <strong>Estado Pago:</strong> {getEstadoPagoBadge(selectedReserva.estadoPago)}
                    </div>
                    {selectedReserva.tipoPago && (
                      <div>
                        <strong>Tipo:</strong>{' '}
                        <Badge bg={selectedReserva.tipoPago === 'SENA' ? 'warning' : 'primary'}>
                          {selectedReserva.tipoPago === 'SENA' ? 'Seña (30%)' : 'Pago Total'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p><strong>Total:</strong> {formatPrice(selectedReserva.precioTotal)}</p>
                  <p><strong>Monto Pagado:</strong> {formatPrice(selectedReserva.montoPagado || 0)}</p>
                  {(selectedReserva.saldoPendiente != null && selectedReserva.saldoPendiente > 0) && (
                    <p><strong>Saldo Pendiente:</strong> <span className="text-danger">{formatPrice(selectedReserva.saldoPendiente)}</span></p>
                  )}
                  {selectedReserva.metodoPago && (
                    <p><strong>Método de Pago:</strong> {selectedReserva.metodoPago}</p>
                  )}
                  {selectedReserva.placetoPayRequestId && (
                    <p><strong>PlacetoPay ID:</strong> <code>{selectedReserva.placetoPayRequestId}</code></p>
                  )}
                  
                  {/* Admin: Edit payment status */}
                  {selectedReserva.tipoReserva === 'ALOJAMIENTO' && modalAction === 'view' && selectedReserva.estadoPago !== 'COMPLETO' && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <strong>Actualizar estado de pago:</strong>
                      <div className="d-flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={async () => {
                            const sena = selectedReserva.precioTotal * 0.3;
                            await actualizarEstadoPago(selectedReserva.id, 'PARCIAL', sena);
                            await loadReservas();
                            handleCloseModal();
                          }}
                          disabled={selectedReserva.estadoPago === 'PARCIAL'}
                        >
                          Seña Pagada
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={async () => {
                            await actualizarEstadoPago(selectedReserva.id, 'COMPLETO', selectedReserva.precioTotal);
                            await loadReservas();
                            handleCloseModal();
                          }}
                        >
                          Pago Completo
                        </Button>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>

              {selectedReserva.observaciones && (
                <>
                  <hr />
                  <h6>Observaciones del Cliente</h6>
                  <p className="bg-light p-3 rounded">{selectedReserva.observaciones}</p>
                </>
              )}

              {selectedReserva.observacionesAdmin && (
                <>
                  <hr />
                  <h6>Observaciones Administrativas</h6>
                  <p className="bg-warning bg-opacity-10 p-3 rounded">{selectedReserva.observacionesAdmin}</p>
                </>
              )}

              {(modalAction === 'confirm' || modalAction === 'cancel') && (
                <>
                  <hr />
                  <Form.Group>
                    <Form.Label>
                      Observaciones Administrativas 
                      {modalAction === 'cancel' && <span className="text-danger">*</span>}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={observacionesAdmin}
                      onChange={(e) => setObservacionesAdmin(e.target.value)}
                      placeholder={
                        modalAction === 'confirm' 
                          ? "Notas adicionales sobre la confirmación (opcional)..."
                          : "Motivo de la cancelación..."
                      }
                    />
                  </Form.Group>
                </>
              )}
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cerrar
          </Button>
          
          {modalAction === 'confirm' && (
            <Button 
              variant="success" 
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Icon name="check" size="sm" className="me-2" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          )}
          
          {modalAction === 'cancel' && (
            <Button 
              variant="danger" 
              onClick={handleConfirmAction}
              disabled={actionLoading || !observacionesAdmin.trim()}
            >
              {actionLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Icon name="close" size="sm" className="me-2" />
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