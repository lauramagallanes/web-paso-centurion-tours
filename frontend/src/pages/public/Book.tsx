import React from 'react';
import BookingForm from '../../components/forms/BookingForm';
import Container from 'react-bootstrap/Container';

const Book: React.FC = () => {
  return (
    <Container className="my-4">
      <h1>Realizar Reserva</h1>
      <p>Completa el formulario para reservar tu experiencia en Tinambú - Paso Centurión</p>
      <BookingForm />
    </Container>
  )
}

export default Book 