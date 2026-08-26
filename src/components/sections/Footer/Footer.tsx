import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Wordmark } from '@/components/sections/Wordmark/Wordmark';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { Instagram } from '@/assets/glyphs/Instagram';
import { Phone } from '@/assets/glyphs/Phone';
import { Tiktok } from '@/assets/glyphs/Tiktok';
import { localeHref } from '@/i18n/href';
import type { ClinicInfo } from '@/lib/clinic';
import { clinic } from '@/lib/clinic';
import { formatHoursRows } from '@/lib/hours';
import { primaryRoutes } from '@/lib/routes';

// sections/Footer — the band that closes every page: brand · four info columns
// (contact · site map · the ANPC/SAL badge · opening hours) · legal strip.
// Built to the owner-approved N2 composition contract (fb-179, 2026-08-17);
// typography rides ui/Text + ui/Heading since the fb-186 rewire (label board
// Q5) — the classes those atoms emit are byte-for-byte the recipes this file
// used to hold as local constants, which is what keeps that swap invisible
// in the visual baselines.
//
// ── ZERO CLIENT ISLANDS — and since §15.13 the claim holds BY CONSTRUCTION.
// Nothing in here reacts to anything that happens after the page is painted, so
// the whole section ships as inert HTML with no JavaScript attached (§16) — the
// FloatingActions precedent, now at four times the size. Three consequences are
// load-bearing rather than incidental:
//   · "back to top" is a plain fragment link, not a scroll handler;
//   · the site-map rows are plain <a>s whose hrefs come from i18n/href.ts.
//     next/link is a CLIENT component (it exists to attach a click handler), so
//     until §15.13 those four links were four small hydration boundaries sitting
//     inside a section that claimed to have none;
//   · the SAL badge is a plain <img>, because the one image wrapper this repo
//     has is a client component (see the badge block below).
// It still calls t() with NO 'use client': next-intl's useTranslations and
// useLocale are ISOMORPHIC — they resolve against the request-scoped config
// while this Server Component is pre-rendered into complete static HTML, and
// read NextIntlClientProvider in Storybook/Vitest. The server-only
// getTranslations would work in the build and NOWHERE else, leaving the section
// un-storyable, and §13 wants a story per state. §8.1 holds either way: the
// atoms below never see a key, only finished text.
//
// ── ONE MEASURED BOX, NAMED STEPS ONLY. The gutter box is the `@container`,
// so every layout flip below reacts to the box the Footer actually occupies,
// never to the window (§6.5). The two steps are Tailwind's own names — @3xl
// (48rem) and @5xl (64rem) — so no custom value enters the untouched default
// scale (§3). GERMAN calibrates them (§8.4: ~+30–35% over English), which is
// what the GermanStress story exists to prove; the numbers are recorded at
// each grid below.
//
// ── WHAT THIS SECTION DOES NOT DO. It marks no active route (a footer link
// list is a site map, not a "you are here" indicator — the Header owns that,
// and it is the reason nothing here needs the router). It renders no heading:
// the one <h1> belongs to the page and a band repeated on every route must not
// claim outline slots (the Header's C2 rule, applied to the other end of the
// document). And it holds no NAP text of its own — name, phone, address and
// hours all come from lib/clinic.ts (§10.1), so the crawlable footer NAP (§10.5)
// and the future JSON-LD cannot disagree.

/**
 * The build year, evaluated ONCE at module scope. This is a Server Component:
 * in the real build the value is baked into the static HTML (§16), so there is
 * no hydration boundary for it to disagree across, and no clock in the browser.
 */
const YEAR = String(new Date().getFullYear());

/**
 * Hard-coded like NavMenu's PANEL_ID and for the same reason: exactly one
 * Footer exists per page (it is the shell's closing band), so a generated id
 * would only make the aria-labelledby pair harder to keep in step.
 */
const NAV_TITLE_ID = 'footer-nav-title';

/** One social profile the clinic actually has. */
export interface SocialEntry {
  name: 'instagram' | 'tiktok';
  url: string;
  labelKey: 'footer.socialInstagram' | 'footer.socialTiktok';
}

/**
 * The profiles worth a button, in render order. Exported because it IS the
 * conditional the tests need to see from both sides: lib/clinic.ts types both
 * URLs as optional (a network the clinic does not use is simply absent), and a
 * missing one must produce NO control rather than a dead link to an empty
 * profile. Calling this with `{}` is the honest way to prove that — no module
 * mock, no pretend clinic object, the section's own logic under test.
 */
export function socialEntries(social: ClinicInfo['social']): SocialEntry[] {
  // Same shape, minus the promise that the URL exists — which is exactly what
  // the filter below turns into a type the render loop can trust.
  const candidates: ReadonlyArray<
    Omit<SocialEntry, 'url'> & { url: string | undefined }
  > = [
    {
      name: 'instagram',
      url: social.instagram,
      labelKey: 'footer.socialInstagram',
    },
    { name: 'tiktok', url: social.tiktok, labelKey: 'footer.socialTiktok' },
  ];

  return candidates.filter((entry): entry is SocialEntry => Boolean(entry.url));
}

export function Footer(): ReactElement {
  const t = useTranslations('common');
  const locale = useLocale();
  // The day names come from Intl inside lib/hours (deterministic — a fixed
  // reference week, never today), the closed label from the message file: §8.1
  // keeps the formatter locale-aware but translation-free.
  const hours = formatHoursRows(clinic.hours, locale, t('footer.closed'));
  const address = clinic.address;
  const socials = socialEntries(clinic.social);

  return (
    // Full-bleed band. bg-surface (#ffffff) against the page's --page
    // (#faf9f7): the subtle distinct ground the old design got from `bg-subtle`,
    // built from the semantic roles this theme actually offers (§3 standing
    // note — components consume semantic tokens, never primitives). The hairline
    // above it is border-line-subtle, the same rule the rows below use, so the
    // whole band is drawn with ONE line color.
    // NO outer margin: pages own the rhythm between their last section and this
    // one (§6.4).
    <footer className="border-t border-line-subtle bg-surface">
      {/* THE GUTTER BOX — the same clamp the Header pill wears
          (Header.tsx:124): floor 1rem so the 320px stress width keeps its
          content, 10vw in the middle, 12.5rem ceiling so the band never
          stretches to a 1920px screen's edges. TWO consumers now share this
          number by copy; a THIRD one promotes it to a shared definition rather
          than a third copy (the rule-of-two this repo already applies to
          ui/slot.ts and lib/routes.ts). Header.tsx is deliberately not edited
          from this lane, so the cross-reference lives here only.
          `@container` marks THIS box as the thing the steps below measure —
          the section is then correct wherever it is placed and testable at any
          width in Storybook (§6.5). Vertical padding on Tailwind's untouched
          scale; all sizing in rem so browser zoom behaves (§7). */}
      <div className="@container mx-[clamp(1rem,10vw,12.5rem)] py-10">
        {/* ── ROW 1 · THE BRAND, since the fb-200 swap the SAME component the
            Header's corner renders (sections/Wordmark, contract v2
            fb-200…fb-208): artwork · hairline bar · the name at Heading's
            title step. The name is still data from lib/clinic.ts (§10.1) —
            never a message key — and the vectorized logo still lands by
            swapping one `src`, but now in ONE file instead of two that can
            disagree.
            THE fb-179 RULE THIS ROW WAS BUILT ON IS NOT BROKEN, it is MOOT:
            "no second link to home in the footer" assumed a link, and D9's
            wordmark is a placeholder <a> with no href — it navigates nowhere,
            takes no tab stop and carries no accessible name, so there is no
            duplicate destination to add. The question re-poses itself the day
            the wiring diff in Wordmark.tsx lands, and that is where it is
            written down. Still not a heading either (see the file header).
            THE TWO WRAPPERS ARE THIS SECTION OWNING PLACEMENT AND SIZE
            (§6.4/§6.8): the outer one keeps the old row's centring and its
            `pb-8` rhythm, the inner `h-16` box is the 4rem ruler the lockup's
            `h-full` bar and its percentage-sized artwork resolve against —
            EXACTLY the header instance's height, on the owner's ask that both
            read at the same size (fb-205). */}
        <div className="flex justify-center pb-8">
          <div className="flex h-16">
            <Wordmark />
          </div>
        </div>

        {/* ── ROW 2 · THE INFO GRID, on named container steps.
            1 column → @3xl (48rem) 2 columns → @5xl (64rem) the four-column
            row, with the site-map column at 0.6fr because its content is four
            short labels while its neighbours carry sentences, an address and a
            250px badge.
            CALIBRATION (German, the longest language): at the @5xl step the
            0.6fr track is ~155px; the longest German label — "Startseite" at
            text-lg — needs ~106px including TextButton's px-2, and the column
            title above it — the clinic name at text-xl (owner 2026-08-18) —
            ~135px, so the step still holds; at the sampled 1536 it is ~189px. The
            steps measure the BOX, not the window: with the 10vw gutters the
            two-column flip lands around a ~960px canvas and the four-column one
            at ~1280px. Fluid in between, no fixed widths anywhere (§7), and
            gap-8 is the section owning ALL child spacing (§6.4). */}
        <div className="grid grid-cols-1 gap-8 border-t border-line-subtle pt-8 pb-10 @3xl:grid-cols-2 @5xl:grid-cols-[1fr_0.6fr_1fr_1fr]">
          {/* COLUMN 1 · CONTACT. items-start so each child hugs its own
              content: the phone control is then a link-sized target, not a
              column-wide one. gap-3 rather than the sibling columns' gap-2
              (owner 2026-08-18): five stacked one-liners read as a wall at
              gap-2, and this column is the one a caller actually reads. */}
          <div className="flex flex-col items-start gap-3">
            {/* Muted supporting copy = ui/Text's tone axis (fb-182) at its one
                size: text-base rather than text-sm because the body base is
                1.125rem (§15.1) — 1rem already reads as "smaller", and this
                audience skews older (§1). --ink-muted measures 7.35:1 on the
                --surface ground, well past SC 1.4.3's 4.5:1. The SECTION
                decides the tone; the atom only offers it. */}
            <Text tone="muted">{t('footer.tagline')}</Text>
            <Text tone="muted">{t('footer.contactLabel')}</Text>

            {/* The site's one conversion goal (§1), in its quiet footer form.
                asChild: TextButton leaves no tag of its own, so this emits ONE
                <a href="tel:"> wearing the atom's clothes. The href is E.164
                (what a dialler needs), the visible text is the human format
                (what a reader needs) — two fields in lib/clinic.ts on purpose,
                and SC 2.5.3 Label in Name still holds because the glyph beside
                the number is aria-hidden, so the accessible name IS the visible
                text.
                -ml-2 cancels TextButton's own px-2 so the number lines up with
                the paragraphs above it — the PARENT owning placement (§6.8),
                never a restyle of the atom's internals. gap-2 spaces the two
                slot children this section put in there (§6.4). */}
            <TextButton asChild className="-ml-2 gap-2">
              <a href={`tel:${clinic.phone}`}>
                <Phone />
                {clinic.phoneDisplay}
              </a>
            </TextButton>

            {/* The crawlable NAP (§10.5) — plain text lines, no message keys:
                an address is data, and translating it would create a second
                source that can disagree with the JSON-LD. The county line is
                skipped when it repeats the city (the placeholder data has
                București twice), because printing it twice reads as a mistake
                rather than as precision. */}
            <Text tone="muted">{address.street}</Text>
            <Text tone="muted">
              {address.postalCode} {address.city}
            </Text>
            {address.county !== address.city && (
              <Text tone="muted">{address.county}</Text>
            )}
          </div>

          {/* COLUMN 2 · THE SITE MAP. A real navigation landmark, NAMED by its
              own visible title through aria-labelledby: a page carries the
              Header's nav too, and a second bare "navigation" is what
              HeaderNav's aria-label note anticipated. No new message key for
              it — the visible title is the clinic name (data), so the landmark
              announces as "Premium Smile, navigation".
              The routes come from lib/routes.ts, the ONE list the Header's row
              and panel render as well; Blog is absent on every non-`ro` locale
              (§5) because the module filters it, not because this file knows. */}
          <nav aria-labelledby={NAV_TITLE_ID} className="flex flex-col gap-2">
            {/* Both column titles are Heading's `title` step — visual twins by
                the ATOM now, not by a shared local constant: two different
                sources (data here, a message key below) still land as one row
                of headings because one component owns the treatment. The id
                spreads through onto Heading's host <p>, closing the
                aria-labelledby pair declared on the landmark above. */}
            <Heading id={NAV_TITLE_ID}>{clinic.name}</Heading>
            {/* A list, because it IS one: screen readers announce "list, N
                items" and offer item-by-item navigation. */}
            <ul className="flex flex-col items-start gap-1">
              {primaryRoutes(locale).map((route) => (
                <li key={route.path}>
                  {/* One <a> per entry, through TextButton's asChild slot, so
                      the atom leaves no tag of its own. A PLAIN anchor (§15.13):
                      the href arrives finished from i18n/href.ts — locale
                      prefix, trailing slash, interim base path — because
                      nothing downstream adds them any more. NO `active` here —
                      see the file header on why the footer marks nothing. -ml-2
                      aligns the labels with the column title (same optical
                      correction as the phone link). */}
                  <TextButton asChild className="-ml-2">
                    <a href={localeHref(locale, route.path)}>{t(route.key)}</a>
                  </TextButton>
                </li>
              ))}
            </ul>
          </nav>

          {/* COLUMN 3 · THE ANPC/SAL BADGE — the legally required link to the
              alternative-dispute-resolution portal. ONE badge, not two: the
              SOL/ODR platform the old site also linked has been dead since
              2025-07-20 and must never ship again.
              WHY A PLAIN <img> AND NOT ui/Image (the §11 wrapper), three
              independent reasons, any one of which is decisive:
                1. ui/Image wraps next-image-export-optimizer's ExportedImage,
                   which is a CLIENT component (it holds useState for its error
                   fallback). Importing it here would hydrate this band on every
                   page of the site — the exact opposite of this section's
                   zero-island contract.
                2. The optimizer only pre-generates variants for files under
                   `nextImageExportOptimizer_imageFolderPath` = public/images
                   (next.config.ts). This asset lives at public/ root, so the
                   generated /nextImageExportOptimizer/…-opt-640.WEBP URLs would
                   404 in the export.
                3. Its recovery from that 404 is a client-side onError swap —
                   i.e. it needs the very JavaScript point 1 refuses to ship.
              So: the fb-83 fallback for official fixed artwork, taken
              deliberately. width/height ATTRIBUTES reserve the box before the
              bytes arrive (§11, zero CLS), the intrinsic file is 500×124 and is
              drawn at half that (a free 2× for retina), `w-[15.625rem]` states
              the same 250px in rem so browser zoom scales it (§7), and
              `max-w-full h-auto` lets it shrink inside a narrow column at 320px
              without ever overflowing.
              alt="" makes the artwork DECORATIVE and the LINK carries the
              accessible name (aria-label) — announced once, not twice. The
              focus ring comes from the globals.css :focus-visible safety net
              (§9). target=_blank + rel="noopener noreferrer": an official
              external portal, opened without handing it a window handle.
              KNOWN DEBT, repo-wide rather than new here: neither this src nor
              ui/Image threads next.config's basePath, so under the interim
              PAGES_BASE_PATH deploy (§15.2) the file resolves at the domain
              root. Reported to the planning loop rather than patched from a
              section. */}
          <div className="flex flex-col items-start gap-2">
            <a
              href="https://reclamatiisal.anpc.ro"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.salLabel')}
              className="inline-block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/anpc-sal-pictograma.png"
                alt=""
                width={250}
                height={62}
                loading="lazy"
                className="h-auto w-[15.625rem] max-w-full"
              />
            </a>
          </div>

          {/* COLUMN 4 · OPENING HOURS. A description list, because that is the
              shape of the data: each <dt> is a day and each <dd> is what
              happens on it — seven rows, Monday → Sunday, one per day (owner
              2026-08-18; lib/hours groups no ranges anymore). The <div>
              wrappers are the standard HTML5 way to pair one term with one
              value — they are what makes the baseline-justified row possible
              without breaking dl semantics. */}
          <div className="flex flex-col gap-2">
            <Heading>{t('footer.hoursTitle')}</Heading>
            <dl className="flex flex-col gap-1">
              {hours.map((row) => {
                // Closed days are non-essential detail, so they recede — but
                // with a COLOR TOKEN, never opacity-60 as the old design did:
                // --ink-muted is a measured 7.35:1 on this ground, while an
                // opacity multiplier silently lands wherever the stack happens
                // to put it (§9). The tone is COMPUTED HERE and worn by each
                // element — ui/Text emits its ink explicitly (no inherit tone,
                // its D4), so the wrapper keeps layout only: same token as the
                // old wrapper-inherit shape, same computed color, and the
                // conditional stays section logic, exactly where the atom's
                // contract says it belongs.
                const tone = row.closed ? 'muted' : 'default';
                return (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <Text as="dt" tone={tone}>
                      {row.label}
                    </Text>
                    <Text as="dd" tone={tone}>
                      {row.value}
                    </Text>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>

        {/* ── ROW 3 · THE LEGAL STRIP. One column below the step (everything
            centred), three across it: copyright · back to top · socials.
            justify-items-center is also an ACCESSIBILITY requirement, not a
            taste: FloatingActions.tsx books SC 2.4.11 debt on page composition
            — "no standalone focusable narrower than ~72px flush against the
            left/right margins", because the fixed call disc sits bottom-right
            at every scroll position. Centred below the step, and inset ≥88px
            above it (10vw of the ≥960px canvas the step needs), is exactly the
            arrangement that section asks for. */}
        <div className="grid grid-cols-1 items-center justify-items-center gap-4 border-t border-line-subtle pt-6 @3xl:grid-cols-3">
          {/* text-center must sit on the <p> ITSELF: globals.css' base layer
              gives every p `text-align: start`, and a utility on the parent
              would only be inherited — losing to that direct rule. Text merges
              this className onto its own host <p> (§6.8, caller last), which
              is exactly "on the p itself". */}
          <Text
            tone="muted"
            className="text-center @3xl:justify-self-start @3xl:text-start"
          >
            {/* ICU with two placeholders — never a sentence glued from
                fragments (§8.2). The year crosses as a STRING on purpose: a
                number would be handed to Intl.NumberFormat by the message
                formatter and could come back grouped ("2.026") in ro/de. */}
            {t('footer.copyright', { year: YEAR, name: clinic.name })}
          </Text>

          {/* "#top" is the HTML spec's own name for the top of the document —
              it needs no element with that id and, crucially, no JavaScript.
              The glide comes from `scroll-behavior: smooth` in globals.css,
              itself wrapped in prefers-reduced-motion: no-preference (§9). */}
          <TextButton asChild className="@3xl:justify-self-center">
            <a href="#top">{t('footer.backToTop')}</a>
          </TextButton>

          {/* The socials — one control per profile the clinic actually has,
              and NOTHING for a network it does not (socialEntries above).
              GlyphButton outline is the atom's own "socials" bundle; asChild
              makes each <a> the control, so this emits no <button> anywhere in
              the section. The glyphs stay UNLABELLED: a labelled glyph inside
              an asChild anchor double-announces (ui/GlyphButton's children
              doc), and the anchor is already named from the ICU message with
              {name} filled from the single NAP source. size="md" = 2.75rem,
              the §9 touch-target floor. */}
          <div
            data-footer-socials
            className="flex items-center gap-2 @3xl:justify-self-end"
          >
            {socials.map((entry) => (
              <GlyphButton
                key={entry.name}
                asChild
                variant="outline"
                size="md"
                aria-label={t(entry.labelKey, { name: clinic.name })}
              >
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.name === 'instagram' ? <Instagram /> : <Tiktok />}
                </a>
              </GlyphButton>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
