import React from 'react';
import Illustration, { IllustrationName } from './Illustration';
import Button from './Button';
import './Illustration.css';

interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = ''
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <Illustration 
        name={illustration} 
        size="lg" 
        color="muted"
        className="fade-in"
      />
      
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>
      
      {(primaryAction || secondaryAction) && (
        <div className="empty-state-actions">
          {primaryAction && (
            <Button
              variant={primaryAction.variant || 'primary'}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'ghost'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

