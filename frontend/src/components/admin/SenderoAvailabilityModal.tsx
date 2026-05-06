import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Modal, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import Icon from '../common/Icon';
import {
  apiService,
  SenderoBloqueo,
  SenderoDisponibilidad,
  TurnoSendero,
} from '../../services/apiService';

interface SenderoLite {
  id: string;
  nombre: string;
}

interface Props {
  show: boolean;
  sendero: SenderoLite | null;
  onClose: () => void;
}

const DIAS_SEMANA: Array<{ key: string; label: string }> = [
  { key: 'LUNES', label: 'Lun' },
  { key: 'MARTES', label: 'Mar' },
  { key: 'MIERCOLES', label: 'Mié' },
  { key: 'JUEVES', label: 'Jue' },
  { key: 'VIERNES', label: 'Vie' },
  { key: 'SABADO', label: 'Sáb' },
  { key: 'DOMINGO', label: 'Dom' },
];

const PRESETS = {
  TODOS: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'],
  LUNES_VIERNES: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
  FIN_SEMANA: ['SABADO', 'DOMINGO'],
};

const formatDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-UY');

const formatDias = (csv: string | null): string => {
  if (!csv) return 'Todos los días';
  const set = new Set(csv.split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
  if (PRESETS.TODOS.every(d => set.has(d)) && set.size === 7) return 'Todos los días';
  if (PRESETS.LUNES_VIERNES.every(d => set.has(d)) && set.size === 5) return 'Lun a Vie';
  if (PRESETS.FIN_SEMANA.every(d => set.has(d)) && set.size === 2) return 'Sáb y Dom';
  return DIAS_SEMANA.filter(d => set.has(d.key)).map(d => d.label).join(', ');
};

const turnoLabel = (t: TurnoSendero | null) =>
  t === 'MANANA' ? 'Mañana' : t === 'TARDE' ? 'Tarde' : 'Ambos turnos';

const SenderoAvailabilityModal: React.FC<Props> = ({ show, sendero, onClose }) => {
  const [activeTab, setActiveTab] = useState<'periodos' | 'bloqueos'>('periodos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [disponibilidades, setDisponibilidades] = useState<SenderoDisponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<SenderoBloqueo[]>([]);

  // ---- Form: nueva ventana ----
  const today = new Date().toISOString().slice(0, 10);
  const [editingDispId, setEditingDispId] = useState<string | null>(null);
  const [dispTurno, setDispTurno] = useState<TurnoSendero>('MANANA');
  const [dispFechaInicio, setDispFechaInicio] = useState(today);
  const [dispFechaFin, setDispFechaFin] = useState(today);
  const [dispDias, setDispDias] = useState<string[]>(PRESETS.TODOS);
  const [dispActivo, setDispActivo] = useState(true);

  // ---- Form: nuevo bloqueo ----
  const [blqFechaInicio, setBlqFechaInicio] = useState(today);
  const [blqFechaFin, setBlqFechaFin] = useState(today);
  const [blqTurno, setBlqTurno] = useState<'AMBOS' | TurnoSendero>('AMBOS');
  const [blqMotivo, setBlqMotivo] = useState('');

  const resetDispForm = () => {
    setEditingDispId(null);
    setDispTurno('MANANA');
    setDispFechaInicio(today);
    setDispFechaFin(today);
    setDispDias(PRESETS.TODOS);
    setDispActivo(true);
  };

  const resetBlqForm = () => {
    setBlqFechaInicio(today);
    setBlqFechaFin(today);
    setBlqTurno('AMBOS');
    setBlqMotivo('');
  };

  const loadAll = async (senderoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [disps, blqs] = await Promise.all([
        apiService.listSenderoDisponibilidadesAdmin(senderoId),
        apiService.listSenderoBloqueos(senderoId, true),
      ]);
      setDisponibilidades(disps);
      setBloqueos(blqs);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar la disponibilidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && sendero?.id) {
      setActiveTab('periodos');
      setError(null);
      setSuccess(null);
      resetDispForm();
      resetBlqForm();
      loadAll(sendero.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, sendero?.id]);

  const toggleDia = (key: string) => {
    setDispDias(prev => (prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]));
  };

  const presetActiva = useMemo(() => {
    const set = new Set(dispDias);
    if (set.size === 7) return 'TODOS';
    if (PRESETS.LUNES_VIERNES.every(d => set.has(d)) && set.size === 5) return 'LUNES_VIERNES';
    if (PRESETS.FIN_SEMANA.every(d => set.has(d)) && set.size === 2) return 'FIN_SEMANA';
    return null;
  }, [dispDias]);

  const handleEditDisp = (d: SenderoDisponibilidad) => {
    setEditingDispId(d.id);
    setDispTurno(d.turno);
    setDispFechaInicio(d.fechaInicio);
    setDispFechaFin(d.fechaFin);
    setDispDias(d.diasSemana ? d.diasSemana.split(',').map(s => s.trim().toUpperCase()) : PRESETS.TODOS);
    setDispActivo(d.activo);
    setActiveTab('periodos');
  };

  const handleSaveDisp = async () => {
    if (!sendero?.id) return;
    if (!dispFechaInicio || !dispFechaFin) {
      setError('Ingresá ambas fechas.');
      return;
    }
    if (dispFechaFin < dispFechaInicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    if (dispDias.length === 0) {
      setError('Seleccioná al menos un día de la semana.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const orderedDias = DIAS_SEMANA.map(d => d.key).filter(k => dispDias.includes(k));
      const isAllDays = orderedDias.length === 7;
      const payload = {
        fechaInicio: dispFechaInicio,
        fechaFin: dispFechaFin,
        turno: dispTurno,
        diasSemana: isAllDays ? null : orderedDias.join(','),
        activo: dispActivo,
      };
      if (editingDispId) {
        await apiService.updateSenderoDisponibilidad(editingDispId, payload);
        setSuccess('Período actualizado.');
      } else {
        await apiService.createSenderoDisponibilidad(sendero.id, payload);
        setSuccess('Período agregado.');
      }
      resetDispForm();
      await loadAll(sendero.id);
    } catch (e: any) {
      setError(e?.message || 'Error al guardar el período.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDisp = async (id: string) => {
    if (!sendero?.id) return;
    if (!window.confirm('¿Eliminar este período?')) return;
    setLoading(true);
    setError(null);
    try {
      await apiService.deleteSenderoDisponibilidad(id);
      setSuccess('Período eliminado.');
      await loadAll(sendero.id);
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDispActivo = async (d: SenderoDisponibilidad) => {
    if (!sendero?.id) return;
    setLoading(true);
    setError(null);
    try {
      await apiService.updateSenderoDisponibilidad(d.id, {
        fechaInicio: d.fechaInicio,
        fechaFin: d.fechaFin,
        turno: d.turno,
        diasSemana: d.diasSemana,
        activo: !d.activo,
      });
      setSuccess(d.activo ? 'Período pausado.' : 'Período reactivado.');
      await loadAll(sendero.id);
    } catch (e: any) {
      setError(e?.message || 'Error al cambiar estado.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBloqueo = async () => {
    if (!sendero?.id) return;
    if (!blqFechaInicio || !blqFechaFin) {
      setError('Ingresá ambas fechas.');
      return;
    }
    if (blqFechaFin < blqFechaInicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.createSenderoBloqueo(sendero.id, {
        fechaInicio: blqFechaInicio,
        fechaFin: blqFechaFin,
        turno: blqTurno === 'AMBOS' ? null : blqTurno,
        motivo: blqMotivo.trim() || null,
      });
      setSuccess('Bloqueo agregado.');
      resetBlqForm();
      await loadAll(sendero.id);
    } catch (e: any) {
      setError(e?.message || 'Error al agregar el bloqueo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBloqueo = async (id: string) => {
    if (!sendero?.id) return;
    if (!window.confirm('¿Eliminar este bloqueo?')) return;
    setLoading(true);
    setError(null);
    try {
      await apiService.deleteSenderoBloqueo(id);
      setSuccess('Bloqueo eliminado.');
      await loadAll(sendero.id);
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <Icon name="calendar" size="sm" className="me-2" />
          Disponibilidad — {sendero?.nombre || ''}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

        <Tabs activeKey={activeTab} onSelect={k => setActiveTab((k as 'periodos' | 'bloqueos') || 'periodos')} className="mb-3">
          <Tab eventKey="periodos" title="Disponibilidad regular">
            <p className="text-muted small mb-2">
              Períodos en los que el sendero opera para cada turno. Al menos un período activo
              es necesario para que el sendero pueda reservarse.
            </p>
            <Alert variant="info" className="py-2 small mb-3">
              <strong>¿Querés cerrar el sendero solo unos días?</strong> Usá el tab
              <strong> "Fechas bloqueadas"</strong>. Pausar un período <em>solo</em> desactiva
              ese período específico; si hay otro período activo que cubre las mismas fechas,
              esos días seguirán siendo reservables.
            </Alert>

            {loading && disponibilidades.length === 0 ? (
              <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : disponibilidades.length === 0 ? (
              <Alert variant="warning" className="py-2 mb-3">Sin períodos configurados.</Alert>
            ) : (
              <ListGroup className="mb-3">
                {disponibilidades.map(d => (
                  <ListGroup.Item key={d.id} className="py-2"
                    style={{ borderLeft: `4px solid ${d.activo ? '#198754' : '#6c757d'}` }}>
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                      <div>
                        <div>
                          <Badge bg={d.turno === 'MANANA' ? 'primary' : 'warning'} text={d.turno === 'TARDE' ? 'dark' : undefined} className="me-2">
                            {turnoLabel(d.turno)}
                          </Badge>
                          <strong>{formatDate(d.fechaInicio)}</strong>
                          {' → '}
                          <strong>{formatDate(d.fechaFin)}</strong>
                          {!d.activo && <Badge bg="secondary" className="ms-2">Pausado</Badge>}
                        </div>
                        <small className="text-muted">{formatDias(d.diasSemana)}</small>
                      </div>
                      <div className="d-flex gap-1">
                        <Button variant="outline-success" size="sm" onClick={() => handleEditDisp(d)} disabled={loading} title="Editar">
                          <Icon name="edit" size="xs" />
                        </Button>
                        <Button
                          variant={d.activo ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleDispActivo(d)}
                          disabled={loading}
                          title={d.activo ? 'Pausar este período (no bloquea fechas)' : 'Reactivar este período'}
                        >
                          <Icon name={d.activo ? 'pause' : 'play'} size="xs" />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDisp(d.id)} disabled={loading} title="Eliminar">
                          <Icon name="trash" size="xs" />
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}

            <Card className="border-success border-opacity-50">
              <Card.Body>
                <h6 className="mb-3">{editingDispId ? 'Editar período' : 'Agregar período'}</h6>

                <Form.Group className="mb-3">
                  <Form.Label className="small mb-1">Turno</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="disp-turno-manana"
                      name="disp-turno"
                      label="Mañana"
                      checked={dispTurno === 'MANANA'}
                      onChange={() => setDispTurno('MANANA')}
                      disabled={loading}
                    />
                    <Form.Check
                      type="radio"
                      id="disp-turno-tarde"
                      name="disp-turno"
                      label="Tarde"
                      checked={dispTurno === 'TARDE'}
                      onChange={() => setDispTurno('TARDE')}
                      disabled={loading}
                    />
                  </div>
                </Form.Group>

                <Row className="g-2 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small mb-1">Desde</Form.Label>
                      <Form.Control type="date" size="sm" value={dispFechaInicio}
                        onChange={e => setDispFechaInicio(e.target.value)} disabled={loading} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small mb-1">Hasta</Form.Label>
                      <Form.Control type="date" size="sm" value={dispFechaFin} min={dispFechaInicio}
                        onChange={e => setDispFechaFin(e.target.value)} disabled={loading} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small mb-1">Días de la semana</Form.Label>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    <Button size="sm"
                      variant={presetActiva === 'TODOS' ? 'primary' : 'outline-primary'}
                      onClick={() => setDispDias(PRESETS.TODOS)} disabled={loading}>
                      Todos los días
                    </Button>
                    <Button size="sm"
                      variant={presetActiva === 'LUNES_VIERNES' ? 'primary' : 'outline-primary'}
                      onClick={() => setDispDias(PRESETS.LUNES_VIERNES)} disabled={loading}>
                      Lun-Vie
                    </Button>
                    <Button size="sm"
                      variant={presetActiva === 'FIN_SEMANA' ? 'primary' : 'outline-primary'}
                      onClick={() => setDispDias(PRESETS.FIN_SEMANA)} disabled={loading}>
                      Fines de semana
                    </Button>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {DIAS_SEMANA.map(d => (
                      <Button key={d.key} size="sm"
                        variant={dispDias.includes(d.key) ? 'success' : 'outline-secondary'}
                        onClick={() => toggleDia(d.key)} disabled={loading}>
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="disp-activo-switch"
                    label="Período activo"
                    checked={dispActivo}
                    onChange={e => setDispActivo(e.target.checked)}
                    disabled={loading}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="success" size="sm" onClick={handleSaveDisp} disabled={loading}>
                    {editingDispId ? 'Guardar cambios' : '+ Agregar período'}
                  </Button>
                  {editingDispId && (
                    <Button variant="outline-secondary" size="sm" onClick={resetDispForm} disabled={loading}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="bloqueos" title="Fechas bloqueadas">
            <p className="text-muted small mb-2">
              Fechas puntuales o rangos en los que el sendero está cerrado, aunque el período
              regular lo cubra. Dejá "Ambos turnos" para cerrar el día completo.
            </p>

            {loading && bloqueos.length === 0 ? (
              <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : bloqueos.length === 0 ? (
              <p className="text-muted small mb-3">Sin bloqueos configurados.</p>
            ) : (
              <ListGroup className="mb-3">
                {bloqueos.map(b => (
                  <ListGroup.Item key={b.id} className="py-2"
                    style={{ borderLeft: '4px solid #dc3545' }}>
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                      <div>
                        <div>
                          <Badge bg="danger" className="me-2">{turnoLabel(b.turno)}</Badge>
                          <strong>{formatDate(b.fechaInicio)}</strong>
                          {b.fechaInicio !== b.fechaFin && <> {' → '} <strong>{formatDate(b.fechaFin)}</strong></>}
                        </div>
                        {b.motivo && <small className="text-muted">{b.motivo}</small>}
                      </div>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteBloqueo(b.id)} disabled={loading}>
                        <Icon name="trash" size="xs" />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}

            <Card className="border-danger border-opacity-50">
              <Card.Body>
                <h6 className="mb-3">Bloquear fechas</h6>

                <Row className="g-2 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small mb-1">Desde</Form.Label>
                      <Form.Control type="date" size="sm" value={blqFechaInicio}
                        onChange={e => setBlqFechaInicio(e.target.value)} disabled={loading} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small mb-1">Hasta</Form.Label>
                      <Form.Control type="date" size="sm" value={blqFechaFin} min={blqFechaInicio}
                        onChange={e => setBlqFechaFin(e.target.value)} disabled={loading} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small mb-1">Turno</Form.Label>
                  <div className="d-flex gap-3 flex-wrap">
                    <Form.Check
                      type="radio"
                      id="blq-turno-ambos"
                      name="blq-turno"
                      label="Ambos turnos (día completo)"
                      checked={blqTurno === 'AMBOS'}
                      onChange={() => setBlqTurno('AMBOS')}
                      disabled={loading}
                    />
                    <Form.Check
                      type="radio"
                      id="blq-turno-manana"
                      name="blq-turno"
                      label="Solo mañana"
                      checked={blqTurno === 'MANANA'}
                      onChange={() => setBlqTurno('MANANA')}
                      disabled={loading}
                    />
                    <Form.Check
                      type="radio"
                      id="blq-turno-tarde"
                      name="blq-turno"
                      label="Solo tarde"
                      checked={blqTurno === 'TARDE'}
                      onChange={() => setBlqTurno('TARDE')}
                      disabled={loading}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small mb-1">Motivo (opcional)</Form.Label>
                  <Form.Control type="text" size="sm" placeholder="Ej. mantenimiento, feriado, condiciones climáticas"
                    value={blqMotivo} onChange={e => setBlqMotivo(e.target.value)} disabled={loading} maxLength={255} />
                </Form.Group>

                <Button variant="danger" size="sm" onClick={handleAddBloqueo} disabled={loading}>
                  + Bloquear fechas
                </Button>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SenderoAvailabilityModal;
