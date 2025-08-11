import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      style={{
        padding: 'var(--space-2) var(--space-3)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
        e.currentTarget.style.borderColor = 'var(--color-border-hover)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size="sm" />
      {theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
};

export default ThemeToggle;
