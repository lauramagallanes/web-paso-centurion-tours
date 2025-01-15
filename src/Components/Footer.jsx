import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import "../css/Footer.css"



const Footer = () => {
  return (
    <Container className='footer'>
      <Row>
        <Col>Contacto: +598 98394653</Col>
        <Col>email: pasocenturiontours@gmail.com</Col>
        <Col> 
          <a href="https://www.facebook.com/tinambupasocenturion" target="_blank">
          <i className="fab fa-facebook" style={{ fontSize: '32px', color: '#1877f2' }}></i>
          </a>
        </Col>
        <Col>Tinambú - Paso Centurión Tours</Col>
      </Row>
    </Container>
  )
}

export default Footer