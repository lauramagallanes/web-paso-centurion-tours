import React from 'react';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import './LogoDemo.css';

const LogoDemo: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="logo-demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="page-title">🏷️ Sistema de Logos</h1>
          <p className="page-description">
            Demostración completa del sistema de logos de Tinambú - Paso Centurión Tours
          </p>
          <Button variant="ghost" onClick={toggleTheme}>
            Cambiar a modo {theme === 'light' ? 'oscuro' : 'claro'}
          </Button>
        </div>

        <div className="demo-grid">
          {/* Logo Variants */}
          <div className="demo-section">
            <h2 className="section-title">Variantes de Logo</h2>
            <p className="section-description">
              Diferentes versiones del logo para distintos contextos.
            </p>
            <div className="logo-showcase">
              <div className="logo-example">
                <h4>Logo Completo</h4>
                <div className="logo-container">
                  <Logo variant="full" size="lg" color="auto" />
                </div>
                <code>variant="full"</code>
              </div>
              
              <div className="logo-example">
                <h4>Solo Símbolo</h4>
                <div className="logo-container">
                  <Logo variant="symbol" size="lg" color="auto" />
                </div>
                <code>variant="symbol"</code>
              </div>
              
              <div className="logo-example">
                <h4>Solo Texto</h4>
                <div className="logo-container">
                  <Logo variant="text" size="lg" color="auto" />
                </div>
                <code>variant="text"</code>
              </div>
            </div>
          </div>

          {/* Logo Sizes */}
          <div className="demo-section">
            <h2 className="section-title">Tamaños</h2>
            <p className="section-description">
              Diferentes tamaños para diversos contextos de uso.
            </p>
            <div className="size-showcase">
              <div className="size-example">
                <h4>Extra Small (xs)</h4>
                <Logo variant="full" size="xs" color="auto" />
              </div>
              
              <div className="size-example">
                <h4>Small (sm)</h4>
                <Logo variant="full" size="sm" color="auto" />
              </div>
              
              <div className="size-example">
                <h4>Medium (md)</h4>
                <Logo variant="full" size="md" color="auto" />
              </div>
              
              <div className="size-example">
                <h4>Large (lg)</h4>
                <Logo variant="full" size="lg" color="auto" />
              </div>
              
              <div className="size-example">
                <h4>Extra Large (xl)</h4>
                <Logo variant="full" size="xl" color="auto" />
              </div>
            </div>
          </div>

          {/* Color Variants */}
          <div className="demo-section full-width">
            <h2 className="section-title">Variantes de Color</h2>
            <p className="section-description">
              Diferentes versiones de color que se adaptan automáticamente al tema.
            </p>
            <div className="color-showcase">
              <div className="color-example">
                <div className="color-container light-bg">
                  <h4>Auto (se adapta al tema)</h4>
                  <Logo variant="full" size="lg" color="auto" />
                  <code>color="auto"</code>
                </div>
              </div>
              
              <div className="color-example">
                <div className="color-container dark-bg">
                  <h4>Claro (para fondos oscuros)</h4>
                  <Logo variant="full" size="lg" color="light" />
                  <code>color="light"</code>
                </div>
              </div>
              
              <div className="color-example">
                <div className="color-container light-bg">
                  <h4>Oscuro (para fondos claros)</h4>
                  <Logo variant="full" size="lg" color="dark" />
                  <code>color="dark"</code>
                </div>
              </div>
              
              <div className="color-example">
                <div className="color-container neutral-bg">
                  <h4>Primario (color de marca)</h4>
                  <Logo variant="full" size="lg" color="primary" />
                  <code>color="primary"</code>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Examples */}
          <div className="demo-section full-width">
            <h2 className="section-title">Ejemplos Interactivos</h2>
            <p className="section-description">
              Logos como enlaces y botones con estados interactivos.
            </p>
            <div className="interactive-showcase">
              <div className="interactive-example">
                <h4>Logo como Enlace</h4>
                <Logo 
                  variant="full" 
                  size="lg" 
                  color="auto"
                  as="a"
                  href="/"
                />
                <p>Hover para ver el efecto</p>
              </div>
              
              <div className="interactive-example">
                <h4>Logo como Botón</h4>
                <Logo 
                  variant="full" 
                  size="lg" 
                  color="auto"
                  as="button"
                  onClick={() => alert('¡Logo clickeado!')}
                />
                <p>Click para interactuar</p>
              </div>
              
              <div className="interactive-example">
                <h4>Logo Clickeable (div)</h4>
                <Logo 
                  variant="full" 
                  size="lg" 
                  color="auto"
                  onClick={() => alert('¡Div logo clickeado!')}
                />
                <p>También funciona con div</p>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="demo-section full-width">
            <h2 className="section-title">Ejemplos de Uso</h2>
            <div className="usage-examples">
              <div className="usage-example">
                <h4>🧭 Navbar</h4>
                <div className="navbar-example">
                  <Logo variant="full" size="md" color="auto" as="a" href="/" />
                  <div className="nav-links">
                    <span>Inicio</span>
                    <span>Actividades</span>
                    <span>Contacto</span>
                  </div>
                </div>
                <code>size="md" en navbar</code>
              </div>
              
              <div className="usage-example">
                <h4>🦶 Footer</h4>
                <div className="footer-example">
                  <Logo variant="full" size="lg" color="light" />
                  <p>Información de contacto y enlaces</p>
                </div>
                <code>size="lg" color="light" en footer</code>
              </div>
              
              <div className="usage-example">
                <h4>🏠 Hero Section</h4>
                <div className="hero-example">
                  <Logo variant="full" size="xl" color="auto" />
                  <h3>Bienvenido a Tinambú</h3>
                </div>
                <code>size="xl" en hero</code>
              </div>
              
              <div className="usage-example">
                <h4>📱 Favicon/App Icon</h4>
                <div className="icon-example">
                  <Logo variant="symbol" size="sm" color="auto" />
                </div>
                <code>variant="symbol" para iconos</code>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="demo-section full-width">
            <h2 className="section-title">Información Técnica</h2>
            <div className="tech-info">
              <div className="tech-card">
                <h4>📁 Archivos SVG</h4>
                <ul>
                  <li><code>logo_black.svg</code> - Logo negro completo</li>
                  <li><code>logo_white.svg</code> - Logo blanco completo</li>
                  <li><code>imagen_logo.svg</code> - Solo símbolo</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>⚙️ Características</h4>
                <ul>
                  <li>Adaptación automática a temas</li>
                  <li>Responsive en todos los tamaños</li>
                  <li>Accesibilidad completa</li>
                  <li>Estados interactivos</li>
                  <li>Optimización para rendimiento</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>🎨 Props Disponibles</h4>
                <ul>
                  <li><code>variant</code>: full, symbol, text</li>
                  <li><code>size</code>: xs, sm, md, lg, xl</li>
                  <li><code>color</code>: auto, light, dark, primary</li>
                  <li><code>as</code>: div, a, button</li>
                  <li><code>onClick</code>, <code>href</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoDemo;

