import React, { useState } from 'react';
import Calendar from '../../components/common/Calendar';
import DatePicker from '../../components/forms/DatePicker';
import DateRangePicker from '../../components/forms/DateRangePicker';
import Button from '../../components/common/Button';
import './CalendarDemo.css';

const CalendarDemo: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerDate, setPickerDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });

  // Mock data for demonstration
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const disabledDates = [
    new Date(today.getFullYear(), today.getMonth(), 15),
    new Date(today.getFullYear(), today.getMonth(), 25),
    new Date(today.getFullYear(), today.getMonth() + 1, 5)
  ];

  const availableDates = [
    today,
    tomorrow,
    nextWeek,
    nextMonth,
    new Date(today.getFullYear(), today.getMonth(), 10),
    new Date(today.getFullYear(), today.getMonth(), 20),
    new Date(today.getFullYear(), today.getMonth() + 1, 15)
  ];

  const handleReset = () => {
    setSelectedDate(null);
    setPickerDate(null);
    setDateRange({ startDate: null, endDate: null });
  };

  return (
    <div className="calendar-demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="page-title">📅 Calendario y Selectores de Fecha</h1>
          <p className="page-description">
            Demostración de los componentes de calendario para reservas y selección de fechas.
          </p>
          <Button variant="ghost" onClick={handleReset}>
            Reiniciar Todo
          </Button>
        </div>

        <div className="demo-grid">
          {/* Calendar Component */}
          <div className="demo-section">
            <h2 className="section-title">Calendario Básico</h2>
            <p className="section-description">
              Calendario con fechas disponibles específicas y fechas deshabilitadas.
            </p>
            <div className="component-showcase">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                minDate={today}
                availableDates={availableDates}
                disabledDates={disabledDates}
              />
              {selectedDate && (
                <div className="selection-info">
                  <strong>Fecha seleccionada:</strong><br />
                  {selectedDate.toLocaleDateString('es-UY', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>

          {/* DatePicker Component */}
          <div className="demo-section">
            <h2 className="section-title">Selector de Fecha</h2>
            <p className="section-description">
              Input con dropdown de calendario para formularios.
            </p>
            <div className="component-showcase">
              <DatePicker
                label="Fecha de la actividad"
                value={pickerDate}
                onChange={setPickerDate}
                placeholder="Seleccionar fecha de actividad"
                minDate={today}
                availableDates={availableDates}
                required
              />
              
              <DatePicker
                label="Fecha con restricciones"
                value={null}
                onChange={() => {}}
                placeholder="Solo fechas específicas"
                availableDates={availableDates}
                className="mt-4"
              />
              
              <DatePicker
                label="Campo deshabilitado"
                value={today}
                onChange={() => {}}
                disabled
                className="mt-4"
              />
            </div>
          </div>

          {/* DateRangePicker Component */}
          <div className="demo-section full-width">
            <h2 className="section-title">Selector de Rango de Fechas</h2>
            <p className="section-description">
              Perfecto para reservas de alojamiento con entrada y salida.
            </p>
            <div className="component-showcase">
              <div className="range-picker-examples">
                <DateRangePicker
                  label="Fechas de estadía"
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Seleccionar entrada y salida"
                  minDate={today}
                  minNights={1}
                  maxNights={14}
                  required
                />
                
                <DateRangePicker
                  label="Reserva con fechas limitadas"
                  value={{ startDate: null, endDate: null }}
                  onChange={() => {}}
                  placeholder="Solo fechas disponibles"
                  availableDates={availableDates}
                  minNights={2}
                  maxNights={7}
                  className="mt-4"
                />
              </div>
              
              {dateRange.startDate && dateRange.endDate && (
                <div className="selection-info">
                  <strong>Rango seleccionado:</strong><br />
                  <div className="range-details">
                    <div>📅 Entrada: {dateRange.startDate.toLocaleDateString('es-UY')}</div>
                    <div>📅 Salida: {dateRange.endDate.toLocaleDateString('es-UY')}</div>
                    <div>🌙 Noches: {Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features Showcase */}
          <div className="demo-section full-width">
            <h2 className="section-title">Características</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Fechas Específicas</h3>
                <p>Permite solo fechas disponibles para reservas</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🚫</div>
                <h3>Fechas Bloqueadas</h3>
                <p>Deshabilita fechas específicas o rangos</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🌙</div>
                <h3>Mín/Máx Noches</h3>
                <p>Control de duración de estadías</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>Responsive</h3>
                <p>Se adapta perfectamente a móviles</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🌓</div>
                <h3>Temas</h3>
                <p>Soporte completo para dark/light mode</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">♿</div>
                <h3>Accesible</h3>
                <p>Navegación por teclado y screen readers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDemo;

