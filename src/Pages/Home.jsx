

import ImageCarousel from "../Components/imageCarousel"
import "../css/Home.css"
import { images } from "../utils/images"
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Home = () => {
  return (
    <main className="home-container">
    <header className="home-header" aria-labelledby="main-title">
      <h1 id="main-title" className="home-title">
        Tinambú - Paso Centurión
      </h1>
      <ImageCarousel/>
    </header>

    <section className="birdwatching" aria-labelledby="hero-title">
    <Container>
      <Row>
        <Col>
          <h4>Birdwatching Observación de aves</h4>
        </Col>
        <Col xs={6}>
          <img src={images.bataraPintado} alt="batara pintado" style={{maxWidth: "70%"}}/>
        </Col>
        <Col>
          <p>Paso Centurion es uno de los mejores lugares del uruguay para observar aves, con mas de 280 especies registradas, entre las que destacan el Surucuá, el Batará Pintado, la Perdiz de Monte, y el Anambé Grande</p>
        </Col>
      </Row>
      <Row className="accomodations">
        <Col>
          <p>Habitacion contruida en barro con techo vivo</p>
        </Col>
        <Col xs={5}>
          <img src={images.ocaso} alt="alojamiento en Tinambú" style={{maxWidth: "100%"}} />
        </Col>
        <Col>
          <h4>Alojamiento</h4>
        </Col>
      </Row>
      <Row classname="senderismo">
        <Col>
          <h4>Senderismo</h4>
        </Col>
        <Col xs={6}>
          <img src={images.grupoPersonas2} alt="senderismo en Rio Yaguarón" style={{maxWidth: "70%"}}/>
        </Col>
        <Col>
          <p>Paso Centurion es uno de los mejores lugares del uruguay para observar aves, con mas de 280 especies registradas, entre las que destacan el Surucuá, el Batará Pintado, la Perdiz de Monte, y el Anambé Grande</p>
        </Col>
      </Row>
    </Container>
    </section>

    <section className="home-features" aria-labelledby="features-title">
      
    </section>

    <script type="application/ld+json">
      {`
      {
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        "name": "Paso Centurión",
        "description": "Un destino único para amantes del eco y aviturismo, hogar de especies como el Trogon surrucura y paisajes inigualables.",
        "image": "https://source.unsplash.com/featured/?nature,landscape",
        "url": "https://www.facebook.com/tinambupasocenturion",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": -32.1394676,
          "longitude": -53.7628972
        },
        "offers": {
          "@type": "Offer",
          "name": "Alojamiento, Observación de Aves y Senderismo Guiado",
          "price": "Consultar",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }
      `}
    </script>
  </main>
  )
}

export default Home