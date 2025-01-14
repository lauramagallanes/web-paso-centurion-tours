import "../css/Home.css"

const Home = () => {
  return (
    <main className="home-container">
    <header className="home-header" aria-labelledby="main-title">
      <h1 id="main-title" className="home-title">
        Paso Centurión
      </h1>
      <p className="home-subtitle">
        Un santuario natural para amantes del eco y aviturismo.
      </p>
    </header>

    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero-content">
        <h2 id="hero-title" className="home-hero-title">
          Explora la Naturaleza
        </h2>
        <p className="home-hero-text">
          Sumérgete en la riqueza de Paso Centurión. Desde aves exóticas hasta
          paisajes que inspiran paz, vive una experiencia inolvidable rodeado
          de biodiversidad.
        </p>
        <button className="home-cta-button" aria-label="Descubre más sobre Paso Centurión">
          Descubre más
        </button>
      </div>
      <img
        src="https://source.unsplash.com/featured/?nature,landscape"
        alt="Un paisaje natural de Paso Centurión con montañas y vegetación exuberante."
        className="home-hero-image"
      />
    </section>

    <section className="home-features" aria-labelledby="features-title">
      <h2 id="features-title" className="home-section-title">
        Descubre lo que tenemos para ti
      </h2>
      <div className="home-feature" role="article" aria-labelledby="feature-1-title">
        <img
          src="https://source.unsplash.com/featured/?birds"
          alt="Aves exóticas en su hábitat natural."
          className="home-feature-image"
        />
        <h3 id="feature-1-title" className="home-feature-title">
          Aves Únicas
        </h3>
        <p className="home-feature-text">
          Descubre especies exclusivas como el Trogon surrucura en su entorno
          natural.
        </p>
      </div>
      <div className="home-feature" role="article" aria-labelledby="feature-2-title">
        <img
          src="https://source.unsplash.com/featured/?forest"
          alt="Bosques nativos en Paso Centurión."
          className="home-feature-image"
        />
        <h3 id="feature-2-title" className="home-feature-title">
          Bosques Nativos
        </h3>
        <p className="home-feature-text">
          Camina entre paisajes intactos que cuentan la historia de nuestro
          ecosistema.
        </p>
      </div>
      <div className="home-feature" role="article" aria-labelledby="feature-3-title">
        <img
          src="https://source.unsplash.com/featured/?hiking"
          alt="Senderos guiados por Paso Centurión."
          className="home-feature-image"
        />
        <h3 id="feature-3-title" className="home-feature-title">
          Senderismo Guiado
        </h3>
        <p className="home-feature-text">
          Aventúrate por rutas impresionantes acompañado de guías locales.
        </p>
      </div>
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