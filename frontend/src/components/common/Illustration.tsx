import React from 'react';

// Empty State Illustrations
import EmptyCartIllustration from '../../assets/illustrations/empty-cart.svg?react';
import EmptyFavoritesIllustration from '../../assets/illustrations/empty-favorites.svg?react';
import EmptyBookingsIllustration from '../../assets/illustrations/empty-bookings.svg?react';

// Hero/Decorative Illustrations
import NatureHeroIllustration from '../../assets/illustrations/nature-hero.svg?react';
import BirdWatchingIllustration from '../../assets/illustrations/bird-watching.svg?react';
import EcoTourismIllustration from '../../assets/illustrations/eco-tourism.svg?react';

import './Illustration.css';

// Illustration mapping
const illustrationMap = {
  // Empty States
  'empty-cart': EmptyCartIllustration,
  'empty-favorites': EmptyFavoritesIllustration,
  'empty-bookings': EmptyBookingsIllustration,
  
  // Hero/Decorative
  'nature-hero': NatureHeroIllustration,
  'bird-watching': BirdWatchingIllustration,
  'eco-tourism': EcoTourismIllustration,
} as const;

export type IllustrationName = keyof typeof illustrationMap;

interface IllustrationProps {
  name: IllustrationName;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  color?: 'current' | 'primary' | 'secondary' | 'accent' | 'muted';
  className?: string;
  'aria-hidden'?: boolean;
  role?: string;
}

const Illustration: React.FC<IllustrationProps> = ({
  name,
  size = 'md',
  color = 'current',
  className = '',
  'aria-hidden': ariaHidden = true,
  role,
  ...props
}) => {
  const IllustrationComponent = illustrationMap[name];

  if (!IllustrationComponent) {
    console.warn(`Illustration "${name}" not found`);
    return null;
  }

  const classes = `illustration illustration-${size} illustration-${color} ${className}`;

  return (
    <IllustrationComponent
      className={classes}
      aria-hidden={ariaHidden}
      role={role}
      {...props}
    />
  );
};

export default Illustration;

