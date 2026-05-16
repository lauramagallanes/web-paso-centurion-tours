import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import Icon from '../common/Icon';
import { apiService } from '../../services/apiService';

interface Props {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface SenderoLite {
  id: string;
  nombre: string;
  capacidadMaximaGrupo?: number;
  precioPorPersona?: number;
}

interface AlojamientoLite {
  id: string;
  nombre: string;
  capacidadMinima?: number;
  capacidadMaxima?: number;
  precioPorNoche?: number;
}

interface GuiaLite {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  activo?: boolean;
}

type TipoReserva = 'SENDERO' | 'ALOJAMIENTO';
type EstadoInicial = 'PENDIENTE' | 'CONFIRMADA';
type Turno = 'MANANA' | 'TARDE';

const todayISO = () => new Date().toISOString().slice(0, 10);

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const CreateReservationModal: React.FC<Props> = ({ show, onClose, onCreated }) => {
  const [tipo, setTipo] = useState<TipoReserva>('SENDERO');

  // Catalogs
  const [senderos, setSenderos] = useState<SenderoLite[]>([]);
  const [alojamientos, setAlojamientos] = useState<AlojamientoLite[]>([]);
  const [guias, setGuias] = useState<GuiaLite[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  // Common contact fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estadoInicial, setEstadoInicial] = useState<EstadoInicial>('CONFIRMADA');

  // Sendero fields
  const [senderoId, setSenderoId] = useState('');
  const [fechaSendero, setFechaSendero] = useState(todayISO());
  const [turno, setTurno] = useState<Turno>('MANANA');
  const [numeroPersonas, setNumeroPersonas] = useState<number>(1);
  const [guiaId, setGuiaId] = useState<string>('');

  // Alojamiento fields
  const [alojamientoId, setAlojamientoId] = useState('');
  const [fechaCheckIn, setFechaCheckIn] = useState(todayISO());
  const [fechaCheckOut, setFechaCheckOut] = useState(tomorrowISO());
  const [numeroHuespedes, setNumeroHuespedes] = useState<number>(1);
  const [observacionesEspeciales, setObservacionesEspeciales] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setTipo('SENDERO');
    setNombre('');
    setEmail('');
    setTelefono('');
    setObservaciones('');
    setEstadoInicial('CONFIRMADA');
    setSenderoId('');
    setFechaSendero(todayISO());
    setTurno('MANANA');
    setNumeroPersonas(1);
    setGuiaId('');
    setAlojamientoId('');
    setFechaCheckIn(todayISO());
    setFechaCheckOut(tomorrowISO());
    setNumeroHuespedes(1);
    setObservacionesEspeciales('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  // Load catalogs once when the modal opens
  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    (async () => {
      setLoadingCatalogs(true);
      try {
        const [senderosResp, alojamientosResp, guiasResp] = await Promise.all([
          apiService.getSenderos().catch(() => null),
          apiService.getAlojamientos().catch(() => null),
          apiService.getGuias().catch(() => null),
        ]);
        if (cancelled) return;

        const senderosList: SenderoLite[] = Array.isArray(senderosResp)
          ? senderosResp
          : (senderosResp?.data ?? senderosResp?.senderos ?? []);
        const alojamientosList: AlojamientoLite[] = Array.isArray(alojamientosResp)
          ? alojamientosResp
          : (alojamientosResp?.data ?? alojamientosResp?.alojamientos ?? []);
        const guiasList: GuiaLite[] = Array.isArray(guiasResp)
          ? guiasResp
          : (guiasResp?.data ?? guiasResp?.guias ?? []);

        setSenderos(senderosList);
        setAlojamientos(alojamientosList);
        setGuias(guiasList.filter(g => g.activo !== false));
      } catch (e) {
        console.error('Error cargando catálogos para nueva reserva:', e);
      } finally {
        if (!cancelled) setLoadingCatalogs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [show]);

  const senderoSeleccionado = useMemo(
    () => senderos.find(s => s.id === senderoId),
    [senderos, senderoId]
  );

  const alojamientoSeleccionado = useMemo(
    () => alojamientos.find(a => a.id === alojamientoId),
    [alojamientos, alojamientoId]
  );

  const validateSendero = (): string | null => {
    if (!senderoId) return 'Seleccioná un sendero';
    if (!fechaSendero) return 'Seleccioná la fecha';
    if (!numeroPersonas || numeroPersonas < 1) return 'La cantidad de personas debe ser al menos 1';
    if (senderoSeleccionado?.capacidadMaximaGrupo
      && numeroPersonas > senderoSeleccionado.capacidadMaximaGrupo) {
      return `El sendero ${senderoSeleccionado.nombre} no admite más de ${senderoSeleccionado.capacidadMaximaGrupo} personas`;
    }
    return null;
  };

  const validateAlojamiento = (): string | null => {
    if (!alojamientoId) return 'Seleccioná un alojamiento';
    if (!fechaCheckIn || !fechaCheckOut) return 'Seleccioná las fechas de check-in y check-out';
    if (fechaCheckIn >= fechaCheckOut) return 'La fecha de check-out debe ser posterior a la de check-in';
    if (!numeroHuespedes || numeroHuespedes < 1) return 'La cantidad de huéspedes debe ser al menos 1';
    if (alojamientoSeleccionado?.capacidadMaxima
      && numeroHuespedes > alojamientoSeleccionado.capacidadMaxima) {
      return `El alojamiento ${alojamientoSeleccionado.nombre} no admite más de ${alojamientoSeleccionado.capacidadMaxima} huéspedes`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!nombre.trim()) { setError('El nombre del cliente es obligatorio'); return; }
    if (!email.trim()) { setError('El email del cliente es obligatorio'); return; }

    const specificError = tipo === 'SENDERO' ? validateSendero() : validateAlojamiento();
    if (specificError) { setError(specificError); return; }

    setSubmitting(true);
    try {
      if (tipo === 'SENDERO') {
        await apiService.createReservaSenderoAdmin({
          emailContacto: email.trim(),
          nombreContacto: nombre.trim(),
          telefonoContacto: telefono.trim() || undefined,
          numeroPersonas,
          fechaInicio: fechaSendero,
          senderoId,
          turno,
          guiaId: guiaId || null,
          observaciones: observaciones.trim() || undefined,
          estadoInicial,
        });
        setSuccess('Reserva de sendero creada correctamente');
      } else {
        await apiService.createReservaAlojamientoAdmin({
          emailContacto: email.trim(),
          nombreContacto: nombre.trim(),
          telefonoContacto: telefono.trim() || undefined,
          alojamientoId,
          fechaCheckIn,
          fechaCheckOut,
          numeroHuespedes,
          observaciones: observaciones.trim() || undefined,
          observacionesEspeciales: observacionesEspeciales.trim() || undefined,
          estadoInicial,
        });
        setSuccess('Reserva de alojamiento creada correctamente');
      }
      onCreated();
      // Auto-close after a short delay so the user sees the success message
      setTimeout(() => { reset(); onClose(); }, 1200);
    } catch (err: any) {
      console.error('createReservaAdmin error:', err);
      const message = err?.message || (typeof err === 'string' ? err : null) || 'Error al crear la reserva';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Icon name="plus" size="md" className="me-2" />
          Nueva reserva manual
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info" className="d-flex align-items-start gap-2">
            <Icon name="info" size="sm" className="mt-1" />
            <div>
              Usá esta vista para crear reservas a clientes que no pueden usar el sitio web (presenciales o por teléfono).
              El pago queda en estado <strong>PENDIENTE</strong>; podés registrarlo después con el botón <em>Pago</em> de la reserva.
            </div>
          </Alert>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Tipo de reserva */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Tipo de reserva</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="tipo-sendero"
                name="tipo"
                label={<span><Icon name="hiking" size="sm" className="me-1" />Sendero</span>}
                checked={tipo === 'SENDERO'}
                onChange={() => setTipo('SENDERO')}
                disabled={submitting}
              />
              <Form.Check
                type="radio"
                id="tipo-alojamiento"
                name="tipo"
                label={<span><Icon name="bed" size="sm" className="me-1" />Alojamiento</span>}
                checked={tipo === 'ALOJAMIENTO'}
                onChange={() => setTipo('ALOJAMIENTO')}
                disabled={submitting}
              />
            </div>
          </Form.Group>

          <hr />

          {/* Datos del cliente */}
          <h6 className="text-muted mb-3">Datos del cliente</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nombre completo *</Form.Label>
                <Form.Control
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  required
                  disabled={submitting}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  required
                  disabled={submitting}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="+598 9X XXX XXX"
                  disabled={submitting}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Estado inicial</Form.Label>
                <Form.Select
                  value={estadoInicial}
                  onChange={e => setEstadoInicial(e.target.value as EstadoInicial)}
                  disabled={submitting}
                >
                  <option value="CONFIRMADA">CONFIRMADA (cupo bloqueado)</option>
                  <option value="PENDIENTE">PENDIENTE (a confirmar después)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <hr />

          {/* Sección específica */}
          {tipo === 'SENDERO' ? (
            <>
              <h6 className="text-muted mb-3">Datos del sendero</h6>
              <Row className="mb-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Sendero *</Form.Label>
                    <Form.Select
                      value={senderoId}
                      onChange={e => setSenderoId(e.target.value)}
                      disabled={submitting || loadingCatalogs}
                      required
                    >
                      <option value="">— Elegí un sendero —</option>
                      {senderos.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                          {s.capacidadMaximaGrupo ? ` (máx. ${s.capacidadMaximaGrupo} pers.)` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Personas *</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={senderoSeleccionado?.capacidadMaximaGrupo ?? 50}
                      value={numeroPersonas}
                      onChange={e => setNumeroPersonas(Number(e.target.value))}
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Fecha *</Form.Label>
                    <Form.Control
                      type="date"
                      value={fechaSendero}
                      onChange={e => setFechaSendero(e.target.value)}
                      min={todayISO()}
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Turno *</Form.Label>
                    <Form.Select
                      value={turno}
                      onChange={e => setTurno(e.target.value as Turno)}
                      disabled={submitting}
                    >
                      <option value="MANANA">Mañana</option>
                      <option value="TARDE">Tarde</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Guía</Form.Label>
                    <Form.Select
                      value={guiaId}
                      onChange={e => setGuiaId(e.target.value)}
                      disabled={submitting || loadingCatalogs}
                    >
                      <option value="">— Auto-asignar —</option>
                      {guias.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.nombreCompleto || `${g.nombre} ${g.apellido}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <h6 className="text-muted mb-3">Datos del alojamiento</h6>
              <Row className="mb-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Alojamiento *</Form.Label>
                    <Form.Select
                      value={alojamientoId}
                      onChange={e => setAlojamientoId(e.target.value)}
                      disabled={submitting || loadingCatalogs}
                      required
                    >
                      <option value="">— Elegí un alojamiento —</option>
                      {alojamientos.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                          {a.capacidadMaxima ? ` (hasta ${a.capacidadMaxima} huéspedes)` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Huéspedes *</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={alojamientoSeleccionado?.capacidadMaxima ?? 20}
                      value={numeroHuespedes}
                      onChange={e => setNumeroHuespedes(Number(e.target.value))}
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Check-in *</Form.Label>
                    <Form.Control
                      type="date"
                      value={fechaCheckIn}
                      onChange={e => setFechaCheckIn(e.target.value)}
                      min={todayISO()}
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Check-out *</Form.Label>
                    <Form.Control
                      type="date"
                      value={fechaCheckOut}
                      onChange={e => setFechaCheckOut(e.target.value)}
                      min={fechaCheckIn || todayISO()}
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Observaciones especiales</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={observacionesEspeciales}
                  onChange={e => setObservacionesEspeciales(e.target.value)}
                  placeholder="Pedidos especiales, alergias, etc."
                  disabled={submitting}
                />
              </Form.Group>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Observaciones generales</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas internas o comentarios del cliente"
              disabled={submitting}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting
              ? <><Spinner as="span" size="sm" animation="border" className="me-2" />Creando…</>
              : <><Icon name="check" size="sm" className="me-2" />Crear reserva</>}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateReservationModal;
