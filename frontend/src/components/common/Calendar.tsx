import React, { useState, useEffect } from 'react';
import './Calendar.css';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  availableDates?: Date[];
  className?: string;
  showMonthNavigation?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  availableDates,
  className = '',
  showMonthNavigation = true
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isDateDisabled = (date: Date) => {
    // Check min/max dates
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    // Check explicitly disabled dates
    if (disabledDates.some(disabledDate => isSameDay(date, disabledDate))) return true;

    // If availableDates is provided, only allow those dates
    if (availableDates && availableDates.length > 0) {
      return !availableDates.some(availableDate => isSameDay(date, availableDate));
    }

    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isSelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!isDateDisabled(date)) {
      onDateSelect(date);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const today = isToday(date);
      const selected = isSelected(date);

      days.push(
        <button
          key={day}
          className={`calendar-day ${disabled ? 'disabled' : ''} ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          aria-label={`${day} de ${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`calendar ${className}`}>
      {showMonthNavigation && (
        <div className="calendar-header">
          <button
            className="calendar-nav-btn"
            onClick={() => navigateMonth('prev')}
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h3 className="calendar-title">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            className="calendar-nav-btn"
            onClick={() => navigateMonth('next')}
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
      )}

      <div className="calendar-weekdays">
        {dayNames.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {renderCalendarDays()}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color today-indicator"></div>
          <span>Hoy</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected-indicator"></div>
          <span>Seleccionado</span>
        </div>
        <div className="legend-item">
          <div className="legend-color disabled-indicator"></div>
          <span>No disponible</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

