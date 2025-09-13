import React, { useState, useEffect } from 'react';
import './DatePickerModal.css';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  minDate?: string;
  maxDate?: string;
  allowRange?: boolean;
  title?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  initialStartDate,
  initialEndDate,
  minDate,
  maxDate,
  allowRange = false,
  title = 'Seleccionar Fechas'
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    initialEndDate ? new Date(initialEndDate) : null
  );
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);

  const today = new Date();
  const minDateObj = minDate ? new Date(minDate) : today;
  const maxDateObj = maxDate ? new Date(maxDate) : new Date(today.getFullYear() + 1, 11, 31);

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(selectedStartDate || today);
    }
  }, [isOpen, selectedStartDate]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    return date < minDateObj || date > maxDateObj;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedStartDate) return false;
    
    if (allowRange && selectedEndDate) {
      return date >= selectedStartDate && date <= selectedEndDate;
    }
    
    return date.toDateString() === selectedStartDate.toDateString();
  };

  const isDateInRange = (date: Date) => {
    if (!allowRange || !selectedStartDate) return false;
    
    if (isSelectingEndDate && !selectedEndDate) {
      // Show preview range
      return date >= selectedStartDate;
    }
    
    if (selectedEndDate) {
      return date > selectedStartDate && date < selectedEndDate;
    }
    
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!allowRange) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }

    // Range selection logic
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingEndDate(true);
    } else if (isSelectingEndDate) {
      if (date >= selectedStartDate) {
        setSelectedEndDate(date);
        setIsSelectingEndDate(false);
      } else {
        // If clicked date is before start date, make it the new start date
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const handleSave = () => {
    if (!selectedStartDate) return;

    const startDateStr = selectedStartDate.toISOString().split('T')[0];
    const endDateStr = selectedEndDate 
      ? selectedEndDate.toISOString().split('T')[0]
      : startDateStr;

    onDateSelect(startDateStr, endDateStr);
    onClose();
  };

  const handleClear = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingEndDate(false);
  };

  if (!isOpen) return null;

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="date-picker-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        <div className="date-picker-body">
          <div className="calendar-header">
            <button 
              className="nav-btn"
              onClick={() => navigateMonth('prev')}
              disabled={currentMonth <= minDateObj}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
              </svg>
            </button>

            <div className="month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>

            <button 
              className="nav-btn"
              onClick={() => navigateMonth('next')}
              disabled={currentMonth >= maxDateObj}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
              </svg>
            </button>
          </div>

          <div className="calendar-grid">
            {dayNames.map(day => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}
            
            {days.map((date, index) => (
              <div
                key={index}
                className={`day-cell ${!date ? 'empty' : ''} ${
                  date && isDateDisabled(date) ? 'disabled' : ''
                } ${
                  date && isDateSelected(date) ? 'selected' : ''
                } ${
                  date && isDateInRange(date) ? 'in-range' : ''
                } ${
                  date && date.toDateString() === today.toDateString() ? 'today' : ''
                }`}
                onClick={() => date && handleDateClick(date)}
              >
                {date?.getDate()}
              </div>
            ))}
          </div>

          {allowRange && selectedStartDate && (
            <div className="selection-info">
              {isSelectingEndDate ? (
                <p>Selecciona la fecha de fin</p>
              ) : (
                <p>
                  {selectedEndDate ? (
                    <>
                      Del <strong>{selectedStartDate.toLocaleDateString()}</strong> al{' '}
                      <strong>{selectedEndDate.toLocaleDateString()}</strong>
                    </>
                  ) : (
                    <>
                      Fecha seleccionada: <strong>{selectedStartDate.toLocaleDateString()}</strong>
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          {!allowRange && selectedStartDate && (
            <div className="selection-info">
              <p>
                Fecha seleccionada: <strong>{selectedStartDate.toLocaleDateString()}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="date-picker-footer">
          <button className="btn-secondary" onClick={handleClear}>
            Limpiar
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={!selectedStartDate}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;
