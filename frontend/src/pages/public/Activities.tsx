import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import { useApi } from '../../hooks/useApi';

const Activities: React.FC = () => {
  const { getSenderos } = useApi();
  const [senderos, setSenderos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSenderos = async () => {
      try {
        setLoading(true);
        const response = await getSenderos();
        if (response.success) {
          setSenderos(response.data);
        } else {
          setError('No se pudieron cargar los senderos');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchSenderos();
  }, []);

  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad?.toLowerCase()) {
      case 'facil': return 'success';
      case 'moderado': return 'warning';
      case 'dificil': return 'danger';
      case 'experto': return 'dark';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="my-4">
        <h1>Actividades y Senderos</h1>
        <p>Cargando senderos...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <h1>Actividades y Senderos</h1>
        <div className="alert alert-info">
          <h4>Actividades Disponibles</h4>
          <p>🥾 <strong>Senderismo guiado</strong> - Explora nuestros 7 senderos</p>
          <p>🐦 <strong>Observación de aves</strong> - Más de 280 especies registradas</p>
          <p>📷 <strong>Fotografía de naturaleza</strong> - Captura la belleza del lugar</p>
          <p className="text-muted">Para más información, contacta: +598 98394653</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1>Actividades y Senderos</h1>
      <p>Descubre nuestros senderos y actividades en plena naturaleza</p>
      
      <Row>
        {senderos.length > 0 ? (
          senderos.map((sendero: any) => (
            <Col key={sendero.id} md={6} lg={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>
                    {sendero.nombre}
                    <Badge 
                      bg={getDifficultyColor(sendero.dificultad)} 
                      className="ms-2"
                    >
                      {sendero.dificultad}
                    </Badge>
                  </Card.Title>
                  <Card.Text>{sendero.descripcion}</Card.Text>
                  <p><strong>Duración:</strong> {sendero.duracionEstimadaHoras}h</p>
                  <p><strong>Distancia:</strong> {sendero.distanciaKm} km</p>
                  <p><strong>Capacidad:</strong> {sendero.capacidadMaxima} personas</p>
                  {sendero.precioPorPersona && (
                    <p><strong>Precio:</strong> ${sendero.precioPorPersona}</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <div className="alert alert-info">
              <h4>Senderos Disponibles</h4>
              <p>🥾 Tenemos 7 senderos guiados disponibles</p>
              <p>🐦 Observación de aves especializada</p>
              <p>📷 Oportunidades únicas para fotografía</p>
              <p>Para reservas y más información: +598 98394653</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  )
}

export default Activities 