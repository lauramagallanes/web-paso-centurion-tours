import React, { HTMLAttributes, forwardRef } from 'react';
import './Card.css';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'nature' | 'booking';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  objectFit?: 'cover' | 'contain' | 'fill';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hoverable = false,
      clickable = false,
      loading = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'card';
    const variantClass = `card-${variant}`;
    const sizeClass = `card-${size}`;
    const hoverableClass = hoverable ? 'card-hoverable' : '';
    const clickableClass = clickable ? 'card-clickable' : '';
    const loadingClass = loading ? 'card-loading' : '';

    const classes = [
      baseClasses,
      variantClass,
      sizeClass,
      hoverableClass,
      clickableClass,
      loadingClass,
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {loading && (
          <div className="card-loading-overlay">
            <div className="card-spinner">
              <svg className="spinner" viewBox="0 0 24 24">
                <circle
                  className="spinner-circle"
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="31.416"
                  strokeDashoffset="31.416"
                />
              </svg>
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Body Component
export const CardBody: React.FC<CardBodyProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Image Component
export const CardImage: React.FC<CardImageProps> = ({ 
  src, 
  alt, 
  aspectRatio = 'video',
  objectFit = 'cover',
  className = '', 
  ...props 
}) => {
  return (
    <div className={`card-image card-image-${aspectRatio} ${className}`} {...props}>
      <img 
        src={src} 
        alt={alt} 
        className="card-image-img"
        style={{ objectFit }}
        loading="lazy"
      />
    </div>
  );
};

export default Card;