import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <i className={theme === 'light' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill'}></i>
      <span className="theme-toggle-text">
        {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
      </span>
    </button>
  );
};

export default ThemeToggle;
