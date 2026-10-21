import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import { Facebook } from '@/assets/glyphs/Facebook';
import { Mail } from '@/assets/glyphs/Mail';
import { Whatsapp } from '@/assets/glyphs/Whatsapp';
import { Text } from '@/components/ui/Text/Text';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { CopyLinkButton, type CopyLinkContent } from './CopyLinkButton';
import { CONTROL, ShareFace } from './ShareFace';

// sections/ShareLinks — the blog article's four share controls, above the
// cover photograph at its top right. The owner, verbatim (2026-10-14): "the 4
// share buttons above the image in the top right as in example, those would
// be the rop button buttons with adjacent svgs in the button which on hover
// tutn lilla and at base are black" — and, asked which four: Facebook ·
// WhatsApp · E-mail · Copy link. The example he attached (a real-estate blog)
// sets four small controls — a glyph and a word each — at the right end of the
// row above its wide photograph.
//
// ── "THE TOP BUTTON BUTTONS" = ui/TextButton, the top bar's menu button: ink
// at rest, the lavender and its underline under the pointer — "at base are
// black … on hover turn lilla". Each control's glyph paints `currentColor`, so
// it follows the word's colour on the atom's own 200ms colour clock
// (./ShareFace.tsx). This file passes the atom no colour: its look is the
// top bar's, by construction.
//
// ── THREE LINKS AND ONE BUTTON. Facebook, WhatsApp and e-mail GO somewhere,
// so each is a plain <a href> (§15.13) that ui/TextButton dresses through
// `asChild`; their addresses arrive built — the page builds them with
// lib/share at build time — and this file prints them, nothing more. No
// plugin and no script: a link loads nothing and tells Facebook nothing until
// the visitor clicks it (§12; lib/share's header has the Fashion ID reason).
// The copy control DOES something in place, so it is a real <button>:
// ./CopyLinkButton.tsx, one of the two client islands the article page adds
// (the gallery's carousel, sections/CardCarousel, is the other; CLAUDE.md
// §16). This file stays a server component — the three links and the status
// line are inert HTML on every article (§16) — and its one hook is `useId`,
// which renders on the server (sections/PostPage's precedent).
//   · THE SAME TAB — the privacy policy's rule for its links out
//     (sections/PrivacyPolicy's sources), applied here: Back works, and a new
//     tab would grey it out and announce nothing. It is not every link's rule
//     on this site: the Footer, the corner's WhatsApp disc (FloatingActions)
//     and the contact dialog open their wa.me links in a new tab, and the
//     Footer its networks too. `rel="noreferrer"` on Facebook and WhatsApp,
//     as on the policy's links: the browser then sends no Referer at all,
//     where its default policy would send this site's origin (never the
//     page's path, to another site). It hides little here — the article's
//     address travels inside the link itself, since it is what is shared. The
//     e-mail link opens a mail app, so it carries no `rel` at all.
//   · EACH LINK'S NAME is the page's sentence — „Facebook, distribuie articolul" — as
//     its `aria-label`, because a bare „Facebook" names a network, not what
//     the link does. The visible word stays inside that name (SC 2.5.3), so a
//     voice-control user who says what the eye reads still reaches the link.
//     The copy button needs none: its word says what it does, and is its
//     name — in every state (./CopyLinkButton.tsx's WHY THE NAME STAYS).
//   · OPEN, THE OWNER'S CALL (the accessibility review, round 3): on a phone
//     the WhatsApp glyph here is the very mark of the corner disc „Scrieți-ne
//     pe WhatsApp" (sections/FloatingActions), so an older visitor meaning to
//     write to the clinic may tap this one instead and land in WhatsApp's
//     screen for forwarding the article to a contact — whether the two should
//     look different is his to say, and nothing here changes until he does.
//
// ── THE LABELS' STEP. The words show where the control row's CONTAINER is at
// least 42rem wide (`@2xl`) — on the article page that container is
// sections/PostCover's root, as wide as the page's column — and below it the
// four controls are their glyphs alone, each word hidden the
// screen-reader-only way (./ShareFace.tsx's THE WORD). MEASURED in Chromium
// with the real face, Source Serif 4 (ShareLinks.stories.tsx's MEASURED,
// 2026-10-14): labelled, the four controls are 118.8 · 125.5 · 94.1 ·
// 158.7px, a list of 521.1px with its gaps; the reading time beside them is
// 97.2px for one digit of minutes („4 min de citit") and 105.5px for two,
// up to the 60 the data allows; with the cover row's 24px gap the line needs
// 650.6px at most — under the 672px the step starts at, so wherever the words
// show they share ONE line with the reading time, as in the owner's example.
// Tailwind's next step down, 36rem (576px), is under that line: there the
// words would push the controls onto a line of their own. 42rem is the
// smallest named step at which they fit. On the page a 42rem column is an
// 840px window (~859px behind a classic 15px scrollbar): a phone and a tablet
// held upright (768 · 820 · 834) show the glyphs, and a tablet held
// sideways, a laptop and a desktop the words. Inside the page's BAND SCALE (a
// laptop or desktop with a mouse, §15.32) every length here is redrawn in the
// design pixel while the step stays 42rem of CSS pixels: the column there is
// at least 896px, so the words always show, and the line needs 650.6 design
// pixels of the column's 1106 — never tight. No answer widens the line: the
// copy button keeps its word in every state, and what a press did is said on
// THE LINE, under the controls.
//
// ── THE HIT AREA. ui/TextButton is 44px tall at least (`min-h-11`); with its
// word hidden a control would be the glyph plus the atom's padding, 32px wide,
// so every control gets a 44px width floor at the call site (./ShareFace.tsx's
// CONTROL): 44 × 44 with glyphs alone, the §9 target. Under the band scale's
// design pixel both floors are 44 design pixels — never under 35.6 CSS pixels,
// over SC 2.5.8's 24, and only for a mouse or a trackpad. KEEP-IN-SYNC:
// sections/PostCover's THE READING TIME'S BOX caps its one row track at this
// very 44px step — the controls' height, ui/TextButton's `min-h-11` — so the
// reading time stays level with the controls when the line opens under them;
// the two move together (ShareLinks.test.tsx requires every control to
// carry the cap's height step).
//
// ── THE ROW, `flex flex-wrap items-center justify-end gap-2`, on the list.
// 8px between controls — the Header's menu row spacing — so with each atom's
// own 8px a side, one control's word stands 24px from the next control's
// glyph while its own glyph stands 8px from it: four pairs, read as four.
// Glyphs alone, the four 44px targets with their gaps are 200px (measured;
// sections/PostCover's stand-in slot is built to that shape). `justify-end`
// keeps the controls at the list's end should a parent give it more room than
// it needs ("top right"); `flex-wrap` lets them wrap rather than push a
// narrow column sideways (§7). No `@container` anywhere here, LOAD-BEARING:
// the row is a content-sized child of the cover's row, and a size container's
// width does not depend on its contents — it would collapse to nothing. The
// word's step reads the cover's container above it instead. No outer margin
// (§6.4): the page places the row.
//
// ── THE LINE (2026-10-20, round 2 of the reviews): ONE status line under the
// four controls, where the copy button's answer is SAID — „Link copiat", or
// „Linkul nu a putut fi copiat" — at every width (./CopyLinkButton.tsx's WHAT
// THE VISITOR LEARNS). This file prints it: a <p> — ui/Text, the reading
// time's body step in the body's ink — with `role="status"`, EMPTY, beside the
// list and never in it (a list holds list items, and inside the copy item it
// would make that item taller and move the three links off their line); the
// island fills it through a portal from the first press, by the id this file
// makes with `useId` and hands both (CopyLinkButton.tsx's THE LINE). Empty, it
// is 0px tall: the row at rest is the list alone, to the pixel.
//   · `contain: inline-size` (`contain-inline-size`), LOAD-BEARING: the line
//     then adds nothing to the row's width — a size-contained box is laid out
//     as if it had no content — so the row stays as wide as its four
//     controls, the answer wraps inside that width (200px on a phone), and a
//     long sentence can never widen the cover row's slot and push the list
//     onto a line of its own.
//   · `text-end`: the words end under the copy button, the control that said
//     them — the logical edge (§3), on the element itself (§15.15 b's canon).
//   · `text-balance`: a sentence that wraps — German's or Italian's failure
//     in the glyphs' 200px — breaks into lines of even length, each ending at
//     the row's end, instead of a full first line over a short last one (the
//     accessibility review, round 3). On the element too, like `text-end`.
//   · its height, once open, is the island's: the tallest of the answers,
//     kept (CopyLinkButton.tsx's THE HEIGHT).
//   MEASURED (Chromium, the real face, the real sections/PostCover in
//   ui/Container's column and sections/PostPage's rhythm box, behind a classic
//   15px scrollbar, 2026-10-20): at a 390 window the line opens 200 × 32px
//   under the four glyphs in Romanian — one 24px line and the 8px above it —
//   and 200 × 56px in German, whose „Der Link konnte nicht kopiert werden"
//   wraps inside the glyphs' 200px; the same at 320; at 1280, in the band
//   scale, 473.6 × 29.2px under the labelled controls. The four controls'
//   boxes after a failed press are those before it, at every one of those
//   widths and in both languages, and 5.3 seconds later every box of the row
//   is where it was. Until 2026-10-20 the failure grew the copy button to
//   253.6px, the e-mail link slid into its place, and the row's collapse at 5
//   seconds scored a layout shift of 0.154 at 390 × 844 and 0.297 at 320 × 568
//   (round 2 of the reviews).
//   THE ONE SHIFT, the press's own: the line opens with it, so the cover's row
//   grows by the line — 32px (Romanian) or 56px (German) on a phone, 29.2 at
//   1280 — and pushes the cover picture, and the tags over it, down by as
//   much. Nothing else moves: the reading time beside the controls stays where
//   it was, level with them, since sections/PostCover keeps it in a box of its
//   own whose one row track is never taller than the controls' 44px step
//   (PostCover's THE READING TIME'S BOX, 2026-10-21 — the lever this record
//   named, taken). Until then the cover's row centred the reading time on its
//   taller line, and a press moved it down by half the line: 16 / 28px at
//   390, 14.6px at 1280. On a top-level page the shift lands 23 to 48ms after
//   a real click or tap, and Chromium marks it as caused by the input
//   (`hadRecentInput`), which Cumulative Layout Shift excludes (§10.6);
//   nothing moves afterwards (6 seconds observed).
//
// ── THE ROOT AND THE BELT. The native props — an id, a class for the
// placement, a `ref` — ride the ROOT, the generic box that holds the list and
// its line (§6.8's place for them: the box the parent places). The list keeps
// its own role and name, which no prop reaches: `role="list"` because Safari
// drops list semantics from a list styled without bullets, which Tailwind's
// preflight does to every <ul> (eslint.config.mjs's list-role-for-webkit
// note) — a screen reader then says „Distribuie articolul, list, 4 items" —
// and the name `label`. A generic box takes no role and no name, so the props
// refuse `role`, the two ARIA naming attributes and `dangerouslySetInnerHTML`
// (a box that renders its own children can take no markup besides: React
// throws) — sections/PostCard's and sections/Pagination's refusals. The type
// stops a caller who WRITES `role` or `dangerouslySetInnerHTML`, but
// TypeScript exempts a hyphenated JSX attribute from its excess-property
// check, so a written `aria-label` or `aria-labelledby` compiles, and a spread
// of a wider object carries anything. So the native props ride FIRST and the
// root's resets after them: a smuggled `role` cannot make the box a landmark
// or a widget, nor a smuggled name name it. A smuggled
// `dangerouslySetInnerHTML` meets no reset (sections/PostCard's way): React
// refuses it at render, loudly, and the static export fails to build. Until
// 2026-10-20 the list WAS the root and wore the native props.
//
// ── A DUMB PROPS-IN PIECE (§4's shared compositions; the build contract's
// §0): zero message keys, no t(), no data import. Every word and every
// address arrives FINISHED from the article route.

/** One share link: its address, its visible word and its accessible name. */
export type ShareLink = Readonly<{
  /** The address, built by the page (lib/share). A plain string — a type
   *  that only lib/share could mint would make an address built anywhere
   *  else a compile error: a lever, not taken (the TypeScript review). */
  href: string;
  /** The visible word, e.g. „Facebook" — shown from the container's 42rem. */
  label: string;
  /** The accessible name, e.g. „Facebook, distribuie articolul" — it contains the visible word (SC 2.5.3). */
  name: string;
}>;

type ShareLinksOwnProps = {
  /** The list's accessible name, e.g. „Distribuie articolul". */
  label: string;
  facebook: ShareLink;
  whatsapp: ShareLink;
  email: ShareLink;
  /** The copy control's address and its three words — the island's own
   *  type (./CopyLinkButton.tsx), never a copy of it. */
  copy: CopyLinkContent;
};

export type ShareLinksProps = ShareLinksOwnProps &
  // The native surface of the ROOT, a generic <div>, minus the list's own
  // props, minus `children` (it renders its own list and line) and minus what
  // a generic box cannot take (THE ROOT AND THE BELT): `role`, the two ARIA
  // naming attributes and `dangerouslySetInnerHTML`. React 19 carries `ref`
  // inside these props.
  Omit<
    ComponentPropsWithRef<'div'>,
    | keyof ShareLinksOwnProps
    | 'children'
    | 'role'
    | 'aria-label'
    | 'aria-labelledby'
    | 'dangerouslySetInnerHTML'
  >;

/** THE ROW — one static string, because Tailwind reads class names from source text. */
const LIST = 'flex flex-wrap items-center justify-end gap-2';

/** THE LINE — never wider than the controls above it, its words at their
 *  end, a wrapped sentence's lines even. */
const LINE = 'contain-inline-size text-end text-balance';

type ShareAnchorProps = Readonly<{
  link: ShareLink;
  glyph: ReactElement;
  /** `noreferrer` for a web address; an e-mail link carries none (THE SAME TAB). */
  rel?: 'noreferrer';
}>;

/** One share link: ui/TextButton on a plain <a>, the glyph beside the word. */
function ShareAnchor({ link, glyph, rel }: ShareAnchorProps): ReactElement {
  return (
    <TextButton asChild className={CONTROL}>
      <a href={link.href} rel={rel} aria-label={link.name}>
        <ShareFace glyph={glyph}>{link.label}</ShareFace>
      </a>
    </TextButton>
  );
}

export function ShareLinks({
  label,
  facebook,
  whatsapp,
  email,
  copy,
  ...rest
}: ShareLinksProps): ReactElement {
  // THE LINE's id, shared by the line and the island that fills it.
  const statusId = useId();
  return (
    <div
      {...rest}
      role={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
    >
      <ul role="list" aria-label={label} className={LIST}>
        <li>
          <ShareAnchor
            link={facebook}
            glyph={<Facebook size="sm" />}
            rel="noreferrer"
          />
        </li>
        <li>
          <ShareAnchor
            link={whatsapp}
            glyph={<Whatsapp size="sm" />}
            rel="noreferrer"
          />
        </li>
        <li>
          <ShareAnchor link={email} glyph={<Mail size="sm" />} />
        </li>
        <li>
          <CopyLinkButton {...copy} statusId={statusId} />
        </li>
      </ul>
      {/* THE LINE: empty here — on the server and in the first render in the
          browser alike — and filled by the island from the first press. */}
      <Text id={statusId} role="status" className={LINE}>
        {null}
      </Text>
    </div>
  );
}
