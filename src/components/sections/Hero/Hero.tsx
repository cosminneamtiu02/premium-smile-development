import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ContactModalTrigger } from '@/components/sections/ContactModal/ContactModalTrigger';
import { Container } from '@/components/ui/Container/Container';
import { Text } from '@/components/ui/Text/Text';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { localeHref } from '@/i18n/href';

// sections/Hero — the opening band of Home: the site's one <h1>, a support
// line, and the dual call to action (book → the ContactModal · see services →
// /services). Built to the approved composition contract
// .claude/section-runs/2026-09-06_12-25_home-page/sections/Hero.md (PHASE-4
// CONTENT RUN, stage S2). The old repo's composite/hero is a REQUIREMENTS
// source only (§17.2) — copy and the CTA pair; nothing else of it survives.
//
// ── THE BAND RECIPE, consumed not restated. ui/Container's file header is
// standing law since the gutter promotion (§15.15 a, board fb-343): the
// full-bleed semantic outer owns PAINT and vertical RHYTHM, the Container
// inside owns WIDTH and the container-query context, and named container steps
// only (§3's untouched scale), calibrated against German (§8.4). This file
// therefore spells no clamp and no gutter — composing the atom IS the gutter —
// and its `py-20` is the band's own rhythm (§6.4: pages own the space BETWEEN
// bands, sections own the space inside them).
//
// ── WHY THERE IS NO PHOTOGRAPH (D-S2-3). The old hero was a five-second
// setInterval carousel over Unsplash URLs. None of that migrates: the images
// were stock placeholders loaded from a third-party CDN, which §12 bans
// outright, and the clinic's own photography does not exist yet (§15.6 —
// TODO(owner) supplies it). Rather than ship a decorative stock face, the band
// is TYPE on a token wash, and the LCP element (§10.6) is this h1's text —
// which is the cheapest possible LCP: no bytes to download, no layout to
// reserve, nothing to regress. When real photography lands, the recipe's rule 1
// already says where it goes (the outer, full-bleed) and §15.1's scrim floor
// (≥ 0.55) already says what the type then needs.
// The carousel itself is not deferred, it is REFUSED: auto-advancing content
// carries §9's motion duty (and SC 2.2.2's pause requirement) for a decorative
// gain, and its aria-hidden clone headings existed only to crossfade titles.
// A static band has neither problem.
//
// ── THE h1 IS WRITTEN OUT, NOT ui/Heading (D-S2-4, PROVISIONAL). The atom's
// biggest shipped step is `section` (text-3xl), and its own growth rule says a
// bigger step joins "additively only with measured consumers" — this band is
// that consumer, but widening an atom's public API mid-run serializes the whole
// lane behind an atom rework. So the display type rides the element here and
// the promotion is LOGGED for its own lane: ui/Heading grows a `page` step,
// this file drops four classes, and the rendered result must not move.
// The id is the other half of the <section aria-labelledby> pair: the band is a
// named region, and the name is the title's text alone (the SectionHeading
// precedent one tier over — the id lands on the element carrying the TEXT).
//
// ── ISOMORPHIC, NOT A CLIENT ISLAND. It calls t() with NO 'use client':
// next-intl's useTranslations/useLocale resolve against the request-scoped
// config while this Server Component is pre-rendered into complete static HTML
// (§16), and read NextIntlClientProvider in Storybook and Vitest — the
// FloatingActions/Footer precedent. The server-only getTranslations would work
// in the build and nowhere else, leaving the band un-storyable, and §13 wants a
// story per state. The ONE hydrated thing in here is the primary CTA, which is
// a client component because pressing it flips the shared dialog switch; the
// rest of the band is inert HTML.
//
// ── THE TWO CTAs ARE DELIBERATELY DIFFERENT KINDS OF CONTROL (§9: a real
// <button> for an action in place, a real <a href> for a destination). The
// primary summons the dialog and is therefore a ContactModalTrigger — a
// ui/Button whose type OMITS asChild precisely so an opener can never become an
// anchor. The secondary GOES somewhere, so it is a plain anchor built by
// localeHref (§15.13: full-document navigation, no next/link anywhere) wearing
// ui/TextButton through asChild. Neither wears a hover pop: the old repo's
// scale-105 CTAs were replaced by Button's own calm fade (fb-49/50).

export function Hero(): ReactElement {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    // Full-bleed band. The wash is the §15.1 decorative accent at 10% over the
    // page ground — a graphic, never text ink, which is exactly the role that
    // token is licensed for. It fades INTO --page so the next band starts on
    // the same ground it ends on, with no seam to align.
    // NO outer margin: the page owns the rhythm between bands (§6.4).
    <section
      aria-labelledby="hero-title"
      className="bg-linear-to-b from-accent-decorative/10 to-page py-20"
    >
      {/* THE GUTTER BOX (Container.tsx header law): the clamp and the
          `@container` mark arrive together, which is what lets the h1's
          `@3xl:` step measure THIS column instead of the window (§6.5). The
          `flex flex-col gap-6` is the band owning ALL child spacing (§6.4) —
          the children below carry no margins of their own. */}
      <Container className="flex flex-col gap-6">
        {/* max-w on the TEXT, never on the gutter (Container's recorded
            non-duty): a 1536px column at 1920 is no place for a headline
            either, and the cure is per-element. text-balance evens the last
            line's ragged edge on a 2–3 line title — decorative only, and
            browsers without it simply wrap normally. */}
        <h1
          id="hero-title"
          className="max-w-3xl font-display text-4xl text-balance text-ink-strong @3xl:text-5xl"
        >
          {t('hero.title')}
        </h1>

        {/* ui/Text at its one size; className carries MEASURE and nothing else
            (§6.8 — a caller may position and space an atom, never restyle its
            internals: no font-size, no color here). The tone axis is the
            section's decision, the ink token the atom's. */}
        <Text tone="muted" className="max-w-2xl">
          {t('hero.subtitle')}
        </Text>

        {/* THE CTA ROW. flex-wrap because German runs +30–35% longer (§8.4) and
            the pair must stack rather than clip at 320px; gap-4 is the row's
            spacing, owned here. items-center keeps the quiet text control
            optically on the solid button's line. */}
        <div className="flex flex-wrap items-center gap-4">
          {/* size lg = min-h-14, comfortably past §9's 44px primary target.
              The variant is Button's default `solid` — the LOCKED CTA green
              (§15.1) — and is left unwritten on purpose: one place decides what
              a primary action looks like, and it is not this file. */}
          <ContactModalTrigger size="lg">
            {t('hero.ctaPrimary')}
          </ContactModalTrigger>

          {/* asChild: TextButton leaves no tag of its own, so this emits ONE
              <a> wearing the atom's clothes. The href arrives FINISHED from
              i18n/href.ts — locale prefix, trailing slash, interim base path —
              because nothing downstream adds them any more (§15.13). */}
          <TextButton asChild>
            <a href={localeHref(locale, '/services')}>
              {t('hero.ctaSecondary')}
            </a>
          </TextButton>
        </div>
      </Container>
    </section>
  );
}
