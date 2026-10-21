'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { Check } from '@/assets/glyphs/Check';
// Aliased: a picture of a chain link, not a navigation component (the glyph's
// own header — this site has no Link component, §15.13).
import { Link as LinkGlyph } from '@/assets/glyphs/Link';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { cx } from '@/lib/cx/cx';
import { CONTROL, ShareFace } from './ShareFace';
import { COPY_FEEDBACK_MS, STATUS_REFILL_MS } from './times';

// sections/ShareLinks/CopyLinkButton — the fourth share control: it copies the
// article's address. The owner picked the four on 2026-10-14 — Facebook ·
// WhatsApp · E-mail · Copy link — and this is the one of them that DOES
// something in place instead of going somewhere, so it is a real <button>
// (ui/TextButton's own, `type="button"`) and this folder's one 'use client'
// file: one of the two client islands the article page adds — the gallery's
// carousel, sections/CardCarousel, is the other (CLAUDE.md §16) — besides the
// islands it shares with other pages (the shell's, and ui/Image's optimizer
// under the cover photograph). It is the smallest island the job allows: the
// three links beside it stay inert HTML in ShareLinks.tsx, and so does the
// row's status line, which this island only fills (THE LINE).
//
// ── HOW IT COPIES. The Clipboard API — `navigator.clipboard.writeText` —
// where it exists, which is a SECURE context (HTTPS, or localhost): the site
// as visitors reach it. Elsewhere — the owner previews the export over plain
// http on his home network, where browsers withhold the API — the older road:
// a temporary textarea holding the address, off screen and read-only (a phone
// raises no keyboard for it, and at 12pt iOS does not zoom when it takes focus),
// its text selected (`select()`, and `setSelectionRange` for iOS, which ignores
// `select()`), `document.execCommand('copy')`, the textarea removed and focus
// handed back to WHATEVER HELD IT before the textarea took it — this button
// after a keyboard press, or after a click in a browser whose click focuses a
// button; the page itself in Safari on a Mac, whose click focuses none — so
// the visitor's place never moves; and the visitor's own text SELECTION put
// back as it was: the textarea's `select()` takes the document's selection,
// and until 2026-10-20 a visitor who had marked a sentence of the article lost
// it to a press on this road (the TypeScript review, measured: 46 selected
// characters → 0; the Clipboard-API road never touches it). Put back WHOLE,
// its direction too since 2026-10-21: one range by its anchor and its focus
// (`setBaseAndExtent`), so a sentence marked from right to left keeps its
// anchor at the right — put back range for range, it came back reversed
// (the React review, round 3: anchor and focus 30 and 5 → 5 and 30); several
// ranges (Firefox's) range for range. Whatever step throws — placing the
// textarea included, inside the `try` since round 3 — focus and selection are
// put back and the press counts as failed, said on the line: never an error
// past the press. A Clipboard API that REFUSES (no permission, the document
// not focused) falls through to the same textarea before the press counts as
// failed — one road more than the build contract names, because a refusal
// there says nothing about the textarea's chances — UNLESS a later press, or
// unmounting, superseded this press while the API made it wait: then the page
// is left alone, no textarea and no focus moved (THE LATEST PRESS).
//   THE PRESS'S OWN DOCUMENT (round 3): every step reads the document the
// button lives in — its `ownerDocument` — and that document's window: the
// line, the textarea, focus and the selection, `execCommand`,
// `isSecureContext` and the clipboard. Until 2026-10-21 the line was looked up
// there and every other step used the global `document` and `window`: one
// document on this site, but two answers to "which page" in one press (the
// TypeScript review).
//
// ── WHAT THE VISITOR LEARNS. The button KEEPS ITS WORD AND ITS NAME in every
// state — „Copiază linkul" — and only its glyph answers: the chain at rest and
// on a failure (a glyph of its own for a failure is the owner's call), the
// tick after a copy until its words leave the line (THE TIMES), in the glyph's
// own 16px box, so nothing on the row moves. The ANSWER is said in words on
// ONE VISIBLE STATUS LINE under the four controls, at EVERY width, phones
// included (THE LINE):
//   · copied — „Link copiat", for 2.5 seconds (THE TIMES);
//   · failed — „Linkul nu a putut fi copiat", UNTIL THE NEXT PRESS: an error
//     the visitor must act on (copy the address some other way) does not
//     vanish by itself (the APG's alert guidance; the accessibility review).
// The line is `role="status"` — polite, read whole — so a screen reader hears
// what the eye reads. The words are the page's, finished (§8.1).
// WHY THE NAME STAYS (round 2 of the reviews, 2026-10-20). Until that day the
// answer was the button's own word: under the 42rem step, where the four
// controls are their glyphs, a failure showed its sentence INSIDE the button,
// which grew from 44 to 253.6px, the list wrapped, and the e-mail link slid
// into the place the visitor had just pressed — at a 320 window exactly under
// it, so a retry opened the mail app — and when the failure left after its 5
// seconds the row collapsed: a layout shift of 0.154 at 390 × 844 and 0.297 at
// 320 × 568 that no press had caused (the React and the accessibility
// reviews, measured). A name that changed was a risk of its own: NVDA and JAWS
// may speak a focused control's new name AND the status, the answer twice,
// and a voice-control user saying „Copiază linkul" found no such button while
// an answer showed. A constant name ends both.
//
// ── THE LINE. ShareLinks.tsx — a server component — prints the line EMPTY
// under its list, a `<p role="status">` with an id it hands this island
// (`statusId`): a live region announces what CHANGES in it, so it must be in
// the HTML from the start, empty (SC 4.1.3). This island fills it through a
// React PORTAL (`createPortal`), and opens that portal at the FIRST PRESS —
// it looks the element up by its id in the press's own document, and never
// during a render; and again at any later press whose line has LEFT the page
// (`isConnected` false: a row that re-rendered its line prints a new element).
// So the server's HTML and the first render in the browser are the idle
// button and an untouched, empty line (§16's hydration rule); react-dom/server,
// which renders no portal, never meets one; and React never reconciles the
// line's children from both sides — the server component gives the <p> none,
// so the portal's are the only ones it ever has. IN DEVELOPMENT a lookup that
// finds no element, or one that is not `role="status"`, says so in the
// console (`console.error`): without its line a press answers nowhere, in
// silence — no word on screen, the button unchanged, the console empty (the
// React review, round 3). In production the press still copies and shows its
// glyph. Why a portal and not an element of the island's own: the line
// cannot live in the copy <li> — it would make that item taller and move the
// three links beside it off their line — nor in the <ul> (a list holds list
// items, and a status is none); and making the whole row an island, so one
// component owned both, would hydrate three inert links to place one
// sentence. Weighed and left: a second island for the line, sharing a
// module-level store with this one — two islands and a store for one string.
// The site's precedent for an island that touches markup outside its own
// subtree is the price menu (sections/PriceList/PriceMenu), which writes
// attributes onto the category cards; this one writes only CHILDREN, through
// React, into one element printed for it.
//   THE HEIGHT. Once open, the line keeps its height. Its content is ONE grid
// cell holding the answer shown and, invisible and out of the accessibility
// tree, EVERY answer a press can bring (THE STACK): the line is as tall as the
// tallest from the first press on, so a success that clears, or a failure
// followed by a success, never collapses it nor grows it — and since the cell
// is laid out at the press, before any answer, the one shift is the press's
// own: the line opening, inside the 500ms after an input that Cumulative
// Layout Shift excludes (§10.6) — MEASURED on a top-level page, 23 to 48ms
// after a real click or tap, and marked as the input's (ShareLinks.tsx's THE
// ONE SHIFT has what it moves). The answers are RESULTS, and each answer's
// glyph, hold and words are `satisfies Record<CopyResult, …>`: a third answer
// is a compile error until all three are given, and its invisible copy joins
// the stack by itself — so it can never ship without its height reserved,
// which round 2's collapse showed is what one more answer costs (the
// TypeScript review, round 3). The line is `contain: inline-size`
// (ShareLinks.tsx's THE LINE), so its words wrap inside the four controls'
// width and never widen the cover row's slot.
//
// ── THE TIMES. „Link copiat" stays 2.5 seconds ON THE LINE (COPY_FEEDBACK_MS,
// ./times.ts): two words beside a tick, read at a glance, and nothing for the
// visitor to do. Its clock runs from the moment the words LAND —
// STATUS_REFILL_MS after the answer (THE REFILL) — and the tick, shown at
// once with the answer, goes with them: both are back at rest STATUS_REFILL_MS
// + COPY_FEEDBACK_MS after the answer. Until 2026-10-21 both clocks started at
// the answer, so the words were on screen 2,350ms of their 2.5 seconds (the
// accessibility review, round 3). Going back to rest also clears a refill
// still pending — a belt: counted from the answer past the refill, the hold
// never ends before it. The failure has no clock: it stays until the next
// press, which empties the line at once (THE REFILL). Until 2026-10-20 the
// failure left after 5 seconds, a time measured against reading the sentence
// at the 120 words a minute the site budgets for an older reader — and, under
// the step, the very moment the row collapsed (WHY THE NAME STAYS). A copy's
// time runs from its own answer: a new press brings a new answer and its own
// time, and the answer on show keeps its time while the press waits.
// Unmounting clears them. A LEVER, NOT BUILT (the accessibility review, round
// 3): keep a copy's answer until the next press, as a failure's is kept — the
// line's height is reserved for both answers already (THE HEIGHT), so it
// would move nothing.
//
// ── THE REFILL. An answer reaches the status line 150ms after it reaches the
// button (STATUS_REFILL_MS, ./times.ts), never in the same moment: a press
// empties the line, and when the answer is the same sentence as the last one,
// an emptying and a filling that land in one accessibility update may reach a
// screen reader as no change at all — a second press would be heard by no one
// (the accessibility review). The pause makes the empty line a state of its
// own, and the eye sees it too: a repeated answer blinks out for that moment,
// which tells the visitor the press was taken. The tick reaches the button at
// once.
//
// ── THE ROOM UNDER IT (round 3). The button's scroll margin below,
// `scroll-mb-14` — 56px, the open line's tallest answer, German's failure on
// two lines (THE HEIGHT) — in spacing steps, so THE BAND SCALE redraws it with
// the line. When focus scrolls the button into view near the bottom of a
// phone's screen, the line under it opens clear of the corner discs. The
// arithmetic, on a phone: the page keeps 10.5rem (168px) of scroll padding at
// its bottom (globals.css), and the WhatsApp disc covers the band from 96 to
// 152px above the bottom edge, 16 to 72px from the right
// (sections/FloatingActions). A focus scroll that stops at that padding's
// edge — Firefox's; Chromium centres the control instead — left the button's
// bottom 168px up, so a German line reached down to 112px, and its words,
// which end at the row's right end 16 to 22px from the screen's edge, ran
// their last ~50px under the disc: on a failure the line is the only signal
// (the accessibility review, round 3). With the margin the button's bottom
// stops 224px up and the line ends at 168px, 16px clear of the disc.
//
// ── THE LATEST PRESS. Only the latest press speaks: every press is counted,
// and an answer that arrives after a later press — or after the button is
// gone, since unmounting counts as one — is ignored, and its textarea is
// never made (HOW IT COPIES).
//
// ── THE TIMERS LIVE IN REFS, cleared by the next press or answer, and on
// unmount. Recorded, latent: a parent that HID this island with React's
// <Activity> would run the unmount's cleanup and keep the state, so a copy's
// tick and „Link copiat" would stay on show with no clock left to clear them.
// Nothing hides it today — every link on this site is a full document load
// (§15.13).
//
// ── NOTHING BRANCHES ON THE BROWSER DURING RENDER (§16's hydration rule):
// the server's HTML and the first render in the browser are the idle button
// and no portal; the secure-context and clipboard checks, and the line's
// lookup, run only when the button is pressed.

/** The copy control's content, as the page passes it to ShareLinks — the
 *  address and its words, all finished (§8.1). */
export type CopyLinkContent = Readonly<{
  /** The address to copy — the page's own, absolute (the route builds it). */
  url: string;
  /** The button's word, e.g. „Copiază linkul" — its name in every state. */
  label: string;
  /** Said on the status line after a copy, e.g. „Link copiat". */
  copied: string;
  /** Said on the status line when nothing could be copied, e.g. „Linkul nu a putut fi copiat". */
  failed: string;
}>;

export type CopyLinkButtonProps = CopyLinkContent &
  Readonly<{
    /** The id of the row's status line, printed empty by ShareLinks (THE LINE). */
    statusId: string;
  }>;

/** Every answer a press can bring (WHAT THE VISITOR LEARNS) — THE STACK keeps
 *  an invisible copy of each, so the line is as tall as the tallest (THE
 *  HEIGHT). */
const RESULTS = ['copied', 'failed'] as const;

/** One answer. Exported as a TYPE alone, for the stories: a type leaves no
 *  value on the module (ShareLinks.test.tsx pins the module's exports). */
export type CopyResult = (typeof RESULTS)[number];

/** What the button and the status line say (WHAT THE VISITOR LEARNS): at
 *  rest, nothing; or an answer, its glyph shown at once and its words on the
 *  line once `spoken` (THE REFILL). A union, so a line speaking an answer
 *  that is not there cannot be written. */
type Feedback =
  | Readonly<{ result: null; spoken: false }>
  | Readonly<{ result: CopyResult; spoken: boolean }>;

const IDLE: Feedback = { result: null, spoken: false };

/** How long each answer stays ON THE LINE, from the moment it lands (THE
 *  TIMES) — `null`: until the next press. */
const HOLD_OF = {
  copied: COPY_FEEDBACK_MS,
  failed: null,
} as const satisfies Record<CopyResult, number | null>;

/** The chain — the button's glyph at rest and on a failure. */
const CHAIN = <LinkGlyph size="sm" />;

/** The glyph each answer shows on the button (WHAT THE VISITOR LEARNS). */
const GLYPH_OF = {
  copied: <Check size="sm" />,
  failed: CHAIN,
} as const satisfies Record<CopyResult, ReactElement>;

/** THE ROOM UNDER IT: the open line's tallest answer, kept clear under the
 *  button when focus scrolls it into view — in spacing steps, so THE BAND
 *  SCALE redraws it. */
const ROOM = 'scroll-mb-14';

/** THE STACK — the line's one grid cell, 8px under the controls, every
 *  answer laid in it; the kept ones invisible and out of the name. One static
 *  string per box: Tailwind reads class names from source text. */
const STACK = 'grid pt-2';
const CELL = 'col-start-1 row-start-1';
const KEPT = 'col-start-1 row-start-1 invisible';

/** The temporary textarea's style (HOW IT COPIES): out of flow and off screen,
 *  fixed so it can never move the page, 12pt so iOS does not zoom to it. */
const OFF_SCREEN = {
  position: 'fixed',
  top: '0',
  left: '-9999px',
  fontSize: '12pt',
} as const satisfies Partial<CSSStyleDeclaration>;

/**
 * What the visitor had marked, read before the textarea takes the selection —
 * returned as the way to put it back as it was, its DIRECTION too (HOW IT
 * COPIES): one range by its anchor and its focus, several (Firefox's) range
 * for range.
 */
function keepSelection(selection: Selection | null): () => void {
  if (selection === null) return () => {};
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (selection.rangeCount === 1 && anchorNode !== null && focusNode !== null) {
    return () => {
      selection.setBaseAndExtent(
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset,
      );
    };
  }
  // Copies of the ranges: the selection's own may be changed in place.
  const ranges = Array.from({ length: selection.rangeCount }, (_, index) =>
    selection.getRangeAt(index).cloneRange(),
  );
  return () => {
    selection.removeAllRanges();
    for (const range of ranges) selection.addRange(range);
  };
}

/**
 * The older road (HOW IT COPIES): copy `text` through a temporary read-only
 * textarea in `page`, the press's own document, then hand focus back to
 * whatever held it before and put the visitor's text selection back. True
 * when the browser reports the copy done; false when it does not, or when any
 * step throws.
 */
function copyThroughTextarea(text: string, page: Document): boolean {
  // Read BEFORE the textarea takes focus and the selection: the place the
  // visitor was at, and what they had marked.
  const previous = page.activeElement;
  const putBack = keepSelection(page.getSelection());
  const area = page.createElement('textarea');
  area.value = text;
  area.readOnly = true;
  Object.assign(area.style, OFF_SCREEN);
  try {
    // Placed inside the `try`: a page that refuses even the textarea is a
    // failure said on the line, never an error past the press.
    page.body.append(area);
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, text.length);
    return page.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
    // The press's own window's constructors: an element of another document
    // is an instance of ITS window's classes, never this one's.
    const view = page.defaultView;
    if (
      view !== null &&
      (previous instanceof view.HTMLElement ||
        previous instanceof view.SVGElement)
    ) {
      previous.focus({ preventScroll: true });
    }
    putBack();
  }
}

/**
 * Copy `text` in `page`, the press's own document: the Clipboard API where
 * its window allows it, the textarea otherwise or when the API refuses —
 * unless `latest()` says a later press superseded this one while the API made
 * it wait (HOW IT COPIES).
 */
async function copyText(
  text: string,
  latest: () => boolean,
  page: Document,
): Promise<boolean> {
  const view = page.defaultView;
  const clipboard = view?.navigator.clipboard;
  if (
    view?.isSecureContext === true &&
    typeof clipboard?.writeText === 'function'
  ) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Refused — the textarea below may still succeed, unless this press is
      // no longer the latest: then the page is left alone (THE LATEST PRESS).
      if (!latest()) return false;
    }
  }
  return copyThroughTextarea(text, page);
}

/**
 * THE LINE, by its id in `page`, the press's own document. In development, a
 * lookup that finds nothing — or an element that is not a status — says so:
 * without its line a press answers nowhere, in silence (THE LINE).
 */
function findLine(page: Document, id: string): HTMLElement | null {
  const found = page.getElementById(id);
  if (process.env.NODE_ENV !== 'production') {
    if (found === null) {
      console.error(
        `ShareLinks/CopyLinkButton: no element has the id "${id}" — the row's status line (THE LINE) is missing, so this press's answer is said nowhere.`,
      );
    } else if (found.getAttribute('role') !== 'status') {
      console.error(
        `ShareLinks/CopyLinkButton: the element with the id "${id}" is not role="status" — the answers shown there are never announced.`,
      );
    }
  }
  return found;
}

/** What the open line holds (THE STACK): the answer shown — empty between
 *  answers and during THE REFILL — over every answer, kept invisible and out
 *  of the accessibility tree, so the line is always as tall as the tallest. */
function Answer({
  shown,
  words,
}: Readonly<{
  shown: string;
  words: Readonly<Record<CopyResult, string>>;
}>): ReactElement {
  return (
    <span className={STACK}>
      <span className={CELL}>{shown}</span>
      {RESULTS.map((result) => (
        <span key={result} aria-hidden className={KEPT}>
          {words[result]}
        </span>
      ))}
    </span>
  );
}

export function CopyLinkButton({
  url,
  label,
  copied,
  failed,
  statusId,
}: CopyLinkButtonProps): ReactElement {
  // Counts presses, so an answer that arrives after a later press — or after
  // unmounting, which counts as one — is ignored (THE LATEST PRESS).
  const presses = useRef(0);
  // Each answer's two timers: the line's refill (THE REFILL) and the way back
  // to rest (THE TIMES). Refs (THE TIMERS LIVE IN REFS).
  const refill = useRef<number | undefined>(undefined);
  const revert = useRef<number | undefined>(undefined);
  const [feedback, setFeedback] = useState<Feedback>(IDLE);
  // The row's status line, found at the first press and kept while it stays
  // on the page: null until then, on the server and in the first render alike
  // (THE LINE).
  const [line, setLine] = useState<HTMLElement | null>(null);

  // Unmounting supersedes every press still waiting for the clipboard — none
  // of them may touch the page once the button is gone — and clears both
  // timers.
  useEffect(
    () => () => {
      presses.current += 1;
      window.clearTimeout(refill.current);
      window.clearTimeout(revert.current);
    },
    [],
  );

  async function copyAddress(button: HTMLElement): Promise<void> {
    presses.current += 1;
    const press = presses.current;
    const latest = (): boolean => press === presses.current;
    // THE PRESS'S OWN DOCUMENT: the button's, for every step below.
    const page = button.ownerDocument;
    // Open the line at the first press — and find it again if the one found
    // has left the page — so it takes its height now, with the press (THE
    // HEIGHT).
    if (line === null || !line.isConnected) setLine(findLine(page, statusId));
    // Empty the line now, and cancel a refill the last answer still owes it,
    // so the answer below is announced again (THE REFILL). The answer on show
    // keeps its own time meanwhile (THE TIMES).
    window.clearTimeout(refill.current);
    setFeedback((current) =>
      current.result === null || !current.spoken
        ? current
        : { result: current.result, spoken: false },
    );
    const done = await copyText(url, latest, page);
    if (!latest()) return;
    const result: CopyResult = done ? 'copied' : 'failed';
    window.clearTimeout(revert.current);
    setFeedback({ result, spoken: false });
    refill.current = window.setTimeout(
      () => setFeedback({ result, spoken: true }),
      STATUS_REFILL_MS,
    );
    const hold = HOLD_OF[result];
    if (hold !== null) {
      // The hold runs from the moment the words LAND — the refill's — so they
      // stay its whole length, and the tick goes with them (THE TIMES).
      revert.current = window.setTimeout(() => {
        window.clearTimeout(refill.current);
        setFeedback(IDLE);
      }, STATUS_REFILL_MS + hold);
    }
  }

  const words = { copied, failed } satisfies Record<CopyResult, string>;
  const shown = feedback.spoken ? words[feedback.result] : '';

  return (
    <>
      <TextButton
        onClick={(event) => void copyAddress(event.currentTarget)}
        className={cx(CONTROL, ROOM)}
      >
        <ShareFace
          glyph={feedback.result === null ? CHAIN : GLYPH_OF[feedback.result]}
        >
          {label}
        </ShareFace>
      </TextButton>
      {line === null
        ? null
        : createPortal(<Answer shown={shown} words={words} />, line)}
    </>
  );
}
