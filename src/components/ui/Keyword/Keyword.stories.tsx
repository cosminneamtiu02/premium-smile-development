import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Keyword, Keywords, type KeywordSegment } from './Keyword';
import { Text } from '../Text/Text';

// THREE stories, and the count is the honest one: the fragment alone (the
// control), the sentence a `t.rich` call produces, and the same sentence
// assembled from lib/team's segments. The export NAMES are load-bearing — each
// one names a baseline file (`ui-keyword--default`, …) — and this list IS the
// atom's contribution to the doctor-pages lane's visual manifest. The `UI/*`
// title prefix routes all three to the 1280 project only (§13).
//
// NO GERMAN AND NO PSEUDO FRAME HERE, deliberately, and the reason is the
// atom's whole shape: a <Keyword> is one inline <b> around finished text
// (§8.1) with no box, no wrap decision and no measure of its own — expansion
// is absorbed by the SENTENCE, which belongs to the consumer, and the
// PersonnelCard stories already sample exactly that (GermanLongest puts
// `Behandlungsschwerpunkte` inside a justified quote at 320px). A frame here
// would photograph a longer word in the same two utilities.
//
// The subject of every frame below is the DIFFERENCE between key words and
// the rest, so each sentence sits in `ui/Text tone="muted"` (#5b554f),
// upright, at the body's 400 — a stand-in for the quiet ink a doctor's words
// wear: since D58 the two consumers' quotes are the lighter `--ink-faint`
// (#766f69), which ui/Text has no tone for, and the atom owns neither. The
// fragments are a little bold (650), upright, with no line under them, in the
// lavender `--accent` #746894 — the colour of the doctor card's „Mai multe
// despre mine" button, on the owner's word of 2026-10-02 ("i want that
// highlighted text to actually be the color of the current mai multe despre
// mine button"; the violet `--accent-strong` #4b3a86 until then). The plain
// line is the owner's "remove the underline" of 2026-09-26 (the atom's D60),
// one look after D59's "add just a little more bold and underline them maybe"
// raised the weight to 650 and drew a thin line that read as a link — the
// weight stayed, the line went. Before them, D56's "a darker lilla and just a
// little bold and drop italic" set the weight at 600 and D57's "a more
// seeable one … make it just jump at you more" deepened the ink to the clear
// violet the button's lavender replaced. The 650 is a true instance of the
// hosted variable serif, so these frames photograph drawn letterforms. The
// key word is set apart by HUE and WEIGHT — the small LIGHTNESS step the
// violet had left with it: on the real quotes' faint ink the lavender has the
// same lightness (1.02:1), and against THIS muted stand-in it reads a shade
// LIGHTER (1.45:1), so these frames show the hue and the weight at work, not
// a darker word. Of the two cues the weight survives forced colours; together
// they are salience, not information (the atom's THREE LIMITS), which is why
// every fixture still reads as a complete sentence with the marking ignored.
//
// Copy is Romanian with diacritics (§15.7), first-person and factual — no
// superlatives, no promises, no result guarantees (CMSR advertising rules for
// dental practices, in force since 2025-07-01). The doctor is invented.

/** The sentence the PersonnelCard stories quote, as `lib/team`'s
 *  splitKeywords hands it over: the <k>…</k> marks cut into segments. */
const SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Lucrez în ', keyword: false },
  { text: 'ortodonție', keyword: true },
  {
    text: ' de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu ',
    keyword: false,
  },
  { text: 'ascultarea', keyword: true },
  {
    text: ' pacientului, apoi construim împreună un plan potrivit.',
    keyword: false,
  },
];

const meta = {
  title: 'UI/Keyword',
  component: Keyword,
  args: {
    children: 'ortodonție',
  },
  argTypes: {
    children: {
      control: 'text',
      description:
        'The fragment — finished, already-translated text (§8.1): the chunks a `t.rich(…, { k: (chunks) => <Keyword>{chunks}</Keyword> })` call hands over, or one segment’s words. Never a key, never t().',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <b> (§6.8). The atom owns no margin and no size of its own — the sentence around it does.',
    },
  },
} satisfies Meta<typeof Keyword>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE FRAGMENT ALONE — HTML's `<b>`, a little bold (`font-[650]`: a pinned 650
 * that overrides Preflight's parent-relative `bolder`) and in the lavender of
 * the doctor card's „Mai multe despre mine" button (`--accent`, #746894 —
 * 5.06:1 on white; the owner, 2026-10-02: "i want that highlighted text to
 * actually be the color of the current mai multe despre mine button"), with
 * no line under it (D60: the owner's "remove the underline").
 *
 * Out of a sentence it reads as a heavier lilac word and nothing more, and
 * that is the atom being right: the element says "key word" to the machine,
 * the weight and the hue say it to the eye, and none of them says
 * "important", "stressed" or "click me" — `<strong>`, `<em>` and `<mark>` all
 * claim something a speciality named in passing does not have, and D60 struck
 * the one cue, the underline, that read as a link.
 */
export const Default: Story = {};

/**
 * THE SENTENCE A MESSAGE PRODUCES — the shape `sections/PersonnelCard` has
 * shipped since its own lane: the band authors `"Lucrez în <k>ortodonție</k>
 * de peste zece ani…"` in `messages/*.json` and passes `t.rich(…, { k:
 * (chunks) => <Keyword>{chunks}</Keyword> })` as a ReactNode.
 *
 * This is the frame where the atom's reason to exist is visible: two fragments
 * heavier than the quiet copy around them (650 against 400), in the doctor
 * card button's lavender against its warm grey (the owner's colour of
 * 2026-10-02, over D57's violet #4b3a86, "make it just jump at you more"),
 * and with no line under them — the owner's "remove the underline" (D60) over
 * D59's "just a little more bold and underline them maybe", after D52's bold
 * was "too bold", D55's italic "looks stupid" and D56's "just a little bold"
 * 600 — so the eye finds the specialities without the line of text losing its
 * evenness.
 */
export const InASentence: Story = {
  argTypes: { children: { control: false } },
  render: () => (
    <Text tone="muted">
      Lucrez în <Keyword>ortodonție</Keyword> de peste zece ani și explic
      fiecare etapă a tratamentului. Consultația începe cu{' '}
      <Keyword>ascultarea</Keyword> pacientului, apoi construim împreună un plan
      potrivit.
    </Text>
  ),
};

/**
 * THE SAME SENTENCE, FROM DATA — `<Keywords segments={…} />`, the shape the
 * doctor pages use: a doctor's words are CONTENT, so they live in `lib/team`
 * beside his pictures (still marked with `<k>…</k>`), and `splitKeywords` cuts
 * one string into the segments this component renders.
 *
 * Read it against the frame above: the two must be indistinguishable. That is
 * the whole claim — `<Keywords>` adds no wrapper element, so the consumer's
 * `<p>` is still the box, and the spaces around the fragments survive the cut.
 */
export const FromSegments: Story = {
  argTypes: { children: { control: false } },
  render: () => (
    <Text tone="muted">
      <Keywords segments={SEGMENTS} />
    </Text>
  ),
};
