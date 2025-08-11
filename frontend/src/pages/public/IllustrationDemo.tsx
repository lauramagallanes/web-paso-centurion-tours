import React from 'react';
import Illustration, { IllustrationName } from '../../components/common/Illustration';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import './IllustrationDemo.css';

const IllustrationDemo: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // All available illustrations organized by category
  const emptyStateIllustrations: IllustrationName[] = [
    'empty-cart', 'empty-favorites', 'empty-bookings'
  ];

  const heroIllustrations: IllustrationName[] = [
    'nature-hero', 'bird-watching', 'eco-tourism'
  ];

  const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
  const colors = ['current', 'primary', 'secondary', 'accent', 'muted'] as const;

  return (
    <div className="illustration-demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="page-title">🎨 Sistema de Ilustraciones SVG</h1>
          <p className="page-description">
            Biblioteca de ilustraciones personalizadas para estados vacíos, hero sections y elementos decorativos.
          </p>
          <Button variant="ghost" onClick={toggleTheme}>
            Cambiar a modo {theme === 'light' ? 'oscuro' : 'claro'}
          </Button>
        </div>

        <div className="demo-grid">
          {/* Empty State Illustrations */}
          <div className="demo-section">
            <h2 className="section-title">🕳️ Ilustraciones de Estados Vacíos</h2>
            <p className="section-description">
              Ilustraciones amigables para cuando no hay contenido que mostrar.
            </p>
            <div className="illustration-grid">
              {emptyStateIllustrations.map((illustrationName) => (
                <div key={illustrationName} className="illustration-showcase-item">
                  <div className="illustration-display">
                    <Illustration name={illustrationName} size="md" />
                  </div>
                  <code className="illustration-name">{illustrationName}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Illustrations */}
          <div className="demo-section">
            <h2 className="section-title">🌟 Ilustraciones Hero/Decorativas</h2>
            <p className="section-description">
              Ilustraciones temáticas para secciones principales y elementos decorativos.
            </p>
            <div className="illustration-grid">
              {heroIllustrations.map((illustrationName) => (
                <div key={illustrationName} className="illustration-showcase-item">
                  <div className="illustration-display hero">
                    <Illustration name={illustrationName} size="lg" />
                  </div>
                  <code className="illustration-name">{illustrationName}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes Demo */}
          <div className="demo-section full-width">
            <h2 className="section-title">📏 Tamaños de Ilustraciones</h2>
            <p className="section-description">
              Diferentes tamaños disponibles para diversos contextos de uso.
            </p>
            <div className="size-demo">
              {sizes.map((size) => (
                <div key={size} className="size-demo-item">
                  <h4>{size.toUpperCase()}</h4>
                  <div className="size-illustration">
                    <Illustration name="bird-watching" size={size} />
                  </div>
                  <code>{size}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Colors Demo */}
          <div className="demo-section full-width">
            <h2 className="section-title">🎨 Colores de Ilustraciones</h2>
            <p className="section-description">
              Variaciones de color que se adaptan al sistema de diseño.
            </p>
            <div className="color-demo">
              {colors.map((color) => (
                <div key={color} className="color-demo-item">
                  <h4>{color}</h4>
                  <div className="color-illustration">
                    <Illustration name="eco-tourism" size="md" color={color} />
                  </div>
                  <code>color="{color}"</code>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State Components Demo */}
          <div className="demo-section full-width">
            <h2 className="section-title">🔧 Componentes EmptyState</h2>
            <p className="section-description">
              Componentes completos de estado vacío con ilustraciones integradas.
            </p>
            <div className="empty-state-demo">
              <div className="empty-state-example">
                <h4>Carrito Vacío</h4>
                <div className="empty-state-preview">
                  <EmptyState
                    illustration="empty-cart"
                    title="Tu carrito está vacío"
                    description="Agrega productos para comenzar tu compra."
                    primaryAction={{
                      label: "Explorar Productos",
                      onClick: () => alert('¡Navegando a productos!'),
                      variant: "primary"
                    }}
                  />
                </div>
              </div>

              <div className="empty-state-example">
                <h4>Sin Favoritos</h4>
                <div className="empty-state-preview">
                  <EmptyState
                    illustration="empty-favorites"
                    title="Aún no tienes favoritos"
                    description="Marca tus elementos favoritos para encontrarlos fácilmente."
                    primaryAction={{
                      label: "Explorar",
                      onClick: () => alert('¡Navegando a explorar!'),
                      variant: "primary"
                    }}
                    secondaryAction={{
                      label: "Ayuda",
                      onClick: () => alert('¡Mostrando ayuda!'),
                      variant: "ghost"
                    }}
                  />
                </div>
              </div>

              <div className="empty-state-example">
                <h4>Sin Reservas</h4>
                <div className="empty-state-preview">
                  <EmptyState
                    illustration="empty-bookings"
                    title="No tienes reservas"
                    description="Reserva actividades y alojamientos para tu próxima aventura."
                    primaryAction={{
                      label: "Ver Actividades",
                      onClick: () => alert('¡Navegando a actividades!'),
                      variant: "primary"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Examples */}
          <div className="demo-section full-width">
            <h2 className="section-title">⚡ Ilustraciones Interactivas</h2>
            <p className="section-description">
              Ilustraciones con animaciones y efectos interactivos.
            </p>
            <div className="interactive-demo">
              <div className="interactive-example">
                <h4>Con Animaciones</h4>
                <div className="animated-illustrations">
                  <Illustration 
                    name="nature-hero" 
                    size="lg" 
                    className="fade-in"
                  />
                  <Illustration 
                    name="bird-watching" 
                    size="lg" 
                    className="slide-up"
                  />
                  <Illustration 
                    name="eco-tourism" 
                    size="lg" 
                    className="float"
                  />
                </div>
                <p>Animaciones: fade-in, slide-up, float</p>
              </div>
              
              <div className="interactive-example">
                <h4>Interactivas</h4>
                <div className="clickable-illustrations">
                  <Illustration 
                    name="empty-cart" 
                    size="lg" 
                    className="interactive"
                    onClick={() => alert('¡Carrito clickeado!')}
                  />
                  <Illustration 
                    name="empty-favorites" 
                    size="lg" 
                    className="interactive"
                    onClick={() => alert('¡Favoritos clickeado!')}
                  />
                </div>
                <p>Click en las ilustraciones para interactuar</p>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="demo-section full-width">
            <h2 className="section-title">🛠️ Ejemplos de Uso</h2>
            <div className="usage-examples">
              <div className="usage-example">
                <h4>🃏 En Tarjetas</h4>
                <div className="card-example">
                  <div className="card-illustration">
                    <Illustration name="bird-watching" size="md" />
                  </div>
                  <div className="card-content">
                    <h5>Observación de Aves</h5>
                    <p>Descubre la rica biodiversidad de Tinambú</p>
                  </div>
                </div>
                <code>Ilustración como elemento decorativo</code>
              </div>
              
              <div className="usage-example">
                <h4>🖼️ Como Fondo</h4>
                <div className="hero-example">
                  <div className="hero-illustration">
                    <Illustration name="nature-hero" size="full" />
                  </div>
                  <div className="hero-content">
                    <h5>Bienvenido a Tinambú</h5>
                    <p>Experiencias únicas en la naturaleza</p>
                  </div>
                </div>
                <code>Ilustración como fondo de hero section</code>
              </div>
              
              <div className="usage-example">
                <h4>📋 Estados Vacíos</h4>
                <div className="empty-example">
                  <Illustration name="empty-bookings" size="sm" />
                  <div className="empty-content">
                    <h6>Sin elementos</h6>
                    <p>No hay contenido para mostrar</p>
                  </div>
                </div>
                <code>Ilustración en estados sin contenido</code>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="demo-section full-width">
            <h2 className="section-title">⚙️ Información Técnica</h2>
            <div className="tech-info">
              <div className="tech-card">
                <h4>📁 Organización</h4>
                <ul>
                  <li><code>illustrations/empty-*.svg</code> - Estados vacíos</li>
                  <li><code>illustrations/*-hero.svg</code> - Hero sections</li>
                  <li><code>illustrations/*.svg</code> - Decorativas</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>🔧 Características</h4>
                <ul>
                  <li>SVG vectoriales escalables</li>
                  <li>Adaptación automática al tema</li>
                  <li>Animaciones CSS incluidas</li>
                  <li>Componente EmptyState integrado</li>
                  <li>Responsive por defecto</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>📊 Props Disponibles</h4>
                <ul>
                  <li><code>name</code>: Nombre de la ilustración</li>
                  <li><code>size</code>: sm, md, lg, xl, full</li>
                  <li><code>color</code>: current, primary, secondary, etc.</li>
                  <li><code>className</code>: Clases CSS adicionales</li>
                  <li><code>aria-hidden</code>: Accesibilidad</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>💡 Uso Básico</h4>
                <div className="code-example">
                  <code>
                    {`import Illustration from './components/common/Illustration';
import EmptyState from './components/common/EmptyState';

// Ilustración simple
<Illustration name="nature-hero" size="lg" />

// Estado vacío completo
<EmptyState
  illustration="empty-cart"
  title="Carrito vacío"
  description="Agrega productos..."
  primaryAction={{
    label: "Explorar",
    onClick: handleExplore
  }}
/>`}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IllustrationDemo;

