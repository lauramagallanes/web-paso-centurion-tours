import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import './Breadcrumbs.css';

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: 'chevron' | 'slash' | 'arrow';
  showHome?: boolean;
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = 'chevron',
  showHome = true,
  className = ''
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from current path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if enabled
    if (showHome) {
      breadcrumbs.push({
        label: 'Inicio',
        path: '/',
        icon: 'home'
      });
    }

    // Generate breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = getSegmentLabel(segment);
      
      breadcrumbs.push({
        label,
        path: currentPath,
        icon: getSegmentIcon(segment)
      });
    });

    return breadcrumbs;
  };

  const getSegmentLabel = (segment: string): string => {
    const labelMap: Record<string, string> = {
      'sobre-nosotros': 'Sobre Nosotros',
      'alojamientos': 'Alojamientos',
      'actividades': 'Actividades',
      'senderismo-y-tours': 'Senderismo y Tours',
      'reservas': 'Reservas',
      'mis-reservas': 'Mis Reservas',
      'favoritos': 'Favoritos',
      'perfil': 'Mi Perfil',
      'admin': 'Administración',
      'reservations': 'Gestión de Reservas',
      'rooms': 'Gestión de Habitaciones',
      'trails': 'Gestión de Senderos',
      'guides': 'Gestión de Guías',
      'error-demo': 'Demo de Errores',
      'calendario-demo': 'Demo de Calendario',
      'logo-demo': 'Demo de Logos',
      'iconos-demo': 'Demo de Iconos',
      'ilustraciones-demo': 'Demo de Ilustraciones',
      'galeria-demo': 'Demo de Galería'
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getSegmentIcon = (segment: string): string | undefined => {
    const iconMap: Record<string, string> = {
      'sobre-nosotros': 'user',
      'alojamientos': 'bed',
      'actividades': 'hiking',
      'senderismo-y-tours': 'hiking',
      'reservas': 'calendar',
      'mis-reservas': 'calendar',
      'favoritos': 'heart',
      'perfil': 'user',
      'admin': 'user'
    };

    return iconMap[segment];
  };

  const getSeparatorIcon = (): string => {
    switch (separator) {
      case 'slash':
        return '/';
      case 'arrow':
        return '→';
      case 'chevron':
      default:
        return 'chevron-right';
    }
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs if there's only home or less
  }

  return (
    <nav className={`breadcrumbs ${className}`} aria-label="Breadcrumb navigation">
      <ol className="breadcrumbs-list">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.path} className="breadcrumb-item">
              {!isFirst && (
                <span className="breadcrumb-separator">
                  {separator === 'chevron' ? (
                    <Icon name={getSeparatorIcon()} size="xs" color="muted" />
                  ) : (
                    <span className="separator-text">{getSeparatorIcon()}</span>
                  )}
                </span>
              )}
              
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.icon && (
                    <Icon name={item.icon} size="xs" color="muted" />
                  )}
                  <span className="breadcrumb-label">{item.label}</span>
                </span>
              ) : (
                <Link to={item.path} className="breadcrumb-link">
                  {item.icon && (
                    <Icon name={item.icon} size="xs" color="primary" />
                  )}
                  <span className="breadcrumb-label">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

