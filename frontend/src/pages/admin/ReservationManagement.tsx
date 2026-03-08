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
  fechaFin?: string;
  fechaCreacion: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  precioTotal: number;
  observaciones?: string;
  observacionesAdmin?: string;
  estadoPago?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' | 'NO_CORRESPONDE';
  montoPagado?: number;
  saldoPendiente?: number;
  metodoPago?: string;
  tipoPago?: string;
  placetoPayRequestId?: number;
  habitacion?: { id: string; nombre: string };
  sendero?: { id: string; nombre: string; nivelDificultad: string };
  guia?: { id: string; nombre: string };
  turno?: 'MANANA' | 'TARDE';
  informacionAdicional?: string;
}

type ModalAction = 'view' | 'confirm' | 'cancel' | 'pago' | 'posponer' | 'estado';

const ReservationManagement: React.FC = () => {
  const {
    data: reservas = [],
    loading,
    error,
    loadReservas,
    confirmarReserva,
    cancelarReserva,
    actualizarEstado,
    actualizarEstadoPago,
    posponerReserva
  } = useReservasAdmin();

  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction>('view');
  const [observacionesAdmin, setObservacionesAdmin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Payment form state
  const [pagoTipo, setPagoTipo] = useState<'PARCIAL' | 'COMPLETO'>('COMPLETO');
  const [pagoMonto, setPagoMonto] = useState<string>('');

  // Postpone form state
  const [posponerFecha, setPosponerFecha] = useState('');
  const [posponerFechaCheckIn, setPosponerFechaCheckIn] = useState('');
  const [posponerFechaCheckOut, setPosponerFechaCheckOut] = useState('');
  const [posponerTurno, setPosponerTurno] = useState('');

  // Estado change
  const [nuevoEstado, setNuevoEstado] = useState('');

  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    estadoPago: '',
    busqueda: ''
  });

  useEffect(() => {
    loadReservas();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-UY');

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge bg="warning" className="d-flex align-items-center gap-1"><Icon name="clock" size="xs" />Pendiente</Badge>;
      case 'CONFIRMADA': return <Badge bg="success" className="d-flex align-items-center gap-1"><Icon name="check" size="xs" />Confirmada</Badge>;
      case 'CANCELADA': return <Badge bg="danger" className="d-flex align-items-center gap-1"><Icon name="close" size="xs" />Cancelada</Badge>;
      case 'COMPLETADA': return <Badge bg="info" className="d-flex align-items-center gap-1"><Icon name="check-circle" size="xs" />Completada</Badge>;
      default: return <Badge bg="secondary">{estado}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) =>
    tipo === 'ALOJAMIENTO'
      ? <Icon name="bed" size="sm" color="primary" />
      : <Icon name="hiking" size="sm" color="success" />;

  const getEstadoPagoBadge = (estadoPago?: string) => {
    switch (estadoPago) {
      case 'PENDIENTE': return <Badge bg="warning" className="d-flex align-items-center gap-1"><Icon name="clock" size="xs" />Pago Pendiente</Badge>;
      case 'PARCIAL': return <Badge bg="info" className="d-flex align-items-center gap-1"><Icon name="info" size="xs" />Pago Parcial</Badge>;
      case 'COMPLETO': return <Badge bg="success" className="d-flex align-items-center gap-1"><Icon name="check-circle" size="xs" />Pagado</Badge>;
      case 'NO_CORRESPONDE': return <Badge bg="danger" className="d-flex align-items-center gap-1"><Icon name="close" size="xs" />Cancelada</Badge>;
      default: return <Badge bg="secondary">Sin pago</Badge>;
    }
  };

  const getTurnoText = (turno?: string) => {
    switch (turno) {
      case 'MANANA': return 'Mañana';
      case 'TARDE': return 'Tarde';
      default: return 'N/A';
    }
  };

  const handleAction = (reserva: Reserva, action: ModalAction) => {
    setSelectedReserva(reserva);
    setModalAction(action);
    setActionError(null);
    setObservacionesAdmin(reserva.observacionesAdmin || '');

    if (action === 'pago') {
      const sena = Math.round(reserva.precioTotal * 0.3);
      const saldo = reserva.saldoPendiente ?? (reserva.precioTotal - (reserva.montoPagado ?? 0));
      if (reserva.estadoPago === 'PARCIAL') {
        // Already has partial, only option is to complete payment
        setPagoTipo('COMPLETO');
        setPagoMonto(String(Math.max(0, saldo)));
      } else {
        // PENDIENTE: default to partial (seña)
        setPagoTipo('PARCIAL');
        setPagoMonto(String(sena));
      }
    }

    if (action === 'posponer') {
      setPosponerFecha(reserva.fechaReserva || '');
      setPosponerFechaCheckIn(reserva.fechaReserva || '');
      setPosponerFechaCheckOut(reserva.fechaFin || '');
      setPosponerTurno(reserva.turno || 'MANANA');
    }

    if (action === 'estado') {
      setNuevoEstado('');
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReserva(null);
    setActionError(null);
    setActionLoading(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedReserva) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (modalAction === 'confirm') {
        await confirmarReserva(selectedReserva.id, observacionesAdmin, selectedReserva.tipoReserva);

      } else if (modalAction === 'cancel') {
        await cancelarReserva(selectedReserva.id, observacionesAdmin, selectedReserva.tipoReserva);

      } else if (modalAction === 'pago') {
        const monto = parseFloat(pagoMonto);
        if (isNaN(monto) || monto <= 0) {
          setActionError('Ingrese un monto válido mayor a 0.');
          return;
        }
        await actualizarEstadoPago(selectedReserva.id, pagoTipo, monto, selectedReserva.tipoReserva);

      } else if (modalAction === 'posponer') {
        if (selectedReserva.tipoReserva === 'SENDERO') {
          if (!posponerFecha) { setActionError('Seleccione una nueva fecha.'); return; }
          await posponerReserva(selectedReserva.id, selectedReserva.tipoReserva, {
            nuevaFecha: posponerFecha,
            turno: posponerTurno || undefined
          });
        } else {
          if (!posponerFechaCheckIn || !posponerFechaCheckOut) {
            setActionError('Seleccione las nuevas fechas de check-in y check-out.');
            return;
          }
          if (posponerFechaCheckOut <= posponerFechaCheckIn) {
            setActionError('El check-out debe ser posterior al check-in.');
            return;
          }
          await posponerReserva(selectedReserva.id, selectedReserva.tipoReserva, {
            nuevaFechaCheckIn: posponerFechaCheckIn,
            nuevaFechaCheckOut: posponerFechaCheckOut
          });
        }

      } else if (modalAction === 'estado') {
        if (!nuevoEstado) { setActionError('Seleccione el nuevo estado.'); return; }
        await actualizarEstado(selectedReserva.id, nuevoEstado, selectedReserva.tipoReserva);
      }

      await loadReservas();
      handleCloseModal();
    } catch (err: any) {
      const msg = err?.message || err?.error || 'Error al procesar la acción';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const filtrarReservas = () =>
    reservas.filter(reserva => {
      const matchEstado = !filtros.estado || reserva.estado === filtros.estado;
      const matchTipo = !filtros.tipo || reserva.tipoReserva === filtros.tipo;
      const matchEstadoPago = !filtros.estadoPago || reserva.estadoPago === filtros.estadoPago;
      const matchBusqueda = !filtros.busqueda ||
        reserva.nombreCliente?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.emailCliente?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.codigo?.toLowerCase().includes(filtros.busqueda.toLowerCase());
      return matchEstado && matchTipo && matchEstadoPago && matchBusqueda;
    });

  const reservasFiltradas = filtrarReservas();
  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === 'PENDIENTE').length,
    confirmadas: reservas.filter(r => r.estado === 'CONFIRMADA').length,
    canceladas: reservas.filter(r => r.estado === 'CANCELADA').length
  };

  const getEstadosTransicion = (estado: string, estadoPago?: string) => {
    switch (estado) {
      case 'PENDIENTE': return [{ value: 'CONFIRMADA', label: 'Confirmada' }, { value: 'CANCELADA', label: 'Cancelada' }];
      case 'CONFIRMADA': {
        const opciones = [];
        if (estadoPago !== 'PARCIAL') {
          opciones.push({ value: 'COMPLETADA', label: 'Completada' });
        }
        opciones.push({ value: 'CANCELADA', label: 'Cancelada' });
        return opciones;
      }
      default: return [];
    }
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

  return (
    <div className="reservation-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><Icon name="calendar" size="md" className="me-2" />Gestión de Reservas</h2>
          <p className="text-muted mb-0">Administra todas las reservas del sistema</p>
        </div>
        <Button variant="outline-primary" onClick={loadReservas} disabled={loading}>
          <Icon name="refresh" size="sm" className="me-2" />Actualizar
        </Button>
      </div>

      {error && <BackendError error={error} className="mb-4" />}

      {/* Estadísticas rápidas */}
      <Row className="mb-4">
        <Col md={3}><Card className="text-center"><Card.Body><h3 className="text-primary">{stats.total}</h3><small className="text-muted">Total</small></Card.Body></Card></Col>
        <Col md={3}><Card className="text-center"><Card.Body><h3 className="text-warning">{stats.pendientes}</h3><small className="text-muted">Pendientes</small></Card.Body></Card></Col>
        <Col md={3}><Card className="text-center"><Card.Body><h3 className="text-success">{stats.confirmadas}</h3><small className="text-muted">Confirmadas</small></Card.Body></Card></Col>
        <Col md={3}><Card className="text-center"><Card.Body><h3 className="text-danger">{stats.canceladas}</h3><small className="text-muted">Canceladas</small></Card.Body></Card></Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
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
                <Form.Select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
                  <option value="">Todos los tipos</option>
                  <option value="SENDERO">Senderos</option>
                  <option value="ALOJAMIENTO">Alojamiento</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Estado Pago</Form.Label>
                <Form.Select value={filtros.estadoPago} onChange={(e) => setFiltros({ ...filtros, estadoPago: e.target.value })}>
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
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  />
                  <Button variant="outline-secondary" onClick={() => setFiltros({ ...filtros, busqueda: '' })}>
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
                      <td><code className="bg-light p-1 rounded">{reserva.codigo}</code></td>
                      <td>
                        <div>
                          <strong>{reserva.nombreCliente}</strong><br />
                          <small className="text-muted">{reserva.emailCliente}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getTipoIcon(reserva.tipoReserva)}
                          <div>
                            <div>{reserva.tipoReserva}</div>
                            {reserva.sendero && <small className="text-muted">{reserva.sendero.nombre}</small>}
                            {reserva.habitacion && <small className="text-muted">{reserva.habitacion.nombre}</small>}
                            {reserva.informacionAdicional && !reserva.sendero && !reserva.habitacion && (
                              <small className="text-muted">{reserva.informacionAdicional.split('|')[0]?.trim()}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {formatDate(reserva.fechaReserva)}
                          {reserva.turno && <><br /><small className="text-muted">{getTurnoText(reserva.turno)}</small></>}
                        </div>
                      </td>
                      <td><Badge bg="info">{reserva.cantidadPersonas}</Badge></td>
                      <td><strong>{formatPrice(reserva.precioTotal)}</strong></td>
                      <td>{getEstadoBadge(reserva.estado)}</td>
                      <td>
                        {getEstadoPagoBadge(reserva.estadoPago)}
                        {reserva.montoPagado != null && reserva.montoPagado > 0 && (
                          <small className="d-block text-muted mt-1">{formatPrice(reserva.montoPagado)} pagado</small>
                        )}
                      </td>
                      <td><small>{formatDateTime(reserva.fechaCreacion)}</small></td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <Icon name="menu" size="sm" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                            <Dropdown.Item onClick={() => handleAction(reserva, 'view')}>
                              <Icon name="search" size="sm" className="me-2" />Ver Detalles
                            </Dropdown.Item>

                            {/* Gestionar Pago - disponible si no está en estado final de pago ni cancelada */}
                            {reserva.estado !== 'CANCELADA' && reserva.estado !== 'COMPLETADA'
                              && reserva.estadoPago !== 'COMPLETO' && reserva.estadoPago !== 'NO_CORRESPONDE' && (
                              <Dropdown.Item onClick={() => handleAction(reserva, 'pago')} className="text-primary">
                                <Icon name="info" size="sm" className="me-2" />Registrar Pago
                              </Dropdown.Item>
                            )}

                            {/* Confirmar - solo si PENDIENTE y tiene al menos algún pago o se registrará */}
                            {reserva.estado === 'PENDIENTE' && (
                              <Dropdown.Item onClick={() => handleAction(reserva, 'confirm')} className="text-success">
                                <Icon name="check" size="sm" className="me-2" />Confirmar
                              </Dropdown.Item>
                            )}

                            {/* Cambiar estado */}
                            {(reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA') && (
                              <Dropdown.Item onClick={() => handleAction(reserva, 'estado')}>
                                <Icon name="refresh" size="sm" className="me-2" />Cambiar Estado
                              </Dropdown.Item>
                            )}

                            {/* Posponer - disponible si no está en estado final */}
                            {(reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA') && (
                              <Dropdown.Item onClick={() => handleAction(reserva, 'posponer')} className="text-warning">
                                <Icon name="calendar" size="sm" className="me-2" />Posponer
                              </Dropdown.Item>
                            )}

                            {/* Cancelar - disponible para PENDIENTE y CONFIRMADA */}
                            {(reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA') && (
                              <>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleAction(reserva, 'cancel')} className="text-danger">
                                  <Icon name="close" size="sm" className="me-2" />Cancelar
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
              <p>{filtros.estado || filtros.tipo || filtros.busqueda ? 'No se encontraron reservas con los filtros aplicados' : 'Aún no hay reservas en el sistema'}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === 'view' && 'Detalles de Reserva'}
            {modalAction === 'confirm' && 'Confirmar Reserva'}
            {modalAction === 'cancel' && 'Cancelar Reserva'}
            {modalAction === 'pago' && 'Registrar Pago'}
            {modalAction === 'posponer' && 'Posponer Reserva'}
            {modalAction === 'estado' && 'Cambiar Estado'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedReserva && (
            <>
              {actionError && <Alert variant="danger" className="mb-3">{actionError}</Alert>}

              {/* Detalles básicos - siempre visibles */}
              <Row>
                <Col md={6}>
                  <h6>Información del Cliente</h6>
                  <p><strong>Nombre:</strong> {selectedReserva.nombreCliente}</p>
                  <p><strong>Email:</strong> {selectedReserva.emailCliente}</p>
                  {selectedReserva.telefonoCliente && <p><strong>Teléfono:</strong> {selectedReserva.telefonoCliente}</p>}
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
                      {selectedReserva.turno && <p><strong>Turno:</strong> {getTurnoText(selectedReserva.turno)}</p>}
                    </>
                  )}
                  {selectedReserva.habitacion && <p><strong>Habitación:</strong> {selectedReserva.habitacion.nombre}</p>}
                  {selectedReserva.guia && <p><strong>Guía:</strong> {selectedReserva.guia.nombre}</p>}
                  {selectedReserva.informacionAdicional && !selectedReserva.sendero && !selectedReserva.habitacion && (
                    <p><strong>Info:</strong> <small>{selectedReserva.informacionAdicional}</small></p>
                  )}
                </Col>
                <Col md={6}>
                  <h6>Detalles de la Reserva</h6>
                  <p><strong>Fecha:</strong> {formatDate(selectedReserva.fechaReserva)}</p>
                  {selectedReserva.fechaFin && selectedReserva.fechaFin !== selectedReserva.fechaReserva && (
                    <p><strong>Check-out:</strong> {formatDate(selectedReserva.fechaFin)}</p>
                  )}
                  <p><strong>Personas:</strong> {selectedReserva.cantidadPersonas}</p>
                  <p><strong>Total:</strong> {formatPrice(selectedReserva.precioTotal)}</p>
                </Col>
              </Row>

              <hr />

              {/* Información de pago */}
              <Row>
                <Col md={12}>
                  <h6>Información de Pago</h6>
                  <div className="d-flex gap-3 mb-2 flex-wrap">
                    <div><strong>Estado:</strong> {getEstadoPagoBadge(selectedReserva.estadoPago)}</div>
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
                  {selectedReserva.metodoPago && <p><strong>Método:</strong> {selectedReserva.metodoPago}</p>}
                  {selectedReserva.placetoPayRequestId && (
                    <p><strong>PlacetoPay ID:</strong> <code>{selectedReserva.placetoPayRequestId}</code></p>
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

              {selectedReserva.observacionesAdmin && modalAction === 'view' && (
                <>
                  <hr />
                  <h6>Observaciones Administrativas</h6>
                  <p className="bg-warning bg-opacity-10 p-3 rounded">{selectedReserva.observacionesAdmin}</p>
                </>
              )}

              {/* ===== MODAL: CONFIRMAR ===== */}
              {modalAction === 'confirm' && (
                <>
                  <hr />
                  {selectedReserva.estadoPago === 'PENDIENTE' ? (
                    <Alert variant="warning">
                      <strong>Atención:</strong> Esta reserva tiene pago pendiente. Al confirmar quedará como <strong>Confirmada con pago pendiente</strong>. Si desea que el pago quede registrado, use la opción <strong>"Registrar Pago"</strong> que además confirmará la reserva automáticamente.
                    </Alert>
                  ) : (
                    <Alert variant="success">
                      Estado de pago: {getEstadoPagoBadge(selectedReserva.estadoPago)}{' '}
                      {selectedReserva.montoPagado ? `(${formatPrice(selectedReserva.montoPagado)} pagado)` : ''}
                    </Alert>
                  )}
                  <Form.Group>
                    <Form.Label>Observaciones Administrativas <small className="text-muted">(opcional)</small></Form.Label>
                    <Form.Control
                      as="textarea" rows={2}
                      value={observacionesAdmin}
                      onChange={e => setObservacionesAdmin(e.target.value)}
                      placeholder="Notas adicionales sobre la confirmación..."
                    />
                  </Form.Group>
                </>
              )}

              {/* ===== MODAL: CANCELAR ===== */}
              {modalAction === 'cancel' && (
                <>
                  <hr />
                  <Alert variant="danger">
                    ¿Seguro que desea cancelar esta reserva? Esta acción no se puede deshacer.
                    {selectedReserva.estadoPago !== 'PENDIENTE' && (
                      <div className="mt-1"><strong>Atención:</strong> Esta reserva tiene pago registrado ({getEstadoPagoBadge(selectedReserva.estadoPago)}).</div>
                    )}
                  </Alert>
                  <Form.Group>
                    <Form.Label>Motivo de Cancelación <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea" rows={3}
                      value={observacionesAdmin}
                      onChange={e => setObservacionesAdmin(e.target.value)}
                      placeholder="Motivo de la cancelación..."
                    />
                  </Form.Group>
                </>
              )}

              {/* ===== MODAL: REGISTRAR PAGO ===== */}
              {modalAction === 'pago' && (
                <>
                  <hr />
                  <h6>Registrar Pago</h6>

                  {selectedReserva.estadoPago === 'PENDIENTE' && (
                    <Alert variant="info" className="mb-3">
                      Al registrar un pago (parcial o total) la reserva se <strong>confirmará automáticamente</strong>.
                    </Alert>
                  )}

                  {selectedReserva.estadoPago === 'PARCIAL' && (
                    <Alert variant="info" className="mb-3">
                      Ya hay una seña registrada de <strong>{formatPrice(selectedReserva.montoPagado || 0)}</strong>.
                      Saldo pendiente: <strong>{formatPrice(selectedReserva.saldoPendiente ?? (selectedReserva.precioTotal - (selectedReserva.montoPagado || 0)))}</strong>.
                    </Alert>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Pago</Form.Label>
                    <Form.Select
                      value={pagoTipo}
                      onChange={e => {
                        const tipo = e.target.value as 'PARCIAL' | 'COMPLETO';
                        setPagoTipo(tipo);
                        if (tipo === 'PARCIAL') {
                          setPagoMonto(String(Math.round(selectedReserva.precioTotal * 0.3)));
                        } else {
                          const saldo = selectedReserva.saldoPendiente ?? (selectedReserva.precioTotal - (selectedReserva.montoPagado || 0));
                          setPagoMonto(String(Math.max(0, saldo)));
                        }
                      }}
                      disabled={selectedReserva.estadoPago === 'PARCIAL'}
                    >
                      {selectedReserva.estadoPago !== 'PARCIAL' && (
                        <option value="PARCIAL">Seña (30%) — {formatPrice(Math.round(selectedReserva.precioTotal * 0.3))}</option>
                      )}
                      <option value="COMPLETO">
                        {selectedReserva.estadoPago === 'PARCIAL'
                          ? `Pagar saldo restante — ${formatPrice(selectedReserva.saldoPendiente ?? 0)}`
                          : `Pago Completo — ${formatPrice(selectedReserva.precioTotal)}`}
                      </option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Monto Recibido ($)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={pagoMonto}
                      onChange={e => setPagoMonto(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Total de la reserva: {formatPrice(selectedReserva.precioTotal)}
                    </Form.Text>
                  </Form.Group>
                </>
              )}

              {/* ===== MODAL: POSPONER ===== */}
              {modalAction === 'posponer' && (
                <>
                  <hr />
                  <Alert variant="info">
                    Al posponer se recalcularán las fechas y se buscará disponibilidad para las nuevas fechas.
                    {selectedReserva.tipoReserva === 'ALOJAMIENTO' && ' El precio se recalculará según las noches nuevas.'}
                  </Alert>
                  {selectedReserva.tipoReserva === 'SENDERO' ? (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Nueva Fecha</Form.Label>
                        <Form.Control
                          type="date"
                          value={posponerFecha}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setPosponerFecha(e.target.value)}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>Turno</Form.Label>
                        <Form.Select value={posponerTurno} onChange={e => setPosponerTurno(e.target.value)}>
                          <option value="MANANA">Mañana</option>
                          <option value="TARDE">Tarde</option>
                        </Form.Select>
                      </Form.Group>
                    </>
                  ) : (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Nueva Fecha de Check-in</Form.Label>
                        <Form.Control
                          type="date"
                          value={posponerFechaCheckIn}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setPosponerFechaCheckIn(e.target.value)}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label>Nueva Fecha de Check-out</Form.Label>
                        <Form.Control
                          type="date"
                          value={posponerFechaCheckOut}
                          min={posponerFechaCheckIn || new Date().toISOString().split('T')[0]}
                          onChange={e => setPosponerFechaCheckOut(e.target.value)}
                        />
                      </Form.Group>
                    </>
                  )}
                </>
              )}

              {/* ===== MODAL: CAMBIAR ESTADO ===== */}
              {modalAction === 'estado' && (
                <>
                  <hr />
                  <h6>Cambiar Estado de la Reserva</h6>
                  <p className="text-muted">Estado actual: {getEstadoBadge(selectedReserva.estado)}</p>
                  {selectedReserva.estadoPago === 'PENDIENTE' && nuevoEstado === 'CONFIRMADA' && (
                    <Alert variant="warning">
                      Esta reserva tiene <strong>pago pendiente</strong>. Quedará confirmada pero sin pago registrado. Considere usar <strong>"Registrar Pago"</strong> en cambio, que confirma la reserva automáticamente.
                    </Alert>
                  )}
                  {selectedReserva.estadoPago === 'PARCIAL' && selectedReserva.estado === 'CONFIRMADA' && (
                    <Alert variant="warning">
                      Esta reserva tiene <strong>pago parcial</strong>. Para marcarla como <strong>Completada</strong> primero debe registrar el pago completo usando la opción <strong>"Registrar Pago"</strong>.
                    </Alert>
                  )}
                  <Form.Group>
                    <Form.Label>Nuevo Estado</Form.Label>
                    <Form.Select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                      <option value="">Seleccionar estado...</option>
                      {getEstadosTransicion(selectedReserva.estado, selectedReserva.estadoPago).map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  {nuevoEstado === 'CANCELADA' && (
                    <Form.Group className="mt-3">
                      <Form.Label>Motivo <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea" rows={2}
                        value={observacionesAdmin}
                        onChange={e => setObservacionesAdmin(e.target.value)}
                        placeholder="Motivo de la cancelación..."
                      />
                    </Form.Group>
                  )}
                </>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>

          {modalAction === 'confirm' && (
            <Button variant="success" onClick={handleConfirmAction} disabled={actionLoading}>
              {actionLoading ? <><Spinner animation="border" size="sm" className="me-2" />Confirmando...</> : <><Icon name="check" size="sm" className="me-2" />Confirmar Reserva</>}
            </Button>
          )}

          {modalAction === 'cancel' && (
            <Button variant="danger" onClick={handleConfirmAction} disabled={actionLoading || !observacionesAdmin.trim()}>
              {actionLoading ? <><Spinner animation="border" size="sm" className="me-2" />Cancelando...</> : <><Icon name="close" size="sm" className="me-2" />Cancelar Reserva</>}
            </Button>
          )}

          {modalAction === 'pago' && (
            <Button variant="primary" onClick={handleConfirmAction} disabled={actionLoading}>
              {actionLoading ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : <><Icon name="check" size="sm" className="me-2" />Registrar Pago</>}
            </Button>
          )}

          {modalAction === 'posponer' && (
            <Button variant="warning" onClick={handleConfirmAction} disabled={actionLoading}>
              {actionLoading ? <><Spinner animation="border" size="sm" className="me-2" />Posponiedo...</> : <><Icon name="calendar" size="sm" className="me-2" />Confirmar Posposición</>}
            </Button>
          )}

          {modalAction === 'estado' && (
            <Button
              variant="primary"
              onClick={handleConfirmAction}
              disabled={actionLoading || !nuevoEstado || (nuevoEstado === 'CANCELADA' && !observacionesAdmin.trim())}
            >
              {actionLoading ? <><Spinner animation="border" size="sm" className="me-2" />Actualizando...</> : <><Icon name="refresh" size="sm" className="me-2" />Actualizar Estado</>}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReservationManagement;
