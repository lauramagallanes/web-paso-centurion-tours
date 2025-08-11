import React, { useState, useRef, useEffect } from 'react';
import Calendar from '../common/Calendar';
import './DatePicker.css';

interface DatePickerProps {
  id?: string;
  name?: string;
  label?: string;
  value?: Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  availableDates?: Date[];
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate,
  maxDate,
  disabledDates,
  availableDates,
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setInputValue(formatDate(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleInputClick();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`date-picker ${className}`} ref={datePickerRef}>
      {label && (
        <label htmlFor={id} className="date-picker-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className={`date-picker-input-container ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          id={id}
          name={name}
          type="text"
          className="date-picker-input"
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
        
        <div className="date-picker-icons">
          {value && !disabled && (
            <button
              type="button"
              className="date-picker-clear"
              onClick={handleClear}
              aria-label="Limpiar fecha"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          <div className="date-picker-calendar-icon">
            📅
          </div>
        </div>
      </div>

      {error && (
        <div className="date-picker-error" role="alert">
          {error}
        </div>
      )}

      {isOpen && (
        <div className="date-picker-dropdown">
          <Calendar
            selectedDate={value}
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            availableDates={availableDates}
            showMonthNavigation={true}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;

