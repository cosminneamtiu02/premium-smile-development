'use client';

import { useEffect, useId, useState, type ReactElement } from 'react';
import { useLocale } from 'next-intl';
import { Close } from '@/assets/glyphs/Close';
import { setLocaleCookie } from '@/i18n/cookie';
import { localeHref } from '@/i18n/href';
import { LOCALE_COOKIE, type Locale } from '@/i18n/locales';
import { matchLocale } from '@/i18n/match';
import { usePathname } from '@/i18n/navigation';
import { equivalentPath } from '@/lib/routes/routes';

// sections/LanguageBanner — the §8.6 suggestion banner: "this page also exists
// in the language you read", offered once, in that language, over the bottom of
// the page. Built to the owner-approved contract board
// `.claude/plans/language-banner.plan.md` (verdict fb-345, 2026-09-04) and the
// language-autoselect board's D2–D6.
//
// THE WHOLE OF LANGUAGE AUTO-SELECT since 2026-09-06 (owner — root
// Romanian-first): the root "/" stub still must send the visitor somewhere
// ("/" is not a page) but no longer guesses — cookie → defaultLocale, the
// browser's language unread — so this banner is the ONLY surface that reads
// `navigator.languages`. A DEEP LINK is different in kind: it
// is an address the visitor was given — a search result, a WhatsApp message, a
// card — and an address that silently becomes another address is a bug however
// well meant (D3; §8.6 bans IP/geolocation outright for the same reason). So
// this section never redirects, never rewrites a URL and never chooses for
// anyone: it offers ONE link and one way to say no.
//
// ── §15.15 LANE-OPEN VERDICT, 2026-09-04 (board §1, owner-confirmed Q-F):
// THE LANGUAGEBANNER IS NOT THE THIRD STATEFUL OVERLAY. The overlay-manners
// consolidation does NOT fire; the trigger stays armed, and the next live
// candidate is the ClinicGallery lightbox (FAQ is void forever — owner,
// 2026-09-02). The manners that consolidation would merge are P6's four
// KEEP-IN-SYNC twins, deliberately divergent between NavMenu and SpeedDial:
// document-bound Esc · `pagehide` flushSync pre-close · `pageshow persisted`
// close · focus-return-after-commit with the `offsetParent` guard. Held against
// this section as contracted:
//   1. NO ESC. A non-modal suggestion card opens nothing, so it owes nothing to
//      the close-on-Esc contract a disclosure owes. E7's load-bearing invariant
//      ("Esc has exactly ONE owner at any moment"), which the layers board says
//      a third stateful overlay must re-prove, holds here TRIVIALLY: this file
//      registers no Esc listener at all.
//   2. NO FOCUS CAPTURE. Appearing steals no focus (contract-pinned, and
//      asserted in the suite) — so there is nothing for focus-return machinery
//      to return.
//   3. NO LOCK, NO FREEZE, NO SCRIM. It never excludes the page; P4 (one
//      scroll-lock) and P5 (two freeze mechanisms, never a third) are untouched.
//   4. THE ONE SHARED SHAPE INVERTS THE SEMANTICS. The `pageshow persisted`
//      listener below RE-DECIDES visibility from the live cookie, where both
//      twins CLOSE unconditionally — same event, opposite rule, because this
//      card has no "open state" to close.
// One-of-four with inverted semantics is not a third consumer of the manners:
// consolidating now would extract a four-manner module whose third consumer
// uses none of it as written — the wrong-abstraction the rule-of-three exists
// to prevent (three ALIKE things, not three things). NOTHING MERGES FROM THIS
// LANE.
//
// ── TWO EXPORTS, ONE FILE, AND WHY THE SPLIT EXISTS (board §5).
//   · `LanguageBanner` — the MOUNT API. The shell renders exactly one of these
//     after <FloatingActions />, and everything visitor-dependent lives here:
//     the cookie, `navigator.languages`, the decision, the state.
//   · `LanguageBannerCard` — the PRESENTATIONAL inner, exported for stories and
//     tests. It decides nothing: hand it a locale, three strings, an href and
//     two callbacks and it renders the card.
// The seam is not tidiness. The wrapper's visibility depends on real browser
// state, which a Vitest case can stub honestly — but STORIES feed the visual
// net, and a baseline photographed through `navigator.languages` would record
// whichever machine took it. So stories render the CARD with pinned props (the
// ui/Modal open-state-story precedent) and the wrapper's logic is covered by
// the interaction suite.
//
// ── 'use client' (§16) and HYDRATION HONESTY (§16.2, P8). Three things force
// the island: the cookie read, `navigator.languages`, and `usePathname` (under
// `output: 'export'` the current path is not knowable at build time). All three
// are VISITOR-DEPENDENT, which is precisely the case §16.2 legislates: this
// component renders `null` until it has MOUNTED and DECIDED, and reads nothing
// about the visitor during the initial render. The build HTML therefore
// contains no banner at all — no flash, no mismatch, no CLS (the card is
// `fixed`, so even its arrival moves not one pixel of page content). That the
// accept link is consequently invisible to crawlers costs nothing: hreflang
// link tags in every head already route them (§10.4).
//
// ── §8.1 AND WHY THIS SECTION CALLS NO t() (D6) — the one place the tier's
// usual rule bends, and it bends for a reason that cannot be argued away. A
// client island only ever receives THE PAGE LOCALE'S messages (that is what
// next-intl serialises alongside the HTML), and the whole point of this card is
// that it speaks a DIFFERENT language from the page. `t()` cannot reach a
// foreign locale, and importing message JSON would drag all five dictionaries
// into the browser bundle. So the SHELL — a Server Component, where every
// locale is reachable — builds a `Record<Locale, BannerStrings>` at build time
// with `getTranslations({ locale })` and passes it in as a prop. Translation
// still happens in the section/page tier, exactly as §8.1 requires; it just
// happens one file up, in app/[locale]/layout.tsx, which carries the mirror
// comment.
//
// ── THIS SECTION IS ITS OWN HOST — the body-level exception (§6.4/§6.8).
// Every other section takes placement from a parent as `className`; there is no
// parent here to take it from. It is mounted as a bare sibling of <body> and
// anchors itself to the VIEWPORT, exactly as sections/FloatingActions' two
// `fixed` corners do, and for the same reason: a positioned, z-indexed wrapper
// would open a stacking context that judges this card and the corner discs as
// one unit, and NavMenu's freeze walks <body>'s children, so any wrapper would
// quietly freeze nothing. It therefore takes no `className` prop at all — a
// prop nobody can pass is a prop that should not exist.

/**
 * The three strings one locale's card needs, all of them in THAT locale's own
 * language — the reader is a visitor who cannot read the page they landed on.
 * `text` states the offer (naming the language by endonym), `accept` labels the
 * link, `dismiss` names the ✕.
 */
export type BannerStrings = { text: string; accept: string; dismiss: string };

export interface LanguageBannerProps {
  /**
   * All five locales' strings, built at BUILD TIME by app/[locale]/layout.tsx
   * (D6 — see the §8.1 note in this file's header). Every locale is present
   * because the suggestion is by construction one this page's own messages
   * cannot express.
   */
  messages: Record<Locale, BannerStrings>;
}

// ── THE ANCHOR (board §2 · Q-A, owner-approved; re-derived 2026-09-05 for
// fb-353): a centred toast LIFTED ABOVE the corner row, never a card in a
// corner.
//
// `bottom-[calc(11.5rem+env(safe-area-inset-bottom))]` — ONE value, no steps,
// and the number is a CLEARANCE, not a mirror. The tall corner is the RIGHT one
// since fb-353 (owner, 2026-09-04) stacked the WhatsApp disc above the phone:
// 1rem offset + disc + 0.5rem gap + disc (discs 3.5 → 4 → 4.5rem by
// breakpoint) = 8.5 / 9.5 / 10.5rem of reach; globals.css'
// `scroll-padding-bottom` steps (9.5 / 10.5 / 11.5rem — their authoritative
// home is FloatingActions.tsx' mount-contract obligation (a)) add the same
// breathing room for focus. Taking the TALLEST of those steps once clears the
// 2xl stack by 1rem and the phone stack by 3rem. The bond is "at least the
// stack's reach" — an inequality, not an equality — so this is deliberately
// NOT an fb-44 KEEP-IN-SYNC pair: the values need not agree, only exceed, and a
// three-step mirror would make this a third spelling of the P9(b) family for no
// gain. (The rule's first instantiation, 6.5rem, predates fb-353 — under the
// stacked corner it would have slid the card's right edge BEHIND the WhatsApp
// disc at phone widths, z-40 painting over z-30.) The `env()` term rides along
// because the stack itself is lifted by the safe-area inset; like every other
// spelling of it on the site it resolves to 0 until the shell opts into
// `viewport-fit: cover`.
//
// `fixed inset-x-4 mx-auto w-fit max-w-md` — the card hugs its sentence on wide
// screens and fills the 288px available at 320 (1rem margins a side, §7: nothing
// may require horizontal scrolling there). No width is ever fixed (§8.4: German
// runs +30–35% longer and must wrap).
//
// `z-30` — A NEW RECORDED SEAT, below the whole chrome trio (board §3 · Q-B;
// `.claude/plans/app-shell-layers.plan.md` §2's map stays otherwise closed at
// 40/45/50 + the top layer). Top-down, what the seat encodes: ContactModal
// (top layer) outranks everything by platform fiat; the Header pill (50) is
// nowhere near this card anyway; the NavMenu sheet (45) means MENU OPEN ⇒ THE
// BANNER IS DIMMED with the rest of the page (E2's one-interactive-surface
// manner); the corner discs and the open stem (40) beat a passive suggestion,
// because user-invoked chrome must always paint over it — a z-40 tie would
// invert exactly that, since this card mounts LATER in the DOM and would win on
// order. Below it: page content, over which the card floats.
//
// THE CARD IS FROZEN WITH EVERYTHING ELSE WHILE THE MENU IS OPEN, deliberately
// (board §4). NavMenu's freeze inerts <body>'s other children but exempts live
// regions BY ATTRIBUTE (`aria-live`), a carve-out its own comment wrote with
// this banner in mind. We decline it: there is no `aria-live` anywhere in this
// file, so the card goes inert like every sibling and the z-45 sheet dims it —
// it LOOKS dead and IS dead, which is the fb-129/136 trap staying shut. A card
// reachable under an open menu would be a second interactive surface (P7's
// spirit).
//
// LOOK: the site's one overlay language — ui/Modal's box and NavMenu's panel
// both wear `rounded-lg border border-line-subtle bg-surface`, and the shadow
// is what lifts this one off the page it floats over (there is no scrim here to
// separate them). Semantic tokens only (§3 standing notes). No container query
// and no media query INSIDE the card: one layout at every width, so §6.5 has
// nothing to police — the only screen-aware thing in this file is the viewport
// anchor above, which is host-level work this section owns because it IS its
// own host.
//
// MOTION (§9): a 200ms fade + 0.5rem rise on arrival, via `@starting-style` —
// ui/Modal's manner, and the reason it is a variant on the ENTRY state rather
// than a keyframe animation is that there is nothing to reverse (the card
// leaves by unmounting). `transition-property` is set ONCE, in the base, and
// the only variant that touches it is `motion-reduce:transition-none`: that is
// the PR #47 lesson kept, where a variant setting `transition-property` at
// (0,2,0) specificity silently outranked the reduced-motion opt-out.
const cardClasses =
  'fixed inset-x-4 z-30 mx-auto w-fit max-w-md ' +
  'bottom-[calc(11.5rem+env(safe-area-inset-bottom))] ' +
  'flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface ' +
  'p-4 text-ink shadow-xl ' +
  'transition-[opacity,translate] duration-200 ease-out ' +
  'starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none';

// The sentence, and the landmark's own name (see the <aside> below). `text-base`
// = 1rem, one step under the site's 1.125rem body: this is chrome, not prose,
// and it is still a rem so browser zoom and user font settings scale it (§7).
const textClasses = 'text-base';

// THE ACCEPT LINK. `min-h-11` (2.75rem = 44px) is the §9 target floor, rem-based
// so it grows with zoom, and `py-2` keeps that height honest when the label
// wraps to two lines in German.
// COLOR: `text-cta` at rest, `cta-hover` on hover — the direction every control
// on this site moves. cta #008854 measures 4.52:1 on `--surface` and 4.29:1 on
// `--page` (measured, recorded in ui/TextButton's colour invariant): this card's
// ground is `bg-surface`, which is exactly why the rest state is legal here and
// would not be on the page ground. The underline is STATIC, so the affordance
// never depends on hover or on colour alone (SC 1.4.1).
// `hyphens-none`: the site ships `hyphens: auto` at the body tier (§15.14), and
// an interactive label that breaks mid-word — "Deut-sch" — reads as a rendering
// fault (owner, 2026-09-04, ui/Button and ui/TextButton carry the same class for
// the same rule). Wrapping BETWEEN words is untouched.
const acceptClasses =
  'inline-flex min-h-11 items-center rounded-md px-2 py-2 font-medium ' +
  'text-cta underline decoration-2 underline-offset-4 hyphens-none ' +
  'transition-[color] duration-200 ease-out hover:text-cta-hover ' +
  'motion-reduce:transition-none';

// THE DISMISS ✕. A 44px square (§9's target floor again, `shrink-0` so a long
// sentence beside it can never squeeze it below that). ink-muted on white
// measures ~7:1, far above the 3:1 a glyph owes (SC 1.4.11).
const dismissClasses =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-md ' +
  'text-ink-muted transition-[color] duration-200 ease-out ' +
  'hover:text-ink-strong motion-reduce:transition-none';

/**
 * Has the visitor already chosen a language? (§8.7 — the site's one cookie.)
 *
 * PRESENCE is the whole test, not the value: any value means a choice was made
 * on purpose, by a switcher pick, by this card's accept, or by its dismiss
 * (D2 — "I am fine here" is a choice, and §12's one-storage rule is why it is
 * recorded as a locale rather than as a second flag). Re-asking someone who has
 * answered is the rudeness this component exists to avoid. The ROOT redirect
 * validates the value instead, because it INDEXES a table with it and a
 * nonsense value there would be a nonsense URL; here there is nothing to index.
 *
 * Split on ';' rather than matched with a RegExp built from LOCALE_COOKIE: the
 * emitted root script has to interpolate the name into a pattern and therefore
 * has to keep it regex-safe (that constant's own note records the hazard). This
 * one does not, so it does not.
 */
function hasLanguageChoice(): boolean {
  return document.cookie
    .split(';')
    .some((entry) => entry.trimStart().startsWith(`${LOCALE_COOKIE}=`));
}

/**
 * THE VISIBILITY RULE, in one place so that mount and the bfcache restore below
 * cannot drift: show a suggestion only when the visitor has made NO choice yet,
 * AND one of our five locales is among the languages they read, AND it is not
 * the one they are already reading. `null` means "say nothing" — including the
 * ordinary case where `matchLocale` finds nothing at all, which is a hidden
 * banner and never a redirect (D3, and see src/i18n/match.ts' header).
 */
function decide(pageLocale: string): Locale | null {
  if (hasLanguageChoice()) return null;
  // The `?? [navigator.language ?? '']` shape is inherited from the root
  // stub's retired read (its walk left 2026-09-06 — root Romanian-first, the
  // pair dissolved; this file is now the site's ONLY `navigator.languages`
  // reader) and kept on its own merits (G2 react review, 2026-09-04): on an
  // engine without `languages` an unguarded read would throw inside the
  // effect, and with no error boundary above the shell React would unmount
  // the whole hydrated tree — menu, dial and modal included — to spare one
  // optional banner.
  const match = matchLocale(navigator.languages ?? [navigator.language ?? '']);
  return match !== null && match !== pageLocale ? match : null;
}

/**
 * THE MOUNT API — one per document, rendered by app/[locale]/layout.tsx after
 * <FloatingActions /> and inside both providers.
 */
export function LanguageBanner({
  messages,
}: LanguageBannerProps): ReactElement | null {
  const pageLocale = useLocale();
  // Locale-STRIPPED ('/ro/blog/' → '/blog/'), which is the shape equivalentPath
  // compares against lib/routes/routes.ts' rows — the useLanguageOptions precedent.
  const pathname = usePathname();
  // `null` = show nothing, and it is BOTH the undecided and the decided-hidden
  // state on purpose: the two render identically, and one variable that cannot
  // disagree with itself beats two that can.
  const [suggested, setSuggested] = useState<Locale | null>(null);

  // ── THE DECISION, AFTER MOUNT (§16.2) — and the same decision again on a
  // bfcache restore (board §4 · Q-D, ADOPTED).
  // The back/forward cache returns the document you left FROZEN — DOM, React
  // state and all — without re-running anything, which is a gift on a static
  // site (§15.13 counts it as one) and the one case where this card can go
  // stale: accept it on page A, land on page B in the new language, press Back,
  // and the frozen page A would come back still offering what you already took.
  // One listener fixes it by RE-RUNNING the rule above against the live cookie.
  //
  // CITATION, NOT A SYNC PAIR (§15.15, and this file's verdict point 4).
  // NavMenu's D1 handler is where this shape comes from — same event, same
  // `persisted` gate, same "a navigation must leave nothing stale behind"
  // reasoning — and ui/SpeedDial's twin copies it. Those two CLOSE
  // unconditionally; this one RE-DECIDES and may legitimately keep the card up
  // (the visitor who dismissed nothing and accepted nothing is still owed the
  // offer). Because the rule differs, the three are not an fb-44 KEEP-IN-SYNC
  // set and this pointer is one-way: a change to the twins' dismissal manner
  // does not touch this file, and vice versa.
  //
  // `persisted` is what separates a restore from an ordinary load: `pageshow`
  // also fires on first paint, where the mount decision above has already run.
  // There is no `pagehide` pre-close twin here either — the twins need one
  // because a frozen OPEN menu paints for a frame before their repair lands,
  // while this card's stale frame shows an offer that is merely redundant.
  //
  // `settle` is the SINGLE STATE-WRITING PATH — the post-mount decision and
  // every restore go through it. That is also the shape
  // react-hooks/set-state-in-effect asks for ("subscribe to an external system,
  // setState in a callback"), and the reason this read cannot move out of an
  // effect at all: what a visitor's browser has stored and which languages they
  // read are not derivable from props, only readable after mount (§16.2). The
  // precedent is ui/Modal's "Does the body ACTUALLY overflow?" effect, whose
  // `measure` is the same one-writer shape for the same reason.
  useEffect(() => {
    const settle = () => setSuggested(decide(pageLocale));
    settle();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) settle();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [pageLocale]);

  if (suggested === null) return null;

  return (
    <LanguageBannerCard
      suggested={suggested}
      strings={messages[suggested]}
      // The same page over there, or that locale's home when it does not exist
      // there — equivalentPath knows the blog is Romanian-only (§5), so a
      // suggestion from /ro/blog/un-articol/ lands on /de/ rather than on a URL
      // `next build` never generated. localeHref puts the prefix, the trailing
      // slash and the interim base path on (§15.13).
      href={localeHref(suggested, equivalentPath(pathname, suggested))}
      onAccept={() => setLocaleCookie(suggested)}
      onDismiss={() => {
        // D2: dismissal stores THE PAGE'S OWN locale. "I am fine here" is an
        // explicit choice, and recording it as the choice it is means the
        // banner never asks again — with no second piece of storage, which §12
        // forbids outright.
        setLocaleCookie(pageLocale);
        setSuggested(null);
      }}
    />
  );
}

export interface LanguageBannerCardProps {
  /** The language being offered: the card's own `lang`, and every string's. */
  suggested: Locale;
  /** That locale's three strings — see BannerStrings. */
  strings: BannerStrings;
  /** The finished URL for the accept link (prefix, slash and base path on). */
  href: string;
  /** Runs on the accept press, BEFORE the browser follows the link. */
  onAccept: () => void;
  /** Runs on the dismiss press. */
  onDismiss: () => void;
}

/**
 * The card itself — pure presentation, no decisions, exported so stories and
 * tests can render it with pinned props (see the split note in the file
 * header).
 *
 * ── A LABELLED LANDMARK, NEVER A LIVE REGION (board §4 · Q-C). `role="status"`
 * would make this a live region — markup a screen reader announces on change —
 * but the ARIA pattern says a status region should hold no interactive
 * children, and this one holds two. An `<aside>` is a LANDMARK instead: a named
 * region a screen-reader user can jump to from the rotor, which is the exact
 * remedy sections/LanguageSwitcher's `<nav>` established for "the control that
 * helps you sits at the document's end". `aria-labelledby` points at the
 * sentence, so the landmark announces as "Diese Seite gibt es auch auf Deutsch,
 * complementary" — self-naming, in the suggested language, with the right voice
 * (`lang` on the root, SC 3.1.2), and at the cost of ZERO extra message keys.
 * The absence of `aria-live` is also load-bearing for the freeze — see the
 * anchor comment above.
 *
 * ── NO FOCUS STEAL. The card appears while the visitor is reading; moving
 * their focus for a suggestion they did not ask for is the behaviour that makes
 * banners hated, and SC 3.2.x's stance on unrequested context changes is the
 * formal version of the same objection. Nothing here calls focus(), and the
 * suite asserts it.
 *
 * ── SC 2.4.11 (Focus Not Obscured), recorded. While visible the card covers a
 * band above the corner row at every scroll position — the same class of
 * obligation the discs' own E13 answer carries. Held by: it is
 * user-dismissible with a keyboard-reachable control (asserted), it is
 * transient by purpose, and the §9 page-tier keyboard walkthrough already tabs
 * at several scroll positions. THE LOAD-BEARING HALF IS GEOMETRIC AND NAMED
 * (G2 a11y review, 2026-09-04; numbers re-derived 2026-09-05 for fb-353):
 * globals' `scroll-padding-bottom` rests a Tab-scrolled target's bottom edge
 * 9.5/10.5rem above the viewport bottom below 1536px while this card's lift is
 * 11.5rem, so a 2rem/1rem sliver of the focused element stays visible under
 * the card — "not entirely hidden", the AA minimum. At ≥1536px the step EQUALS
 * the lift and a Tab-scrolled target rests flush against the card's bottom
 * edge. The bond is therefore an
 * inequality — the lift must EXCEED every scroll-padding-bottom step it
 * overlaps — and the first centered bottom-band focusable narrower than this
 * card (§14's CTABanner, by design) is the named re-open trigger; the
 * walkthrough owns the entirely-hidden check, and globals' C43 block records
 * the same bond from the shell's side.
 */
export function LanguageBannerCard({
  suggested,
  strings,
  href,
  onAccept,
  onDismiss,
}: LanguageBannerCardProps): ReactElement {
  // One generated id per card, so a story canvas showing two of them still
  // names each landmark with its OWN sentence. useId is hydration-safe by
  // construction (§16.2) — the ContactModal precedent.
  const textId = useId();

  return (
    <aside lang={suggested} aria-labelledby={textId} className={cardClasses}>
      <p id={textId} className={textClasses}>
        {strings.text}
      </p>

      <div className="flex items-center justify-between gap-2">
        {/* A REAL LINK, and the browser is what navigates (§15.13): no router,
            no preventDefault, no client-side transition. The handler is a side
            effect on the way out — it stamps the choice into the cookie and
            gets out of the way, exactly as the switcher's own pick does.
            `hreflang` tells assistive tech and crawlers what language the
            destination is in; `lang` on the root already puts the LABEL in that
            language's voice, so it is not repeated here. */}
        <a
          href={href}
          hrefLang={suggested}
          onClick={onAccept}
          className={acceptClasses}
        >
          {strings.accept}
        </a>

        {/* The ✕. An icon-only control, so its name is the `dismiss` string
            (§9, and §6.3's rule written out by hand — this is a plain <button>
            per the board, not an atom, so no type enforces it here). The glyph
            stays DECORATIVE (aria-hidden by default): a labelled glyph inside a
            labelled button double-announces. assets/glyphs' Close is the repo's
            standalone ✕ and its own header names "a dismissable banner" as the
            call site this is. */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={strings.dismiss}
          className={dismissClasses}
        >
          <Close size="sm" />
        </button>
      </div>
    </aside>
  );
}
