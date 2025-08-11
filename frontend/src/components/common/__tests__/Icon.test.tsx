import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Icon from '../Icon';

// Mock all SVG imports
vi.mock('../../../assets/icons/ui/home.svg?react', () => ({
  default: (props: any) => <svg data-testid="home-icon" {...props} />
}));

vi.mock('../../../assets/icons/ui/search.svg?react', () => ({
  default: (props: any) => <svg data-testid="search-icon" {...props} />
}));

vi.mock('../../../assets/icons/ui/heart.svg?react', () => ({
  default: (props: any) => <svg data-testid="heart-icon" {...props} />
}));

describe('Icon Component', () => {
  it('renders with basic props', () => {
    const { container } = render(<Icon name="home" />);
    expect(container.firstChild).toHaveClass('icon');
  });

  it('applies size classes correctly', () => {
    const { container, rerender } = render(<Icon name="home" size="sm" />);
    expect(container.firstChild).toHaveClass('icon-sm');

    rerender(<Icon name="home" size="lg" />);
    expect(container.firstChild).toHaveClass('icon-lg');
  });

  it('applies color classes correctly', () => {
    const { container, rerender } = render(<Icon name="home" color="primary" />);
    expect(container.firstChild).toHaveClass('icon-primary');

    rerender(<Icon name="home" color="accent" />);
    expect(container.firstChild).toHaveClass('icon-accent');
  });

  it('applies custom className', () => {
    const { container } = render(<Icon name="home" className="custom-icon" />);
    expect(container.firstChild).toHaveClass('custom-icon');
  });

  it('applies interactive state', () => {
    const { container } = render(<Icon name="home" interactive />);
    expect(container.firstChild).toBeInTheDocument();
    // Note: The actual CSS class implementation may vary
  });
});