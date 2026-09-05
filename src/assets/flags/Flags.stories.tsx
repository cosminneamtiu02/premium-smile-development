import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ALL_FLAGS } from './all-flags';
import { FranceFlag } from './FranceFlag';
import { GermanyFlag } from './GermanyFlag';
import { ItalyFlag } from './ItalyFlag';
import { RomaniaFlag } from './RomaniaFlag';
import { UnitedKingdomFlag } from './UnitedKingdomFlag';

// The flags folder's workbench (speed-dial-flags lane, owner-approved
// 2026-09-04). `UI/*` title prefix → the visual net photographs these at 1280
// (tests/visual/stories.spec.ts, §13). Two stories:
//  · Gallery — every registry row, rectangle + the disc crop the switcher will
//    actually use; the baseline freezes every drawing (the Glyphs pattern).
//  · TreatmentPreview — the owner-review mock of the board's dressing spec,
//    tuned live over six 2026-09-05 rounds: weight-640 white codes ringed by
//    an 8-way 1px ink text-shadow halo, over the flag under an ink/5 scrim
//    deepening to /20 on hover. STORY-LOCAL composition on purpose — the
//    real ui/SpeedDial `art` wiring rides the parked lane (hard-gated behind
//    rework/speed-dial-hover, same file); this story exists so the treatment
//    can be judged and hand-tuned before that lane dispatches.

const meta = {
  title: 'UI/Flags',
  component: RomaniaFlag,
  argTypes: {
    'aria-label': {
      control: 'text',
      description:
        'Non-empty → role="img" + this name; empty or absent → decorative (aria-hidden)',
    },
  },
} satisfies Meta<typeof RomaniaFlag>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The growth surface — every flag in all-flags.ts, twice: the raw 3:2/5:3/1:2
 * rectangle, and the round disc crop (`overflow-hidden rounded-full` +
 * slice-cover) that is exactly how the language dial will wear it. A new flag
 * appears here ONLY via its registry row — the hand-list drift risk the
 * glyphs pattern already accepted.
 */
export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {ALL_FLAGS.map(([name, Flag]) => (
        <div key={name} className="flex items-center gap-6">
          <span className="inline-flex h-16 w-24 overflow-hidden rounded border border-line [&_svg]:size-full">
            <Flag {...args} />
          </span>
          <span className="inline-flex size-11 shrink-0 overflow-hidden rounded-full border border-line [&_svg]:size-full">
            <Flag {...args} />
          </span>
          <span className="text-xs text-ink-muted">{name}</span>
        </div>
      ))}
    </div>
  ),
};

// The five dial pairings in `locales` manifest order — the owner's mapping:
// Union Jack for EN ("so not usa"), Germany for DE.
const DIAL: readonly { code: string; flag: ReactNode }[] = [
  { code: 'RO', flag: <RomaniaFlag /> },
  { code: 'EN', flag: <UnitedKingdomFlag /> },
  { code: 'DE', flag: <GermanyFlag /> },
  { code: 'FR', flag: <FranceFlag /> },
  { code: 'IT', flag: <ItalyFlag /> },
];

/**
 * One disc of the board's dressing spec, story-local: flag covers the circle,
 * a WHISPER of an ink/5 scrim sits over it (deepening to /20 on hover, the
 * flagged disc's hover manner — owner tuning 2026-09-05 in two rounds: "they
 * are too dark" then "still lighter" walked the pair /35→/15→/5), and the code
 * sits on top in white weight-640 mono (rounds 3–6 walked "trippe thicker" →
 * "way too thick" → "a little more thinner" → "20% thinner again" onto the
 * variable wght axis: 800 × 0.8 = 640, no fattening stroke), with the ink
 * rim drawn as an 8-way 1px
 * text-shadow halo — a halo borders the glyph from OUTSIDE, so unlike a
 * centered text-stroke it never eats into the letter body
 * — the tunables are the `bg-ink/5`+`/20` pair, the weight and the halo,
 * kept verbatim from the board so what is approved here is what the lane
 * builds. Non-interactive spans on purpose: a preview must not fake a
 * button.
 */
function PreviewDisc({
  code,
  flag,
  box,
  text,
}: {
  code: string;
  flag: ReactNode;
  box: string;
  text: string;
}): ReactElement {
  return (
    <span
      className={`group relative inline-flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full border border-line`}
    >
      <span aria-hidden="true" className="absolute inset-0 [&_svg]:size-full">
        {flag}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-ink/5 transition-[background-color] duration-[400ms] ease-in-out group-hover:bg-ink/20 motion-reduce:transition-none"
      />
      <span
        className={`relative font-mono font-[640] tracking-wide leading-none ${text} text-ink-inverse [text-shadow:1px_0_var(--color-ink),-1px_0_var(--color-ink),0_1px_var(--color-ink),0_-1px_var(--color-ink),1px_1px_var(--color-ink),1px_-1px_var(--color-ink),-1px_1px_var(--color-ink),-1px_-1px_var(--color-ink)]`}
      >
        {code}
      </span>
    </span>
  );
}

/**
 * The dressing the owner approved, at both dial scales: top row = the 56px
 * bulb step, bottom row = the 44px lg stem disc (letters 18px and 16px — one
 * step above the atom's bulb×2/7 arithmetic; owner tuning 2026-09-05, "text …
 * a bit bigger and maybe a bit thicker"). Hover any disc to see the scrim
 * deepen. Legibility worst cases to check by eye: FR/IT (white center band —
 * only scrim + outline separate the code), RO (yellow center), EN (cross-work
 * behind the letters).
 */
export const TreatmentPreview: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {DIAL.map(({ code, flag }) => (
          <PreviewDisc
            key={code}
            code={code}
            flag={flag}
            box="size-14"
            text="text-[1.125rem]"
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        {DIAL.map(({ code, flag }) => (
          <PreviewDisc
            key={code}
            code={code}
            flag={flag}
            box="size-11"
            text="text-[1rem]"
          />
        ))}
      </div>
      {/* Developer note, not site copy — untranslated on purpose. */}
      <p className="max-w-prose text-sm text-ink-muted">
        Tunables, verbatim from the board: scrim <code>bg-ink/5</code> →{' '}
        <code>group-hover:bg-ink/20</code>; body <code>font-[640]</code>; ink
        rim = 8-way 1px <code>text-shadow</code> halo.
      </p>
    </div>
  ),
};
