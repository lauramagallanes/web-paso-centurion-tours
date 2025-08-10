import React from 'react';
import ThemeToggle from './ThemeToggle';
import Button from './Button';
import Card, { CardHeader, CardBody, CardFooter, CardImage } from './Card';
import ActivityCard from './ActivityCard';
import AccommodationCard from './AccommodationCard';

const DesignSystemDemo: React.FC = () => {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="display-title">Tinambú Design System</h1>
        <ThemeToggle />
      </div>

      {/* Colors Section */}
      <section className="mb-12">
        <h2 className="section-title">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div 
              className="w-full h-20 rounded-lg mb-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            ></div>
            <p className="text-sm font-medium">Primary</p>
            <p className="text-xs text-muted">#191919</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-20 rounded-lg mb-2"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            ></div>
            <p className="text-sm font-medium">Secondary</p>
            <p className="text-xs text-muted">#6b792e</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-20 rounded-lg mb-2"
              style={{ backgroundColor: 'var(--color-accent-blue)' }}
            ></div>
            <p className="text-sm font-medium">Accent Blue</p>
            <p className="text-xs text-muted">#3b88c3</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-20 rounded-lg mb-2"
              style={{ backgroundColor: 'var(--color-accent-salmon)' }}
            ></div>
            <p className="text-sm font-medium">Accent Salmon</p>
            <p className="text-xs text-muted">#d99e82</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-20 rounded-lg mb-2"
              style={{ backgroundColor: 'var(--color-accent-green)' }}
            ></div>
            <p className="text-sm font-medium">Accent Green</p>
            <p className="text-xs text-muted">#aabe50</p>
          </div>
          <div className="text-center">
            <div 
              className="w-full h-20 rounded-lg mb-2 border"
              style={{ backgroundColor: 'var(--color-background)' }}
            ></div>
            <p className="text-sm font-medium">Background</p>
            <p className="text-xs text-muted">Dynamic</p>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="section-title">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="display-title">Display Title</h1>
            <p className="text-sm text-muted">display-title class</p>
          </div>
          <div>
            <h2 className="section-title">Section Title</h2>
            <p className="text-sm text-muted">section-title class</p>
          </div>
          <div>
            <h3 className="card-title">Card Title</h3>
            <p className="text-sm text-muted">card-title class</p>
          </div>
          <div>
            <p className="subtitle">This is a subtitle with secondary styling</p>
            <p className="text-sm text-muted">subtitle class</p>
          </div>
          <div>
            <p>This is regular body text with proper line height and spacing for optimal readability.</p>
            <p className="text-sm text-muted">Default paragraph</p>
          </div>
          <div>
            <p className="caption">This is caption text for smaller details</p>
            <p className="text-sm text-muted">caption class</p>
          </div>
        </div>
      </section>

      {/* Layout Section */}
      <section className="mb-12">
        <h2 className="section-title">Layout & Grid</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-lg border">
            <h3 className="card-title">Grid Item 1</h3>
            <p>This demonstrates the responsive grid system.</p>
          </div>
          <div className="bg-surface p-6 rounded-lg border">
            <h3 className="card-title">Grid Item 2</h3>
            <p>Items automatically adjust based on screen size.</p>
          </div>
          <div className="bg-surface p-6 rounded-lg border">
            <h3 className="card-title">Grid Item 3</h3>
            <p>Mobile-first responsive design approach.</p>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="mb-12">
        <h2 className="section-title">Spacing System</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-primary"></div>
            <span className="text-sm">space-4 (1rem / 16px)</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-6 h-6 bg-secondary"></div>
            <span className="text-sm">space-6 (1.5rem / 24px)</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="w-8 h-8 bg-accent-blue"></div>
            <span className="text-sm">space-8 (2rem / 32px)</span>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="mb-12">
        <h2 className="section-title">Button System</h2>
        
        {/* Button Variants */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Button Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Button Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </div>

        {/* Button States */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Button States</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Normal</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" isDisabled>Disabled</Button>
            <Button variant="primary" leftIcon="🌿">With Icon</Button>
            <Button variant="primary" rightIcon="→">Right Icon</Button>
          </div>
        </div>

        {/* Tourism-themed Buttons */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Tourism Themed</h3>
          <div className="flex flex-wrap gap-4">
            <Button className="btn-nature">Reservar Tour</Button>
            <Button className="btn-booking">Hacer Reserva</Button>
          </div>
        </div>

        {/* Full Width Button */}
        <div>
          <h3 className="card-title mb-4">Full Width</h3>
          <Button variant="primary" fullWidth leftIcon="📅">
            Reservar Ahora - Experiencia Completa
          </Button>
        </div>
      </section>

      {/* Cards Section */}
      <section className="mb-12">
        <h2 className="section-title">Card System</h2>
        
        {/* Basic Cards */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Card Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default" size="md">
              <CardHeader>
                <h4 className="font-semibold">Default Card</h4>
              </CardHeader>
              <CardBody>
                <p>Esta es una card por defecto con borde y sombra sutil.</p>
              </CardBody>
            </Card>

            <Card variant="elevated" size="md">
              <CardHeader>
                <h4 className="font-semibold">Elevated Card</h4>
              </CardHeader>
              <CardBody>
                <p>Card elevada con mayor sombra para destacar contenido importante.</p>
              </CardBody>
            </Card>

            <Card variant="nature" size="md">
              <CardHeader>
                <h4 className="font-semibold">Nature Card</h4>
              </CardHeader>
              <CardBody>
                <p>Card temática de naturaleza con gradiente verde y borde superior.</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Cards with Images */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Cards with Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default" size="md" hoverable>
              <CardImage 
                src="/src/assets/react.svg" 
                alt="Demo image" 
                aspectRatio="video"
              />
              <CardBody>
                <h4 className="font-semibold mb-2">Card with Image</h4>
                <p>Ejemplo de card con imagen que se escala al hacer hover.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="outline">Ver más</Button>
                <Button size="sm" variant="primary">Acción</Button>
              </CardFooter>
            </Card>

            <Card variant="booking" size="md" clickable>
              <CardImage 
                src="/src/assets/react.svg" 
                alt="Demo image" 
                aspectRatio="square"
              />
              <CardBody>
                <h4 className="font-semibold mb-2">Booking Card</h4>
                <p>Card temática para reservas con gradiente azul.</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Specialized Cards */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Tourism Cards</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivityCard
              id="bird-watching"
              name="Observación de Aves"
              description="Descubre la rica avifauna del Paso Centurión con nuestros guías especializados. Una experiencia única para los amantes de la naturaleza."
              image="/src/assets/react.svg"
              duration="3-4 horas"
              difficulty="Fácil"
              price={2500}
              currency="UYU"
              maxParticipants={8}
              includes={[
                "Guía especializado",
                "Binoculares profesionales",
                "Refrigerio incluido",
                "Transporte desde el alojamiento"
              ]}
              onBook={(id) => console.log('Booking activity:', id)}
            />

            <AccommodationCard
              id="cabin-1"
              name="Cabaña del Bosque"
              description="Acogedora cabaña rodeada de naturaleza, perfecta para desconectar y disfrutar del entorno natural del Paso Centurión."
              image="/src/assets/react.svg"
              capacity={{ min: 2, max: 4 }}
              price={3500}
              currency="UYU"
              amenities={[
                "Wi-Fi gratuito",
                "Cocina equipada",
                "Aire acondicionado",
                "Vista al bosque",
                "Parrilla privada"
              ]}
              availability={true}
              rating={4.5}
              onBook={(id) => console.log('Booking accommodation:', id)}
              onViewDetails={(id) => console.log('View details:', id)}
            />
          </div>
        </div>

        {/* Card States */}
        <div className="mb-8">
          <h3 className="card-title mb-4">Card States</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" size="md">
              <CardBody>
                <h4 className="font-semibold mb-2">Normal State</h4>
                <p>Card en estado normal.</p>
              </CardBody>
            </Card>

            <Card variant="default" size="md" loading>
              <CardBody>
                <h4 className="font-semibold mb-2">Loading State</h4>
                <p>Card mostrando estado de carga.</p>
              </CardBody>
            </Card>

            <Card variant="outlined" size="md" hoverable>
              <CardBody>
                <h4 className="font-semibold mb-2">Hoverable Card</h4>
                <p>Card que se eleva al hacer hover.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Status Colors */}
      <section className="mb-12">
        <h2 className="section-title">Status Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-bg)' }}>
            <p className="text-success font-medium">Success</p>
            <p className="text-sm">Positive actions and confirmations</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-bg)' }}>
            <p className="text-warning font-medium">Warning</p>
            <p className="text-sm">Caution and important notices</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-error-bg)' }}>
            <p className="text-error font-medium">Error</p>
            <p className="text-sm">Errors and destructive actions</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info-bg)' }}>
            <p className="text-info font-medium">Info</p>
            <p className="text-sm">Informational messages</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemDemo;
