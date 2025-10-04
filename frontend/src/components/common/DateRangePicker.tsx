import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onDateRangeSelect: (checkIn: Date, checkOut: Date) => void;
  checkInDate?: Date | null;
  checkOutDate?: Date | null;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  isOpen,
  onClose,
  onDateRangeSelect,
  checkInDate,
  checkOutDate,
  disabledDates = [],
  minDate = new Date(),
  maxDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [nextMonthDate, setNextMonthDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  });
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(checkInDate || null);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(checkOutDate || null);

  useEffect(() => {
    if (isOpen) {
      setTempCheckIn(checkInDate || null);
      setTempCheckOut(checkOutDate || null);
    }
  }, [isOpen, checkInDate, checkOutDate]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
      setNextMonthDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
      setNextMonthDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of the week for the first day (0 = Sunday, adjust to make Monday = 0)
    let startingDayOfWeek = firstDay.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Convert Sunday from 0 to 6
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    return disabledDates.some(disabledDate => 
      date.toDateString() === disabledDate.toDateString()
    );
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
      // Start new selection
      setTempCheckIn(date);
      setTempCheckOut(null);
    } else if (tempCheckIn && !tempCheckOut) {
      // Complete the range
      if (date >= tempCheckIn) {
        setTempCheckOut(date);
      } else {
        // If selected date is before check-in, make it the new check-in
        setTempCheckIn(date);
        setTempCheckOut(null);
      }
    }
  };

  const isDateInRange = (date: Date | null) => {
    if (!date || !tempCheckIn) return false;
    if (!tempCheckOut) return false;
    return date >= tempCheckIn && date <= tempCheckOut;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date) return false;
    return (tempCheckIn && date.toDateString() === tempCheckIn.toDateString()) ||
           (tempCheckOut && date.toDateString() === tempCheckOut.toDateString());
  };

  const handleSave = () => {
    if (tempCheckIn && tempCheckOut) {
      onDateRangeSelect(tempCheckIn, tempCheckOut);
      onClose();
    }
  };

  const renderCalendar = (date: Date) => {
    const days = getDaysInMonth(date);

    return (
      <div className="date-picker-calendar">
        <div className="date-picker-header">
          <h3>{monthNames[date.getMonth()]} {date.getFullYear()}</h3>
        </div>
        
        <div className="date-picker-weekdays">
          {dayNames.map(day => (
            <div key={day} className="date-picker-weekday">
              {day}
            </div>
          ))}
        </div>
        
        <div className="date-picker-days">
          {days.map((day, index) => (
            <div
              key={index}
              className={`date-picker-day ${
                day ? '' : 'empty'
              } ${
                day && isDateDisabled(day) ? 'disabled' : ''
              } ${
                day && isDateSelected(day) ? 'selected' : ''
              } ${
                day && isDateInRange(day) ? 'in-range' : ''
              } ${
                day && tempCheckIn && day.toDateString() === tempCheckIn.toDateString() ? 'check-in' : ''
              } ${
                day && tempCheckOut && day.toDateString() === tempCheckOut.toDateString() ? 'check-out' : ''
              }`}
              onClick={() => day && handleDateClick(day)}
            >
              {day ? day.getDate() : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="date-picker-overlay">
      <div className="date-picker-modal">
        <div className="date-picker-modal-header">
          <h2>Selecciona tu fecha</h2>
          <button className="date-picker-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="date-picker-navigation">
          <button 
            className="date-picker-nav-btn"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            className="date-picker-nav-btn"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="date-picker-calendars">
          {renderCalendar(currentDate)}
          {renderCalendar(nextMonthDate)}
        </div>
        
        <div className="date-picker-footer">
          <div className="date-picker-selection-info">
            {tempCheckIn && (
              <div className="selection-dates">
                <span className="check-in-date">
                  Check-in: {tempCheckIn.toLocaleDateString('es-ES')}
                </span>
                {tempCheckOut && (
                  <span className="check-out-date">
                    Check-out: {tempCheckOut.toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button 
            className="date-picker-save-btn"
            onClick={handleSave}
            disabled={!tempCheckIn || !tempCheckOut}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
