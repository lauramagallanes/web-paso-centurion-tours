import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { useApi } from '../../hooks/useApi';

const Accomodations: React.FC = () => {
  const { getHabitaciones } = useApi();
  const [habitaciones, setHabitaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHabitaciones = async () => {
      try {
        setLoading(true);
        const response = await getHabitaciones();
        if (response.success) {
          setHabitaciones(response.data);
        } else {
          setError('No se pudieron cargar las habitaciones');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchHabitaciones();
  }, []);

  if (loading) {
    return (
      <Container className="my-4">
        <h1>Alojamiento</h1>
        <p>Cargando habitaciones...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <h1>Alojamiento</h1>
        <div className="alert alert-info">
          <h4>Información de Alojamiento</h4>
          <p>Habitación construida en barro con techo vivo</p>
          <p>Capacidad para hasta 4 personas</p>
          <p>Acceso a observatorio de aves</p>
          <p className="text-muted">Para reservas, contacta directamente: +598 98394653</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1>Alojamiento en Tinambú</h1>
      <p>Descubre nuestras opciones de alojamiento en plena naturaleza</p>
      
      <Row>
        {habitaciones.length > 0 ? (
          habitaciones.map((habitacion: any) => (
            <Col key={habitacion.id} md={6} lg={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{habitacion.nombre}</Card.Title>
                  <Card.Text>{habitacion.descripcion}</Card.Text>
                  <p><strong>Capacidad:</strong> {habitacion.capacidadMaxima} personas</p>
                  <p><strong>Precio por noche:</strong> ${habitacion.precioPorNoche}</p>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <div className="alert alert-info">
              <h4>Alojamiento Disponible</h4>
              <p>Habitación construida en barro con techo vivo</p>
              <p>Capacidad para hasta 4 personas</p>
              <p>Acceso a observatorio de aves</p>
              <p>Para reservas, contacta: +598 98394653</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  )
}

export default Accomodations 