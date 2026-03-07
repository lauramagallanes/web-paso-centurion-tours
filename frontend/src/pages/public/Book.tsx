import React from 'react';
import BookingForm from '../../components/forms/BookingForm';
import './Book.css';

const Book: React.FC = () => {
  return (
    <div className="book-page">
      {/* Hero */}
      <section className="book-hero">
        <div className="book-hero-overlay" />
        <div className="container">
          <div className="book-hero-content">
            <div className="book-hero-badge">
              <i className="bi bi-calendar-check" />
              Reservas
            </div>
            <h1 className="book-hero-title">Realizar Reserva</h1>
            <p className="book-hero-subtitle">
              Completa el formulario para reservar tu experiencia en Tinambú · Paso Centurión
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="book-form-section">
        <div className="container">
          <BookingForm />
        </div>
      </section>
    </div>
  );
};

export default Book;
