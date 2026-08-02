import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup — a div-as-button would fail getByRole outright.

describe('Button', () => {
  it('renders a real <button> exposing its accessible name', () => {
    render(<Button>Sună acum</Button>);
    expect(
      screen.getByRole('button', { name: 'Sună acum' }),
    ).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sună acum</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Sună acum' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Ok</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('merges the parent className instead of replacing its own', () => {
    render(<Button className="mt-4">Sună acum</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('mt-4');
    expect(button.className).toContain('rounded-md');
  });
});
