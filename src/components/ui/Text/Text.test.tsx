import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text, type TextTone } from './Text';

// Role-based queries wherever a role exists (§9): a passing test doubles as
// proof of accessible markup. Fixtures are Romanian WITH diacritics (§15.7) —
// the string below carries all four comma-below letters Ș ș Ț ț, so a broken
// encoding path (font subsetting, message pipeline, JSX escaping) fails here
// rather than in front of a patient.
const RO = 'Ședințe și îngrijire — Str. Vlad Țepeș nr. 3';

const tokensOf = (element: Element) =>
  element.className.split(/\s+/).filter(Boolean);

describe('Text — element & semantics', () => {
  it('renders a <p> by default, children intact including Ș ș Ț ț', () => {
    render(<Text>{RO}</Text>);
    // Query the diacritics themselves: getByText would miss the node if any
    // layer normalised or mangled them.
    const paragraph = screen.getByText(RO);
    expect(paragraph.tagName).toBe('P');
    expect(screen.getByRole('paragraph')).toBe(paragraph);
  });

  it('as="span" renders a <span>', () => {
    // tagName, not role: span maps to the `generic` role and dt/dd map to
    // term/definition inconsistently across tooling — the TAG is the contract.
    render(<Text as="span">{RO}</Text>);
    expect(screen.getByText(RO).tagName).toBe('SPAN');
  });

  it.each([
    ['dt', 'DT'],
    ['dd', 'DD'],
  ] as const)('as="%s" renders a <%s> inside a <dl>', (as, tagName) => {
    // The <dl> wrapper keeps the test DOM valid HTML (an orphan dt/dd is not),
    // mirroring the DefinitionList story and the real Footer hours block.
    render(
      <dl>
        <Text as={as}>{RO}</Text>
      </dl>,
    );
    expect(screen.getByText(RO).tagName).toBe(tagName);
  });

  it('never leaks its own props onto the DOM element', () => {
    render(
      <Text as="span" tone="muted">
        {RO}
      </Text>,
    );
    const span = screen.getByText(RO);
    expect(span).not.toHaveAttribute('as');
    expect(span).not.toHaveAttribute('tone');
  });
});

describe('Text — tone is the whole style axis', () => {
  // Record<TextTone, …> on purpose: a fourth tone cannot ship with zero
  // coverage — this file stops typechecking until it is classified here.
  const expected: Record<TextTone, string> = {
    default: 'text-base text-ink',
    muted: 'text-base text-ink-muted',
    strong: 'text-base text-ink-strong',
  };

  it.each(Object.keys(expected) as TextTone[])(
    'tone "%s" emits exactly its own class set and nothing else',
    (tone) => {
      render(<Text tone={tone}>{RO}</Text>);
      expect(screen.getByRole('paragraph').className).toBe(expected[tone]);
    },
  );

  it('defaults to tone="default"', () => {
    render(<Text>{RO}</Text>);
    expect(screen.getByRole('paragraph').className).toBe(expected.default);
  });

  it.each(Object.keys(expected) as TextTone[])(
    'tone "%s" carries no leading-* utility (D2: text-base brings its own 1.5rem)',
    (tone) => {
      // A leading the Footer does not carry today would break fb-186's
      // zero-visual-diff acceptance for the rewiring. If more generous leading
      // is ever wanted, the lever is --text-base--line-height in globals.css.
      render(<Text tone={tone}>{RO}</Text>);
      const tokens = tokensOf(screen.getByRole('paragraph'));
      expect(tokens.filter((t) => /(^|:)leading-/.test(t))).toEqual([]);
    },
  );

  it.each(Object.keys(expected) as TextTone[])(
    'tone "%s" owns no outer margin (§6.4 — the parent owns spacing)',
    (tone) => {
      render(<Text tone={tone}>{RO}</Text>);
      const tokens = tokensOf(screen.getByRole('paragraph'));
      expect(tokens.filter((t) => /^-?m[trblxyse]?-/.test(t))).toEqual([]);
    },
  );
});

describe('Text — §6.8 native-element fidelity', () => {
  it('merges the parent className LAST, keeping its own classes first', () => {
    render(<Text className="col-span-2">{RO}</Text>);
    // Order is the contract, not an accident: the caller's utility must be
    // able to win a Tailwind tie, and the atom's own classes must survive.
    expect(screen.getByRole('paragraph').className).toBe(
      'text-base text-ink col-span-2',
    );
  });

  it('accepts ref as a regular prop (React 19), typed by the chosen element', () => {
    // Also the compile-time proof of the generic: ref narrows with `as`.
    const paragraph = createRef<HTMLParagraphElement>();
    render(<Text ref={paragraph}>{RO}</Text>);
    expect(paragraph.current).toBeInstanceOf(HTMLParagraphElement);

    const span = createRef<HTMLSpanElement>();
    render(
      <Text as="span" ref={span}>
        {RO}
      </Text>,
    );
    expect(span.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('spreads remaining native props onto the rendered element', () => {
    render(
      <Text id="program" lang="ro" data-hours-row="monday">
        {RO}
      </Text>,
    );
    const paragraph = screen.getByRole('paragraph');
    expect(paragraph).toHaveAttribute('id', 'program');
    expect(paragraph).toHaveAttribute('lang', 'ro');
    expect(paragraph).toHaveAttribute('data-hours-row', 'monday');
  });

  it('carries native props through on a non-default element too', () => {
    render(
      <dl>
        <Text as="dd" tone="muted" id="duminica" data-closed="true">
          Închis
        </Text>
      </dl>,
    );
    const dd = screen.getByText('Închis');
    expect(dd.tagName).toBe('DD');
    expect(dd).toHaveAttribute('id', 'duminica');
    expect(dd).toHaveAttribute('data-closed', 'true');
    expect(dd.className).toBe('text-base text-ink-muted');
  });
});
