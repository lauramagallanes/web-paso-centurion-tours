import React, { useState } from 'react';
import PhotoGallery from '../../components/common/PhotoGallery';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import './PhotoGalleryDemo.css';

const PhotoGalleryDemo: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [layout, setLayout] = useState<'grid' | 'masonry' | 'carousel'>('grid');
  const [columns, setColumns] = useState<2 | 3 | 4 | 5>(3);
  const [showCaptions, setShowCaptions] = useState(false);

  // Sample photos for demonstration
  const samplePhotos = [
    {
      id: '1',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      alt: 'Paisaje montañoso',
      title: 'Amanecer en las Montañas',
      description: 'Vista espectacular del amanecer desde el mirador principal de Tinambú.',
      photographer: 'Juan Pérez',
      location: 'Mirador Principal, Tinambú'
    },
    {
      id: '2',
      src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      alt: 'Sendero en el bosque',
      title: 'Sendero del Bosque Nativo',
      description: 'Caminata por el sendero principal que atraviesa el bosque nativo.',
      photographer: 'María González',
      location: 'Sendero Principal'
    },
    {
      id: '3',
      src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
      alt: 'Observación de aves',
      title: 'Avistamiento de Tinambú',
      description: 'Momento único de avistamiento del tinambú en su hábitat natural.',
      photographer: 'Carlos Rodríguez',
      location: 'Zona de Avistamiento'
    },
    {
      id: '4',
      src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      alt: 'Lago cristalino',
      title: 'Laguna Cristalina',
      description: 'Aguas cristalinas de la laguna natural en el corazón del parque.',
      photographer: 'Ana Martínez',
      location: 'Laguna Central'
    },
    {
      id: '5',
      src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      alt: 'Atardecer dorado',
      title: 'Atardecer Dorado',
      description: 'Colores dorados del atardecer reflejados en el paisaje natural.',
      photographer: 'Diego López',
      location: 'Mirador Oeste'
    },
    {
      id: '6',
      src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop',
      alt: 'Flora nativa',
      title: 'Flora Autóctona',
      description: 'Diversidad de plantas nativas que caracterizan la región.',
      photographer: 'Laura Fernández',
      location: 'Jardín Botánico Natural'
    },
    {
      id: '7',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      alt: 'Vista panorámica',
      title: 'Vista 360°',
      description: 'Panorámica completa desde la torre de observación.',
      photographer: 'Roberto Silva',
      location: 'Torre de Observación'
    },
    {
      id: '8',
      src: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=500&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&h=250&fit=crop',
      alt: 'Cascada natural',
      title: 'Cascada del Arroyo',
      description: 'Hermosa cascada alimentada por el arroyo principal del parque.',
      photographer: 'Sofía Ramírez',
      location: 'Cascada Principal'
    },
    {
      id: '9',
      src: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
      alt: 'Camping bajo estrellas',
      title: 'Noche Estrellada',
      description: 'Experiencia de camping con cielo estrellado despejado.',
      photographer: 'Miguel Torres',
      location: 'Área de Camping'
    }
  ];

  const handlePhotoClick = (photo: any, index: number) => {
    console.log('Photo clicked:', photo, 'at index:', index);
  };

  return (
    <div className="photo-gallery-demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="page-title">📸 Sistema de Galería de Fotos</h1>
          <p className="page-description">
            Galería de fotos avanzada con visor modal, múltiples layouts y navegación completa.
          </p>
          <Button variant="ghost" onClick={toggleTheme}>
            Cambiar a modo {theme === 'light' ? 'oscuro' : 'claro'}
          </Button>
        </div>

        <div className="demo-content">
          {/* Controls */}
          <div className="gallery-controls">
            <div className="control-group">
              <h3>Layout</h3>
              <div className="control-buttons">
                <Button
                  variant={layout === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={layout === 'masonry' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('masonry')}
                >
                  Masonry
                </Button>
                <Button
                  variant={layout === 'carousel' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('carousel')}
                >
                  Carousel
                </Button>
              </div>
            </div>

            {layout !== 'carousel' && (
              <div className="control-group">
                <h3>Columnas</h3>
                <div className="control-buttons">
                  {[2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      variant={columns === num ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setColumns(num as 2 | 3 | 4 | 5)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="control-group">
              <h3>Opciones</h3>
              <div className="control-buttons">
                <Button
                  variant={showCaptions ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowCaptions(!showCaptions)}
                >
                  {showCaptions ? 'Ocultar' : 'Mostrar'} Títulos
                </Button>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="gallery-container">
            <h2>Galería de Tinambú - Paso Centurión Tours</h2>
            <PhotoGallery
              photos={samplePhotos}
              layout={layout}
              columns={columns}
              gap="md"
              showCaptions={showCaptions}
              enableViewer={true}
              enableLightbox={true}
              onPhotoClick={handlePhotoClick}
            />
          </div>

          {/* Features */}
          <div className="demo-features">
            <h2 className="features-title">🌟 Características del Sistema</h2>
            
            <div className="features-grid">
              <div className="feature-card">
                <h3>📱 Responsive</h3>
                <p>Adaptación automática a todos los tamaños de pantalla con breakpoints optimizados.</p>
              </div>
              
              <div className="feature-card">
                <h3>🖼️ Visor Modal</h3>
                <p>Lightbox completo con navegación por teclado, gestos táctiles y controles avanzados.</p>
              </div>
              
              <div className="feature-card">
                <h3>🎨 Múltiples Layouts</h3>
                <p>Grid, Masonry y Carousel con configuración flexible de columnas y espaciado.</p>
              </div>
              
              <div className="feature-card">
                <h3>⚡ Carga Lazy</h3>
                <p>Carga diferida de imágenes para optimizar performance y experiencia de usuario.</p>
              </div>
              
              <div className="feature-card">
                <h3>🔍 Zoom & Pan</h3>
                <p>Funcionalidad de zoom en el visor con controles intuitivos de navegación.</p>
              </div>
              
              <div className="feature-card">
                <h3>♿ Accesible</h3>
                <p>Cumple estándares WCAG con navegación por teclado y etiquetas ARIA completas.</p>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="demo-usage">
            <h2 className="usage-title">💡 Ejemplos de Uso</h2>
            
            <div className="usage-examples">
              <div className="usage-example">
                <h4>🏠 Galería de Alojamientos</h4>
                <div className="code-example">
                  <code>
                    {`<PhotoGallery
  photos={accommodationPhotos}
  layout="grid"
  columns={3}
  showCaptions={true}
  enableViewer={true}
/>`}
                  </code>
                </div>
              </div>
              
              <div className="usage-example">
                <h4>🌿 Portafolio de Actividades</h4>
                <div className="code-example">
                  <code>
                    {`<PhotoGallery
  photos={activityPhotos}
  layout="masonry"
  columns={4}
  gap="lg"
  showCaptions={false}
/>`}
                  </code>
                </div>
              </div>
              
              <div className="usage-example">
                <h4>📱 Carousel Mobile</h4>
                <div className="code-example">
                  <code>
                    {`<PhotoGallery
  photos={mobilePhotos}
  layout="carousel"
  gap="sm"
  enableSwipe={true}
/>`}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="demo-technical">
            <h2 className="technical-title">⚙️ Información Técnica</h2>
            
            <div className="technical-grid">
              <div className="technical-card">
                <h4>📊 Props Principales</h4>
                <ul>
                  <li><code>photos</code>: Array de objetos foto</li>
                  <li><code>layout</code>: 'grid' | 'masonry' | 'carousel'</li>
                  <li><code>columns</code>: 2 | 3 | 4 | 5</li>
                  <li><code>showCaptions</code>: boolean</li>
                  <li><code>enableViewer</code>: boolean</li>
                </ul>
              </div>
              
              <div className="technical-card">
                <h4>🎮 Controles del Visor</h4>
                <ul>
                  <li><kbd>Esc</kbd>: Cerrar visor</li>
                  <li><kbd>←</kbd> <kbd>→</kbd>: Navegar fotos</li>
                  <li><kbd>Espacio</kbd>: Mostrar/ocultar controles</li>
                  <li><strong>Swipe</strong>: Navegación táctil</li>
                  <li><strong>Click</strong>: Zoom in/out</li>
                </ul>
              </div>
              
              <div className="technical-card">
                <h4>🎨 Características Visuales</h4>
                <ul>
                  <li>Transiciones suaves CSS</li>
                  <li>Estados de carga y error</li>
                  <li>Overlays con gradientes</li>
                  <li>Thumbnails en visor</li>
                  <li>Metadata de fotos</li>
                </ul>
              </div>
              
              <div className="technical-card">
                <h4>📱 Responsive Breakpoints</h4>
                <ul>
                  <li><strong>1024px+</strong>: Todas las columnas</li>
                  <li><strong>768px</strong>: Máximo 2 columnas</li>
                  <li><strong>480px</strong>: 1 columna</li>
                  <li><strong>Carousel</strong>: Scroll horizontal</li>
                  <li><strong>Touch</strong>: Gestos nativos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryDemo;

