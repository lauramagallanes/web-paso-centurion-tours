import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Basic smoke tests to ensure testing setup works
describe('Basic Testing Setup', () => {
  it('renders a simple div', () => {
    render(<div data-testid="test-div">Hello World</div>);
    expect(screen.getByTestId('test-div')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles basic interactions', () => {
    render(
      <button data-testid="test-button" onClick={() => {}}>
        Click me
      </button>
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('works with basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect([1, 2, 3]).toHaveLength(3);
    expect({ name: 'test' }).toHaveProperty('name');
  });

  it('handles async operations', async () => {
    const promise = Promise.resolve('async result');
    const result = await promise;
    expect(result).toBe('async result');
  });
});

