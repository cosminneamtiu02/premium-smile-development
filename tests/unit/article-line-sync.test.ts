import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// THE LINE — ONE line in two sections (KEEP-IN-SYNC, CLAUDE.md §4's second
// sharing row). The owner, 2026-10-14: "a before and after separated by the
// same line that will be osed in the section described with the doctor
// conclusion … with that line on the left". sections/BeforeAfter draws it
// between its two pictures (horizontal while they stack, vertical side by
// side) and sections/PostConclusion down the left of the doctor's closing
// words. The two files stay independent — a section never imports another
// section's internals (§4) — so this test holds what must agree: the colour
// (the floss ribbon's `--ribbon`), the rounded ends and the thickness, one
// spacing step in every orientation. Each file's header names the other.

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

/** The `LINE` constant's string, read off the file's source text. */
function lineOf(file: string): string {
  const source = readFileSync(`${SRC}${file}`, 'utf8');
  const match = /const LINE =\s*'([^']+)';/.exec(source);
  if (!match?.[1]) throw new Error(`${file}: no \`const LINE = '…'\` found`);
  return match[1];
}

const tokens = (classes: string): string[] => classes.split(/\s+/);

/** What both lines must say: the ribbon's colour, round ends, step-1 thickness. */
function problems(classes: string, thickness: readonly string[]): string[] {
  const list = tokens(classes);
  const found: string[] = [];
  if (!list.includes('rounded-full')) found.push('no rounded-full');
  const grounds = list.filter((token) => /(^|:)bg-/.test(token));
  if (grounds.length !== 1 || grounds[0] !== 'bg-(--ribbon)') {
    found.push(`ground ${grounds.join(' ') || 'missing'}`);
  }
  for (const token of thickness) {
    if (!list.includes(token)) found.push(`no ${token}`);
  }
  return found;
}

const conclusion = lineOf(
  'components/sections/PostConclusion/PostConclusion.tsx',
);
const beforeAfter = lineOf('components/sections/BeforeAfter/BeforeAfter.tsx');

describe('THE LINE — the before/after and the conclusion draw the same line', () => {
  it('the conclusion: vertical, one step wide, the ribbon colour, round ends', () => {
    expect(problems(conclusion, ['w-1'])).toEqual([]);
  });

  it('the before/after: one step thick stacked AND side by side, the same colour and ends', () => {
    expect(problems(beforeAfter, ['h-1', '@lg:w-1'])).toEqual([]);
  });

  it('has teeth — another colour, square ends or a thicker line are each named', () => {
    expect(problems('w-1 rounded-full bg-accent', ['w-1'])).toEqual([
      'ground bg-accent',
    ]);
    expect(problems('w-1 bg-(--ribbon)', ['w-1'])).toEqual(['no rounded-full']);
    expect(problems('w-2 rounded-full bg-(--ribbon)', ['w-1'])).toEqual([
      'no w-1',
    ]);
  });
});
