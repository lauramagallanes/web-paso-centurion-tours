import React, { useEffect, useState, useMemo } from 'react';
import { Button, Badge, Spinner, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useReservasAdmin } from '../../hooks/useAdminApi';
import { useApi } from '../../hooks/useApi';
import Icon from '../../components/common/Icon';
import './CalendarView.css';

interface Reserva {
  id: string;
  codigo: string;
  tipoReserva: 'SENDERO' | 'ALOJAMIENTO';
  nombreCliente: string;
  cantidadPersonas: number;
  fechaReserva: string;
  fechaFin?: string;
  estado: string;
  turno?: string;
  sendero?: { nombre: string };
  habitacion?: { id: string; nombre: string };
  informacionAdicional?: string;
}

interface Sendero {
  id: string;
  nombre: string;
  capacidadMaximaGrupo: number;
}

interface DayEvents {
  checkIns: Reserva[];
  checkOuts: Reserva[];
  inStay: Reserva[];
  senderosManana: Reserva[];
  senderosTarde: Reserva[];
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CalendarView: React.FC = () => {
  const { reservas, loading, loadReservas } = useReservasAdmin();
  const { execute: fetchSenderos } = useApi();
  const [senderos, setSenderos] = useState<Sendero[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ date: string; events: DayEvents } | null>(null);

  useEffect(() => {
    loadReservas();
    fetchSenderos('/senderos').then((res: any) => {
      if (res?.data) setSenderos(res.data);
      else if (Array.isArray(res)) setSenderos(res);
    });
  }, []);

  const toDateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const activeReservas = useMemo(
    () => reservas.filter(r => r.estado !== 'CANCELADA'),
    [reservas]
  );

  const getEventsForDay = (dateStr: string): DayEvents => {
    const checkIns: Reserva[] = [];
    const checkOuts: Reserva[] = [];
    const inStay: Reserva[] = [];
    const senderosManana: Reserva[] = [];
    const senderosTarde: Reserva[] = [];

    activeReservas.forEach(r => {
      if (r.tipoReserva === 'ALOJAMIENTO') {
        const inicio = r.fechaReserva;
        const fin = r.fechaFin || r.fechaReserva;
        if (inicio === dateStr) checkIns.push(r);
        else if (fin === dateStr) checkOuts.push(r);
        else if (inicio < dateStr && fin > dateStr) inStay.push(r);
      } else if (r.tipoReserva === 'SENDERO') {
        if (r.fechaReserva === dateStr) {
          if (r.turno === 'TARDE') senderosTarde.push(r);
          else senderosManana.push(r);
        }
      }
    });

    return { checkIns, checkOuts, inStay, senderosManana, senderosTarde };
  };

  const getSenderoCupos = (senderNombre: string, dateStr: string, turno: string): { ocupados: number; total: number } => {
    const senderoInfo = senderos.find(s => s.nombre === senderNombre);
    const total = senderoInfo?.capacidadMaximaGrupo ?? 8;
    const ocupados = activeReservas
      .filter(r =>
        r.tipoReserva === 'SENDERO' &&
        r.fechaReserva === dateStr &&
        (r.sendero?.nombre === senderNombre || r.informacionAdicional?.includes(senderNombre)) &&
        (turno === 'MANANA' ? r.turno !== 'TARDE' : r.turno === 'TARDE')
      )
      .reduce((sum, r) => sum + (r.cantidadPersonas || 0), 0);
    return { ocupados, total };
  };

  const buildCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = toDateStr(new Date());

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; isToday: boolean; events: DayEvents } | null> = [];

    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: getEventsForDay(dateStr),
      });
    }

    return days;
  };

  const calendarDays = useMemo(() => buildCalendarDays(), [currentDate, activeReservas]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const hasEvents = (ev: DayEvents) =>
    ev.checkIns.length + ev.checkOuts.length + ev.inStay.length + ev.senderosManana.length + ev.senderosTarde.length > 0;

  const getDayBgClass = (ev: DayEvents, isToday: boolean) => {
    if (isToday) return 'cal-day-today';
    if (hasEvents(ev)) return 'cal-day-active';
    return '';
  };

  const getTurnoLabel = (turno?: string) => turno === 'TARDE' ? '🌇 Tarde' : '🌅 Mañana';

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="calendar-admin">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2><Icon name="calendar" size="md" className="me-2" />Calendario de Reservas</h2>
          <p className="text-muted mb-0">Vista mensual de alojamientos y senderos</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={prevMonth}>‹</Button>
          <Button variant="outline-secondary" size="sm" onClick={goToday}>Hoy</Button>
          <Button variant="outline-secondary" size="sm" onClick={nextMonth}>›</Button>
          <Button variant="outline-primary" size="sm" onClick={loadReservas}>
            <Icon name="refresh" size="sm" className="me-1" />Actualizar
          </Button>
        </div>
      </div>

      {/* Month title */}
      <div className="text-center mb-3">
        <h3 className="fw-bold">{MESES[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
      </div>

      {/* Legend */}
      <div className="d-flex flex-wrap gap-3 mb-3 cal-legend">
        <span><span className="cal-dot bg-success"></span> Check-in</span>
        <span><span className="cal-dot bg-danger"></span> Check-out</span>
        <span><span className="cal-dot bg-primary"></span> En estadía</span>
        <span><span className="cal-dot bg-warning"></span> Sendero mañana</span>
        <span><span className="cal-dot bg-orange"></span> Sendero tarde</span>
      </div>

      {/* Day headers */}
      <div className="cal-grid">
        {DIAS.map(d => (
          <div key={d} className="cal-header-cell">{d}</div>
        ))}

        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="cal-cell cal-empty" />;

          const ev = day.events;
          const totalAloj = ev.checkIns.length + ev.checkOuts.length + ev.inStay.length;
          const totalSend = ev.senderosManana.length + ev.senderosTarde.length;

          return (
            <div
              key={day.date}
              className={`cal-cell ${getDayBgClass(ev, day.isToday)} ${hasEvents(ev) ? 'cal-clickable' : ''}`}
              onClick={() => hasEvents(ev) && setSelectedDay({ date: day.date, events: ev })}
            >
              <div className="cal-day-number">
                {day.day}
                {day.isToday && <span className="cal-today-dot" />}
              </div>

              <div className="cal-events-preview">
                {/* Check-ins */}
                {ev.checkIns.map(r => (
                  <OverlayTrigger
                    key={r.id}
                    placement="top"
                    overlay={<Tooltip>Check-in: {r.nombreCliente} · {r.habitacion?.nombre || 'Alojamiento'} · {r.cantidadPersonas}p</Tooltip>}
                  >
                    <div className="cal-event cal-event-checkin">
                      🏠➡ {r.nombreCliente.split(' ')[0]}
                      <Badge bg="light" text="dark" className="ms-1">{r.cantidadPersonas}p</Badge>
                    </div>
                  </OverlayTrigger>
                ))}

                {/* Check-outs */}
                {ev.checkOuts.map(r => (
                  <OverlayTrigger
                    key={r.id}
                    placement="top"
                    overlay={<Tooltip>Check-out: {r.nombreCliente} · {r.habitacion?.nombre || 'Alojamiento'} · {r.cantidadPersonas}p</Tooltip>}
                  >
                    <div className="cal-event cal-event-checkout">
                      ⬅🏠 {r.nombreCliente.split(' ')[0]}
                      <Badge bg="light" text="dark" className="ms-1">{r.cantidadPersonas}p</Badge>
                    </div>
                  </OverlayTrigger>
                ))}

                {/* In stay */}
                {ev.inStay.map(r => (
                  <OverlayTrigger
                    key={r.id}
                    placement="top"
                    overlay={<Tooltip>En estadía: {r.nombreCliente} · {r.habitacion?.nombre || 'Alojamiento'} · {r.cantidadPersonas}p</Tooltip>}
                  >
                    <div className="cal-event cal-event-instay">
                      🏠 {r.habitacion?.nombre || r.nombreCliente.split(' ')[0]}
                      <Badge bg="light" text="dark" className="ms-1">{r.cantidadPersonas}p</Badge>
                    </div>
                  </OverlayTrigger>
                ))}

                {/* Senderos mañana */}
                {ev.senderosManana.length > 0 && (
                  <div className="cal-event cal-event-sendero-manana">
                    🌅 {ev.senderosManana.length} grupo{ev.senderosManana.length > 1 ? 's' : ''}
                    <Badge bg="light" text="dark" className="ms-1">
                      {ev.senderosManana.reduce((s, r) => s + r.cantidadPersonas, 0)}p
                    </Badge>
                  </div>
                )}

                {/* Senderos tarde */}
                {ev.senderosTarde.length > 0 && (
                  <div className="cal-event cal-event-sendero-tarde">
                    🌇 {ev.senderosTarde.length} grupo{ev.senderosTarde.length > 1 ? 's' : ''}
                    <Badge bg="light" text="dark" className="ms-1">
                      {ev.senderosTarde.reduce((s, r) => s + r.cantidadPersonas, 0)}p
                    </Badge>
                  </div>
                )}

                {/* Compact summary if too many events */}
                {(totalAloj + totalSend) === 0 && null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <Modal
          show={!!selectedDay}
          onHide={() => setSelectedDay(null)}
          size="lg"
          scrollable
        >
          <Modal.Header closeButton className="border-bottom">
            <Modal.Title>
              <Icon name="calendar" size="sm" className="me-2" />
              {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('es-UY', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <DayDetailContent
              events={selectedDay.events}
              dateStr={selectedDay.date}
              getSenderoCupos={getSenderoCupos}
              getTurnoLabel={getTurnoLabel}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedDay(null)}>Cerrar</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

// ─── Day Detail Content ───────────────────────────────────────────────────────

interface DayDetailProps {
  events: DayEvents;
  dateStr: string;
  getSenderoCupos: (nombre: string, date: string, turno: string) => { ocupados: number; total: number };
  getTurnoLabel: (turno?: string) => string;
}

const DayDetailContent: React.FC<DayDetailProps> = ({ events, dateStr, getSenderoCupos, getTurnoLabel }) => {
  const { checkIns, checkOuts, inStay, senderosManana, senderosTarde } = events;
  const hasAloj = checkIns.length + checkOuts.length + inStay.length > 0;
  const hasSend = senderosManana.length + senderosTarde.length > 0;

  const groupBySendero = (reservas: Reserva[]) => {
    const groups: Record<string, Reserva[]> = {};
    reservas.forEach(r => {
      const key = r.sendero?.nombre || r.informacionAdicional?.split('|')[0]?.trim() || 'Sendero';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  };

  return (
    <div className="day-detail">
      {/* ── ALOJAMIENTO ── */}
      {hasAloj && (
        <section className="mb-4">
          <h5 className="day-detail-section-title">
            <span className="section-icon bg-primary">🏠</span> Alojamientos
          </h5>

          {checkIns.length > 0 && (
            <div className="mb-3">
              <div className="day-detail-sub-title text-success">
                <strong>✅ Check-in ({checkIns.length})</strong>
              </div>
              {checkIns.map(r => (
                <AlojCard key={r.id} r={r} type="checkin" />
              ))}
            </div>
          )}

          {checkOuts.length > 0 && (
            <div className="mb-3">
              <div className="day-detail-sub-title text-danger">
                <strong>🚪 Check-out ({checkOuts.length})</strong>
              </div>
              {checkOuts.map(r => (
                <AlojCard key={r.id} r={r} type="checkout" />
              ))}
            </div>
          )}

          {inStay.length > 0 && (
            <div className="mb-3">
              <div className="day-detail-sub-title text-primary">
                <strong>🛏 En estadía ({inStay.length})</strong>
              </div>
              {inStay.map(r => (
                <AlojCard key={r.id} r={r} type="instay" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SENDEROS ── */}
      {hasSend && (
        <section>
          <h5 className="day-detail-section-title">
            <span className="section-icon bg-success">🥾</span> Senderos
          </h5>

          {[
            { label: '🌅 Turno Mañana', reservas: senderosManana, turno: 'MANANA' },
            { label: '🌇 Turno Tarde', reservas: senderosTarde, turno: 'TARDE' },
          ].map(({ label, reservas: rList, turno }) =>
            rList.length > 0 ? (
              <div key={turno} className="mb-3">
                <div className="day-detail-sub-title">
                  <strong>{label}</strong>
                </div>
                {Object.entries(groupBySendero(rList)).map(([senderNombre, grupo]) => {
                  const { ocupados, total } = getSenderoCupos(senderNombre, dateStr, turno);
                  const libres = Math.max(0, total - ocupados);
                  const pct = Math.min(100, Math.round((ocupados / total) * 100));
                  return (
                    <div key={senderNombre} className="sendero-group-card mb-3">
                      <div className="sendero-group-header">
                        <span className="sendero-name">{senderNombre}</span>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={libres === 0 ? 'danger' : libres <= 2 ? 'warning' : 'success'}>
                            {libres === 0 ? '🚫 Lleno' : `${libres} cupo${libres !== 1 ? 's' : ''} libre${libres !== 1 ? 's' : ''}`}
                          </Badge>
                          <small className="text-muted">{ocupados}/{total} personas</small>
                        </div>
                      </div>

                      {/* Capacity bar */}
                      <div className="capacity-bar mb-2">
                        <div
                          className={`capacity-fill ${pct >= 100 ? 'bg-danger' : pct >= 75 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Reservation list */}
                      <div className="d-flex flex-column gap-1">
                        {grupo.map(r => (
                          <div key={r.id} className="reservation-row">
                            <div>
                              <span className="fw-semibold">{r.nombreCliente}</span>
                              <Badge bg="light" text="dark" className="ms-2">{r.cantidadPersonas} persona{r.cantidadPersonas !== 1 ? 's' : ''}</Badge>
                            </div>
                            <Badge bg={r.estado === 'CONFIRMADA' ? 'success' : r.estado === 'PENDIENTE' ? 'warning' : 'secondary'}
                              text={r.estado === 'PENDIENTE' ? 'dark' : undefined}
                            >
                              {r.estado}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}
        </section>
      )}

      {!hasAloj && !hasSend && (
        <div className="text-center text-muted py-4">No hay reservas activas para este día.</div>
      )}
    </div>
  );
};

const AlojCard: React.FC<{ r: Reserva; type: 'checkin' | 'checkout' | 'instay' }> = ({ r, type }) => {
  const colorMap = { checkin: 'success', checkout: 'danger', instay: 'primary' } as const;
  return (
    <div className={`aloj-card border-start border-4 border-${colorMap[type]} ps-3 mb-2`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="fw-semibold">{r.nombreCliente}</div>
          <div className="text-muted small">{r.habitacion?.nombre || 'Alojamiento'}</div>
          {type === 'checkin' && r.fechaFin && (
            <div className="text-muted small">
              Check-out: {new Date(r.fechaFin + 'T12:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })}
            </div>
          )}
          {type === 'checkout' && r.fechaReserva && (
            <div className="text-muted small">
              Check-in fue: {new Date(r.fechaReserva + 'T12:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })}
            </div>
          )}
        </div>
        <Badge bg="secondary" className="ms-2">{r.cantidadPersonas} persona{r.cantidadPersonas !== 1 ? 's' : ''}</Badge>
      </div>
    </div>
  );
};

export default CalendarView;
