import React from 'react';
import Icon, { IconName } from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import './IconDemo.css';

const IconDemo: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // All available icons organized by category
  const uiIcons: IconName[] = [
    'home', 'search', 'menu', 'close', 'chevron-right', 'chevron-left', 
    'chevron-down', 'heart', 'heart-filled', 'shopping-cart', 'user', 
    'calendar', 'sun', 'moon'
  ];

  const activityIcons: IconName[] = [
    'bird', 'hiking', 'camera', 'tree', 'bed'
  ];

  const socialIcons: IconName[] = [
    'facebook', 'instagram', 'whatsapp', 'email'
  ];

  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
  const colors = ['current', 'primary', 'secondary', 'accent', 'success', 'warning', 'error', 'muted'] as const;

  return (
    <div className="icon-demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="page-title">🎨 Sistema de Iconos SVG</h1>
          <p className="page-description">
            Biblioteca completa de iconos SVG como React components para Tinambú - Paso Centurión Tours
          </p>
          <Button variant="ghost" onClick={toggleTheme}>
            Cambiar a modo {theme === 'light' ? 'oscuro' : 'claro'}
          </Button>
        </div>

        <div className="demo-grid">
          {/* UI Icons */}
          <div className="demo-section">
            <h2 className="section-title">🧭 Iconos de Interfaz</h2>
            <p className="section-description">
              Iconos esenciales para navegación, acciones y estados de la interfaz.
            </p>
            <div className="icon-grid">
              {uiIcons.map((iconName) => (
                <div key={iconName} className="icon-showcase-item">
                  <div className="icon-display">
                    <Icon name={iconName} size="lg" />
                  </div>
                  <code className="icon-name">{iconName}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Icons */}
          <div className="demo-section">
            <h2 className="section-title">🏃‍♂️ Iconos de Actividades</h2>
            <p className="section-description">
              Iconos específicos para actividades de ecoturismo y servicios.
            </p>
            <div className="icon-grid">
              {activityIcons.map((iconName) => (
                <div key={iconName} className="icon-showcase-item">
                  <div className="icon-display">
                    <Icon name={iconName} size="lg" />
                  </div>
                  <code className="icon-name">{iconName}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Social Icons */}
          <div className="demo-section">
            <h2 className="section-title">📱 Iconos Sociales</h2>
            <p className="section-description">
              Iconos para redes sociales y canales de comunicación.
            </p>
            <div className="icon-grid">
              {socialIcons.map((iconName) => (
                <div key={iconName} className="icon-showcase-item">
                  <div className="icon-display">
                    <Icon name={iconName} size="lg" />
                  </div>
                  <code className="icon-name">{iconName}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes Demo */}
          <div className="demo-section full-width">
            <h2 className="section-title">📏 Tamaños de Iconos</h2>
            <p className="section-description">
              Diferentes tamaños disponibles para diversos contextos de uso.
            </p>
            <div className="size-demo">
              {sizes.map((size) => (
                <div key={size} className="size-demo-item">
                  <h4>{size.toUpperCase()}</h4>
                  <div className="size-icons">
                    <Icon name="home" size={size} />
                    <Icon name="heart" size={size} />
                    <Icon name="bird" size={size} />
                    <Icon name="facebook" size={size} />
                  </div>
                  <code>{size}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Colors Demo */}
          <div className="demo-section full-width">
            <h2 className="section-title">🎨 Colores de Iconos</h2>
            <p className="section-description">
              Variaciones de color que se adaptan al sistema de diseño.
            </p>
            <div className="color-demo">
              {colors.map((color) => (
                <div key={color} className="color-demo-item">
                  <h4>{color}</h4>
                  <div className="color-icons">
                    <Icon name="home" size="lg" color={color} />
                    <Icon name="heart-filled" size="lg" color={color} />
                    <Icon name="bird" size="lg" color={color} />
                  </div>
                  <code>color="{color}"</code>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Examples */}
          <div className="demo-section full-width">
            <h2 className="section-title">⚡ Iconos Interactivos</h2>
            <p className="section-description">
              Iconos con estados interactivos y animaciones.
            </p>
            <div className="interactive-demo">
              <div className="interactive-example">
                <h4>Iconos Clickeables</h4>
                <div className="interactive-icons">
                  <Icon 
                    name="heart" 
                    size="lg" 
                    color="error"
                    onClick={() => alert('¡Corazón clickeado!')}
                    aria-label="Favorito"
                  />
                  <Icon 
                    name="shopping-cart" 
                    size="lg" 
                    color="primary"
                    onClick={() => alert('¡Carrito clickeado!')}
                    aria-label="Carrito"
                  />
                  <Icon 
                    name="user" 
                    size="lg" 
                    color="secondary"
                    onClick={() => alert('¡Usuario clickeado!')}
                    aria-label="Usuario"
                  />
                </div>
                <p>Click en los iconos para interactuar</p>
              </div>
              
              <div className="interactive-example">
                <h4>Iconos en Botones</h4>
                <div className="button-examples">
                  <Button variant="primary" leftIcon={<Icon name="calendar" size="sm" />}>
                    Reservar
                  </Button>
                  <Button variant="secondary" leftIcon={<Icon name="heart" size="sm" />}>
                    Favoritos
                  </Button>
                  <Button variant="ghost" leftIcon={<Icon name="search" size="sm" />}>
                    Buscar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="demo-section full-width">
            <h2 className="section-title">🛠️ Ejemplos de Uso</h2>
            <div className="usage-examples">
              <div className="usage-example">
                <h4>🧭 Navegación</h4>
                <div className="nav-example">
                  <Icon name="home" size="sm" /> Inicio
                  <Icon name="bed" size="sm" /> Alojamiento  
                  <Icon name="hiking" size="sm" /> Actividades
                  <Icon name="user" size="sm" /> Perfil
                </div>
                <code>size="sm" en navegación</code>
              </div>
              
              <div className="usage-example">
                <h4>🃏 Tarjetas</h4>
                <div className="card-example">
                  <div className="card-header">
                    <Icon name="bird" size="md" color="secondary" />
                    <h5>Observación de Aves</h5>
                  </div>
                  <div className="card-actions">
                    <Icon name="heart" size="sm" color="muted" />
                    <Icon name="shopping-cart" size="sm" color="muted" />
                  </div>
                </div>
                <code>size="md" en encabezados, "sm" en acciones</code>
              </div>
              
              <div className="usage-example">
                <h4>📱 Redes Sociales</h4>
                <div className="social-example">
                  <Icon name="facebook" size="md" className="facebook" />
                  <Icon name="instagram" size="md" className="instagram" />
                  <Icon name="whatsapp" size="md" className="whatsapp" />
                  <Icon name="email" size="md" className="email" />
                </div>
                <code>Colores específicos en hover</code>
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
                  <li><code>icons/ui/</code> - Iconos de interfaz</li>
                  <li><code>icons/activities/</code> - Iconos de actividades</li>
                  <li><code>icons/social/</code> - Iconos sociales</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>🔧 Características</h4>
                <ul>
                  <li>SVG como React components</li>
                  <li>TypeScript con tipos estrictos</li>
                  <li>Accesibilidad completa</li>
                  <li>Estados interactivos</li>
                  <li>Optimización automática</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>📊 Props Disponibles</h4>
                <ul>
                  <li><code>name</code>: Nombre del icono (requerido)</li>
                  <li><code>size</code>: xs, sm, md, lg, xl</li>
                  <li><code>color</code>: current, primary, secondary, etc.</li>
                  <li><code>onClick</code>: Función para interactividad</li>
                  <li><code>aria-label</code>: Etiqueta de accesibilidad</li>
                </ul>
              </div>
              
              <div className="tech-card">
                <h4>💡 Uso Básico</h4>
                <div className="code-example">
                  <code>
                    {`import Icon from './components/common/Icon';

// Icono básico
<Icon name="home" />

// Con propiedades
<Icon 
  name="heart" 
  size="lg" 
  color="error"
  onClick={handleClick}
  aria-label="Favorito"
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

export default IconDemo;

