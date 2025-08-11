import React from 'react';

// UI Icons
import HomeIcon from '../../assets/icons/ui/home.svg?react';
import SearchIcon from '../../assets/icons/ui/search.svg?react';
import MenuIcon from '../../assets/icons/ui/menu.svg?react';
import CloseIcon from '../../assets/icons/ui/close.svg?react';
import ChevronRightIcon from '../../assets/icons/ui/chevron-right.svg?react';
import ChevronLeftIcon from '../../assets/icons/ui/chevron-left.svg?react';
import ChevronDownIcon from '../../assets/icons/ui/chevron-down.svg?react';
import HeartIcon from '../../assets/icons/ui/heart.svg?react';
import HeartFilledIcon from '../../assets/icons/ui/heart-filled.svg?react';
import ShoppingCartIcon from '../../assets/icons/ui/shopping-cart.svg?react';
import UserIcon from '../../assets/icons/ui/user.svg?react';
import CalendarIcon from '../../assets/icons/ui/calendar.svg?react';
import SunIcon from '../../assets/icons/ui/sun.svg?react';
import MoonIcon from '../../assets/icons/ui/moon.svg?react';
import PlusIcon from '../../assets/icons/ui/plus.svg?react';
import RefreshIcon from '../../assets/icons/ui/refresh.svg?react';
// Crear iconos inline para los que faltan
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
  </svg>
);

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

// Activity Icons
import BirdIcon from '../../assets/icons/activities/bird.svg?react';
import HikingIcon from '../../assets/icons/activities/hiking.svg?react';
import CameraIcon from '../../assets/icons/activities/camera.svg?react';
import TreeIcon from '../../assets/icons/activities/tree.svg?react';
import BedIcon from '../../assets/icons/activities/bed.svg?react';

// Social Icons
import FacebookIcon from '../../assets/icons/social/facebook.svg?react';
import InstagramIcon from '../../assets/icons/social/instagram.svg?react';
import WhatsAppIcon from '../../assets/icons/social/whatsapp.svg?react';
import EmailIcon from '../../assets/icons/social/email.svg?react';

import './Icon.css';

// Icon mapping
const iconMap = {
  // UI Icons
  home: HomeIcon,
  search: SearchIcon,
  menu: MenuIcon,
  close: CloseIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-down': ChevronDownIcon,
  heart: HeartIcon,
  'heart-filled': HeartFilledIcon,
  'shopping-cart': ShoppingCartIcon,
  user: UserIcon,
  calendar: CalendarIcon,
  sun: SunIcon,
  moon: MoonIcon,
  plus: PlusIcon,
  refresh: RefreshIcon,
  eye: EyeIcon,
  edit: EditIcon,
  trash: TrashIcon,
  save: SaveIcon,
  play: PlayIcon,
  pause: PauseIcon,
  
  // Activity Icons
  bird: BirdIcon,
  hiking: HikingIcon,
  camera: CameraIcon,
  tree: TreeIcon,
  bed: BedIcon,
  
  // Social Icons
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  whatsapp: WhatsAppIcon,
  email: EmailIcon,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'current' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'muted';
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  role?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'current',
  className = '',
  onClick,
  'aria-label': ariaLabel,
  role,
  ...props
}) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const classes = `icon icon-${size} icon-${color} ${className}`;

  return (
    <IconComponent
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      role={role || (onClick ? 'button' : undefined)}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...props}
    />
  );
};

export default Icon;
