import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import LogoBlack from '../../assets/images/logo/logo_black.svg?react';
import LogoWhite from '../../assets/images/logo/logo_white.svg?react';
import LogoSymbol from '../../assets/images/logo/imagen_logo.svg?react';
import './Logo.css';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'auto' | 'light' | 'dark' | 'primary';
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'div' | 'a' | 'button';
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  color = 'auto',
  className = '',
  onClick,
  href,
  as = 'div'
}) => {
  const { theme } = useTheme();

  // Determine which logo to use
  const getLogoComponent = () => {
    if (variant === 'symbol') {
      return LogoSymbol;
    }

    // For full and text variants, choose based on color/theme
    if (color === 'light' || (color === 'auto' && theme === 'dark')) {
      return LogoWhite;
    } else {
      return LogoBlack;
    }
  };

  const LogoComponent = getLogoComponent();

  // Base classes
  const baseClasses = `logo logo-${variant} logo-${size} logo-${color} ${className}`;

  // Content
  const logoContent = (
    <>
      <LogoComponent className="logo-svg" />
      {variant === 'text' && (
        <span className="logo-text">Tinambú</span>
      )}
    </>
  );

  // Render based on 'as' prop
  if (as === 'a' && href) {
    return (
      <a 
        href={href} 
        className={`${baseClasses} logo-link`}
        onClick={onClick}
        aria-label="Tinambú - Paso Centurión Tours"
      >
        {logoContent}
      </a>
    );
  }

  if (as === 'button' && onClick) {
    return (
      <button 
        className={`${baseClasses} logo-button`}
        onClick={onClick}
        aria-label="Tinambú - Paso Centurión Tours"
        type="button"
      >
        {logoContent}
      </button>
    );
  }

  // Default div
  return (
    <div 
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {logoContent}
    </div>
  );
};

export default Logo;

