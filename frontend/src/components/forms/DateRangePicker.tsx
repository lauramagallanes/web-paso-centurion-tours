import React, { useState, useRef, useEffect } from 'react';
import Calendar from '../common/Calendar';
import './DateRangePicker.css';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  id?: string;
  name?: string;
  label?: string;
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  availableDates?: Date[];
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  minNights?: number;
  maxNights?: number;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  id,
  name,
  label,
  value = { startDate: null, endDate: null },
  onChange,
  placeholder = 'Seleccionar fechas',
  minDate,
  maxDate,
  disabledDates,
  availableDates,
  required = false,
  error,
  className = '',
  disabled = false,
  minNights = 1,
  maxNights
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectingEnd, setSelectingEnd] = useState(false);
  const dateRangePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.startDate && value.endDate) {
      setInputValue(formatDateRange(value.startDate, value.endDate));
    } else if (value.startDate) {
      setInputValue(`${formatDate(value.startDate)} - Seleccionar salida`);
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangePickerRef.current && !dateRangePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingEnd(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-UY', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${formatDate(startDate)} - ${formatDate(endDate)} (${nights} noche${nights !== 1 ? 's' : ''})`;
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSelectingEnd(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (!value.startDate || selectingEnd) {
      // Selecting start date or end date
      if (!value.startDate) {
        onChange({ startDate: date, endDate: null });
        setSelectingEnd(true);
      } else {
        // Selecting end date
        if (date > value.startDate) {
          const nights = Math.ceil((date.getTime() - value.startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check min/max nights
          if (nights >= minNights && (!maxNights || nights <= maxNights)) {
            onChange({ startDate: value.startDate, endDate: date });
            setIsOpen(false);
            setSelectingEnd(false);
          }
        } else {
          // Selected date is before start date, make it the new start date
          onChange({ startDate: date, endDate: null });
          setSelectingEnd(true);
        }
      }
    } else {
      // Both dates are selected, start over
      onChange({ startDate: date, endDate: null });
      setSelectingEnd(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: null, endDate: null });
    setSelectingEnd(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleInputClick();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectingEnd(false);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!value.startDate || !value.endDate) return false;
    return date >= value.startDate && date <= value.endDate;
  };

  const isDateDisabledForRange = (date: Date) => {
    // Standard disabled check
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates?.some(disabledDate => 
      date.getDate() === disabledDate.getDate() &&
      date.getMonth() === disabledDate.getMonth() &&
      date.getFullYear() === disabledDate.getFullYear()
    )) return true;

    // If selecting end date, check min/max nights
    if (value.startDate && selectingEnd) {
      const nights = Math.ceil((date.getTime() - value.startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (date <= value.startDate) return true;
      if (nights < minNights) return true;
      if (maxNights && nights > maxNights) return true;
    }

    // If availableDates is provided, only allow those dates
    if (availableDates && availableDates.length > 0) {
      return !availableDates.some(availableDate => 
        date.getDate() === availableDate.getDate() &&
        date.getMonth() === availableDate.getMonth() &&
        date.getFullYear() === availableDate.getFullYear()
      );
    }

    return false;
  };

  return (
    <div className={`date-range-picker ${className}`} ref={dateRangePickerRef}>
      {label && (
        <label htmlFor={id} className="date-range-picker-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className={`date-range-picker-input-container ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          id={id}
          name={name}
          type="text"
          className="date-range-picker-input"
          value={inputValue}
          placeholder={placeholder}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          readOnly
          disabled={disabled}
          required={required}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        />
        
        <div className="date-range-picker-icons">
          {(value.startDate || value.endDate) && !disabled && (
            <button
              type="button"
              className="date-range-picker-clear"
              onClick={handleClear}
              aria-label="Limpiar fechas"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          <div className="date-range-picker-calendar-icon">
            📅
          </div>
        </div>
      </div>

      {error && (
        <div className="date-range-picker-error" role="alert">
          {error}
        </div>
      )}

      {isOpen && (
        <div className="date-range-picker-dropdown">
          <div className="date-range-picker-header">
            <h4>
              {!value.startDate 
                ? 'Selecciona fecha de entrada' 
                : selectingEnd 
                  ? 'Selecciona fecha de salida' 
                  : 'Selecciona nuevas fechas'
              }
            </h4>
            {value.startDate && selectingEnd && (
              <p className="range-info">
                Mínimo {minNights} noche{minNights !== 1 ? 's' : ''}
                {maxNights && `, máximo ${maxNights} noches`}
              </p>
            )}
          </div>
          
          <Calendar
            selectedDate={selectingEnd ? value.endDate : value.startDate}
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            availableDates={availableDates}
            showMonthNavigation={true}
            className="range-calendar"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

