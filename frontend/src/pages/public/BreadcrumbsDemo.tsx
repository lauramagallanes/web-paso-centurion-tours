import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs, { BreadcrumbItem } from '../../components/common/Breadcrumbs';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import './BreadcrumbsDemo.css';

const BreadcrumbsDemo: React.FC = () => {
  // Custom breadcrumb examples
  const customBreadcrumbs1: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/', icon: 'home' },
    { label: 'Actividades', path: '/actividades', icon: 'hiking' },
    { label: 'Senderismo', path: '/actividades/senderismo', icon: 'hiking' },
    { label: 'Sendero Río Yaguarón', path: '/actividades/senderismo/rio-yaguaron' }
  ];

  const customBreadcrumbs2: BreadcrumbItem[] = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Admin Panel', path: '/admin', icon: 'user' },
    { label: 'Reservations', path: '/admin/reservations', icon: 'calendar' },
    { label: 'View Reservation #123', path: '/admin/reservations/123' }
  ];

  const customBreadcrumbs3: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Mi Perfil', path: '/perfil' },
    { label: 'Mis Reservas', path: '/perfil/reservas' },
    { label: 'Configuración', path: '/perfil/configuracion' }
  ];

  return (
    <div className="breadcrumbs-demo-page">
      <div className="container">
        <div className="demo-header">
          <h1 className="page-title">Sistema de Navegación Breadcrumbs</h1>
          <p className="page-description">
            Demostración del componente Breadcrumbs con diferentes configuraciones 
            y estilos de separadores.
          </p>
        </div>

        <div className="demo-sections">
          {/* Auto-generated Breadcrumbs */}
          <Card variant="flat" className="demo-card">
            <CardHeader>
              <h2 className="section-title">
                <Icon name="chevron-right" size="md" color="primary" />
                Breadcrumbs Automáticos (Página Actual)
              </h2>
            </CardHeader>
            <CardBody>
              <p className="section-description">
                Los breadcrumbs se generan automáticamente basándose en la URL actual. 
                Esta es la configuración por defecto.
              </p>
              <div className="breadcrumb-example">
                <Breadcrumbs />
              </div>
            </CardBody>
          </Card>

          {/* Custom Breadcrumbs with Icons */}
          <Card variant="flat" className="demo-card">
            <CardHeader>
              <h2 className="section-title">
                <Icon name="hiking" size="md" color="accent" />
                Breadcrumbs Personalizados con Iconos
              </h2>
            </CardHeader>
            <CardBody>
              <p className="section-description">
                Breadcrumbs personalizados para una página de actividad específica, 
                con iconos representativos para cada nivel.
              </p>
              <div className="breadcrumb-example">
                <Breadcrumbs items={customBreadcrumbs1} />
              </div>
            </CardBody>
          </Card>

          {/* Different Separators */}
          <Card variant="flat" className="demo-card">
            <CardHeader>
              <h2 className="section-title">
                <Icon name="user" size="md" color="secondary" />
                Diferentes Separadores
              </h2>
            </CardHeader>
            <CardBody>
              <p className="section-description">
                El componente soporta diferentes tipos de separadores: chevron, slash y arrow.
              </p>
              
              <div className="separators-examples">
                <div className="separator-example">
                  <h4>Separador Chevron (Por defecto)</h4>
                  <div className="breadcrumb-example">
                    <Breadcrumbs items={customBreadcrumbs2} separator="chevron" />
                  </div>
                </div>
                
                <div className="separator-example">
                  <h4>Separador Slash</h4>
                  <div className="breadcrumb-example">
                    <Breadcrumbs items={customBreadcrumbs2} separator="slash" />
                  </div>
                </div>
                
                <div className="separator-example">
                  <h4>Separador Arrow</h4>
                  <div className="breadcrumb-example">
                    <Breadcrumbs items={customBreadcrumbs2} separator="arrow" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Without Home */}
          <Card variant="flat" className="demo-card">
            <CardHeader>
              <h2 className="section-title">
                <Icon name="close" size="md" color="muted" />
                Sin Enlace de Inicio
              </h2>
            </CardHeader>
            <CardBody>
              <p className="section-description">
                Breadcrumbs sin mostrar el enlace de inicio, útil para contextos específicos.
              </p>
              <div className="breadcrumb-example">
                <Breadcrumbs items={customBreadcrumbs3} showHome={false} />
              </div>
            </CardBody>
          </Card>

          {/* Navigation Links */}
          <Card variant="nature" className="demo-card">
            <CardHeader>
              <h2 className="section-title">
                <Icon name="search" size="md" color="accent" />
                Prueba la Navegación
              </h2>
            </CardHeader>
            <CardBody>
              <p className="section-description">
                Navega a diferentes páginas para ver cómo cambian los breadcrumbs automáticamente.
              </p>
              <div className="navigation-links">
                <Link to="/sobre-nosotros" className="nav-link">
                  <Button variant="primary" size="sm">
                    <Icon name="user" size="xs" />
                    Sobre Nosotros
                  </Button>
                </Link>
                <Link to="/alojamientos" className="nav-link">
                  <Button variant="secondary" size="sm">
                    <Icon name="bed" size="xs" />
                    Alojamientos
                  </Button>
                </Link>
                <Link to="/actividades" className="nav-link">
                  <Button variant="accent" size="sm">
                    <Icon name="hiking" size="xs" />
                    Actividades
                  </Button>
                </Link>
                <Link to="/favoritos" className="nav-link">
                  <Button variant="outline" size="sm">
                    <Icon name="heart" size="xs" />
                    Favoritos
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Technical Info */}
          <Card variant="flat" className="demo-card info-card">
            <CardHeader>
              <h2 className="section-title">
                <Icon name="user" size="md" color="accent" />
                Información Técnica
              </h2>
            </CardHeader>
            <CardBody>
              <div className="info-grid">
                <div className="info-item">
                  <h4>Generación Automática</h4>
                  <p>Los breadcrumbs se generan automáticamente desde la URL actual si no se proporcionan elementos personalizados.</p>
                </div>
                <div className="info-item">
                  <h4>Accesibilidad</h4>
                  <p>Incluye navegación ARIA, indicadores de página actual y soporte para lectores de pantalla.</p>
                </div>
                <div className="info-item">
                  <h4>Responsive</h4>
                  <p>Se adapta a diferentes tamaños de pantalla, ocultando iconos en dispositivos pequeños.</p>
                </div>
                <div className="info-item">
                  <h4>Personalizable</h4>
                  <p>Soporta iconos personalizados, diferentes separadores y control de visibilidad del enlace de inicio.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BreadcrumbsDemo;

