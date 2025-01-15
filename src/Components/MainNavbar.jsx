
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

function MainNavbar() {
  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home">Tinambu</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#home">Principal</Nav.Link>
            <Nav.Link href="#features">Tinambú</Nav.Link>
            <Nav.Link href="#accomodations">Alojamiento</Nav.Link>
            <Nav.Link href="#activities">Actividades</Nav.Link>
            <Nav.Link href="#birds">Aves</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      
    </>
  );
}

export default MainNavbar;