import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card, { CardHeader, CardBody, CardFooter } from '../Card';

describe('Card Component', () => {
  it('renders card with body content', () => {
    render(
      <Card>
        <CardBody>Test content</CardBody>
      </Card>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>Card Title</CardHeader>
        <CardBody>Card Body</CardBody>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Body')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card">
        <CardBody>Content</CardBody>
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('renders with different variants', () => {
    const { rerender, container } = render(
      <Card variant="nature">
        <CardBody>Nature card</CardBody>
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('card-nature');

    rerender(
      <Card variant="flat">
        <CardBody>Flat card</CardBody>
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('card-flat');
  });
});