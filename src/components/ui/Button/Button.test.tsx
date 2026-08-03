import { createRef, type Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

// Role-based queries on purpose (§3, §9): passing tests double as proof of
// accessible markup. Fixtures are Romanian with diacritics (§15.7).

describe('Button — element & semantics', () => {
  it('renders a real <button> exposing its accessible name', () => {
    render(<Button>Programează o consultație</Button>);
    expect(
      screen.getByRole('button', { name: 'Programează o consultație' }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Ok</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honors an explicit type override', () => {
    render(<Button type="submit">Trimite</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sună acum</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Sună acum' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Sună acum
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sună acum' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button — §6.8 native-element fidelity', () => {
  it('merges the parent className instead of replacing its own', () => {
    render(<Button className="mt-4">Programează o consultație</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('mt-4');
    expect(button.className).toContain('rounded-md');
  });

  it('accepts ref as a regular prop (React 19) reaching the DOM node', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Programează o consultație</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('spreads remaining native props onto the root element', () => {
    render(
      <Button data-analytics="cta" aria-describedby="hint">
        Programează o consultație
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-analytics', 'cta');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
  });
});

describe('Button — variants & sizes are real styling switches', () => {
  it.each([
    ['solid', 'outline'],
    ['solid', 'ghost'],
    ['outline', 'ghost'],
  ] as const)('variant "%s" styles differ from "%s"', (a, b) => {
    const { unmount } = render(<Button variant={a}>Ședință</Button>);
    const classA = screen.getByRole('button').className;
    unmount();
    render(<Button variant={b}>Ședință</Button>);
    expect(screen.getByRole('button').className).not.toEqual(classA);
  });

  it.each([
    ['md', 'lg'],
    ['md', 'xl'],
    ['lg', 'xl'],
  ] as const)('size "%s" styles differ from "%s"', (a, b) => {
    const { unmount } = render(<Button size={a}>Ședință</Button>);
    const classA = screen.getByRole('button').className;
    unmount();
    render(<Button size={b}>Ședință</Button>);
    expect(screen.getByRole('button').className).not.toEqual(classA);
  });
});

describe('Button — content is a slot (§6.2)', () => {
  it('renders partly-bold children and exposes the full accessible name', () => {
    render(
      <Button variant="outline">
        Soluționarea <strong>online</strong> a litigiilor
      </Button>,
    );
    expect(
      screen.getByRole('button', { name: 'Soluționarea online a litigiilor' }),
    ).toBeInTheDocument();
  });
});

describe('Button — asChild (approved option A)', () => {
  it('renders ONLY the child element — no <button> exists in the DOM', () => {
    render(
      <Button asChild>
        <a href="#servicii">Vezi serviciile</a>
      </Button>,
    );
    expect(
      screen.getByRole('link', { name: 'Vezi serviciile' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("pours the button's styling classes onto the child, keeping the child's own", () => {
    render(
      <Button asChild variant="outline" className="justify-self-start">
        <a href="#servicii" className="col-span-2">
          Vezi serviciile
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Vezi serviciile' });
    // the child keeps its own class…
    expect(link.className).toContain('col-span-2');
    // …receives the parent-positioning class routed through Button…
    expect(link.className).toContain('justify-self-start');
    // …and wears Button's clothes (shared base class as the marker).
    expect(link.className).toContain('rounded-md');
  });

  it("leaves the child's own attributes untouched", () => {
    render(
      <Button asChild>
        <a
          href="https://anpc.ro/ce-este-sal/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Soluționarea alternativă a litigiilor
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', {
      name: 'Soluționarea alternativă a litigiilor',
    });
    expect(link).toHaveAttribute('href', 'https://anpc.ro/ce-este-sal/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('Button — asChild guards & merge rules', () => {
  // ButtonProps types ref for the <button> branch; in asChild mode it reaches
  // the child element instead — the cast below is the test acknowledging that.
  const asButtonRef = (ref: Ref<HTMLAnchorElement>) =>
    ref as unknown as Ref<HTMLButtonElement>;

  it("forwards Button's ref to the child element (React 19 ref-in-props)", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button asChild ref={asButtonRef(ref)}>
        <a href="#servicii">Vezi serviciile</a>
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("the child's own ref wins over Button's (children win conflicts)", () => {
    const childRef = createRef<HTMLAnchorElement>();
    const buttonRef = createRef<HTMLAnchorElement>();
    render(
      <Button asChild ref={asButtonRef(buttonRef)}>
        <a href="#servicii" ref={childRef}>
          Vezi serviciile
        </a>
      </Button>,
    );
    expect(childRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(buttonRef.current).toBeNull();
  });

  it('throws its own actionable message for non-element children', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Button asChild>doar text</Button>)).toThrow(
      /exactly one element child/,
    );
    expect(() =>
      render(
        <Button asChild>
          <span>unu</span>
          <span>doi</span>
        </Button>,
      ),
    ).toThrow(/exactly one element child/);
    silence.mockRestore();
  });

  it('never leaks <button>-only props onto the child and warns in dev', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Button asChild disabled formAction="/x">
        <a href="#servicii">Vezi serviciile</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Vezi serviciile' });
    expect(link).not.toHaveAttribute('disabled');
    expect(link).not.toHaveAttribute('formaction');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('no effect with asChild'),
    );
    errorSpy.mockRestore();
  });

  it('the child wins ordinary prop conflicts', () => {
    render(
      <Button asChild aria-label="de la Button">
        <a href="#servicii" aria-label="de la copil">
          Vezi serviciile
        </a>
      </Button>,
    );
    expect(
      screen.getByRole('link', { name: 'de la copil' }),
    ).toBeInTheDocument();
  });
});

describe('Button — frame-safe hover invariant (§9 a11y audit)', () => {
  it('never animates text color; only the ::before sweep transitions', () => {
    render(<Button variant="outline">Ședință</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).not.toMatch(/transition-colors|transition-\[color\]/);
    expect(cls).toContain('before:transition-transform');
  });
});
