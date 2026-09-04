import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { FloatingActions } from '@/components/sections/FloatingActions/FloatingActions';
import { Footer } from '@/components/sections/Footer/Footer';
import { Header } from '@/components/sections/Header/Header';
import { mono, serif } from '@/fonts';
import { routing } from '@/i18n/routing';
import '@/styles/globals.css';

// THE SHELL (brief §5): locale dictates the shell, the sub-route the content.
//
// PHASE-4 MOUNT CONTRACT — DISCHARGED (2026-09-02/03, the app-shell-mount
// lane). The assembled bill this file owed is the checklist "Shell mount
// contract" under MIGRATION_PLAYBOOK.md Phase 4, executed to the owner-approved
// boards .claude/plans/app-shell-layers.plan.md (the design: layer map, edge
// dossiers E1–E14, invariants P1–P9) and .claude/plans/app-shell-mount.plan.md
// (the manifest). Each number keeps its ONE home in the named section's own
// header — this file mounts, it does not re-derive. What is pinned where:
// src/app/[locale]/shell.test.tsx renders THIS assembly shape as body-level
// siblings and asserts the order, the freeze, the P7 single-open invariant, the
// skip-link and the globals scroll-padding pair.
//
// THREE BOXES STAY OPEN ON PURPOSE, each annotated in the playbook:
//   · the page-composition rule for the bottom corner bands (FloatingActions b)
//     — a STANDING rule every page lane carries, never "done";
//   · `viewport-fit: cover` (FloatingActions' own caveat) — DORMANT until the
//     first full-bleed hero asks for it; the `env()` terms are already written
//     so that day changes one export, not four expressions;
//   · Wordmark's two-line home-link wiring diff (Wordmark.tsx header) — PARKED
//     on the owner's word, because landing it re-poses fb-179 (a second home
//     link per page, once the Footer has one too).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: t('siteName'),
    // Never indexable: staging always (GITHUB_SETUP §3, STAGING=1) and the
    // interim Pages production until the real domain lands (§15.2, NOINDEX=1).
    ...(process.env.STAGING === '1' || process.env.NOINDEX === '1'
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering (next-intl static-export requirement).
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <html lang={locale} className={`${serif.variable} ${mono.variable}`}>
      {/* THE FOOTER STAYS AT THE BOTTOM ON SHORT PAGES (owner, 2026-09-04:
          "on every screen the footer must always stay at the bottom of the
          page"). A localized 404, or any page whose content is shorter than the
          viewport, would otherwise leave the footer floating mid-screen with
          blank page-ground beneath it. `min-h-dvh` + a column flex context makes
          <body> at least a screen tall, and `flex-1` on <main> hands it every
          leftover pixel — so the footer is pushed to the bottom edge when the
          content is short, and simply follows the content when it is long.
          THE FLEX CONTEXT IS ON <body> ITSELF, never on a wrapper — that is not
          a style preference (P1/E11): NavMenu's freeze applies `inert` to
          <body>'s children, so a layout <div> introduced to hold these classes
          would silently freeze nothing. The tripwire exists for exactly that
          mistake, and shell.test.tsx pins both facts together.
          `dvh`, not `vh`: mobile URL bars change the viewport height as you
          scroll, and `vh` freezes the tallest value — the same reasoning
          NavMenu's panel cap records for its own `100dvh`.
          Margin-collapsing, the classic sticky-footer footgun, cannot bite
          here: a flex container establishes a new formatting context, and §6.4
          bans outer margins on sections anyway. */}
      <body className="flex min-h-dvh flex-col bg-page font-body text-ink">
        {/* NEITHER PROVIDER RENDERS A DOM ELEMENT — which is the only reason
            wrapping the whole document in them is legal here. NavMenu's page
            freeze applies `inert` to <body>'s OTHER children, so it freezes
            something only while header · main · footer · FloatingActions are
            genuine body-level SIBLINGS (Header.tsx "THE MOUNT CONTRACT" (b),
            P1). A React context provider is invisible to the DOM and
            NextIntlClientProvider adds no box either, so the eight AUTHORED
            children below all land as direct children of <body>. At runtime
            they are not quite alone there — React streams a `<div hidden>`
            Suspense placeholder ahead of them, Next closes the document with its
            bootstrap <script> tags and appends <next-route-announcer> — and the
            freeze harmlessly walks those too: none renders a box or takes focus,
            and the announcer has its own carve-out in NavMenu's `isLiveRegion`.
            shell.test.tsx's `shellChildren()` survey is the recorded truth
            there, measured against the built export. One layout <div> here,
            though, and the freeze still "works" while freezing nothing —
            silently; NavMenu ships a dev tripwire that says so out loud, and
            shell.test.tsx asserts it stays silent against this shape.
            The nesting order is not free either: ContactModal calls
            t('contact.*'), so the provider that renders it must sit INSIDE
            next-intl's. It renders {children} and then the ONE <dialog> after
            them (ContactModalProvider header, E10), which is what puts the
            dialog last in the document, out of every landmark, and
            `display: none` until a trigger — never in normal flow, so the
            FOOTER stays the last box in normal flow even though the dialog is
            the last ELEMENT (and the sticky-footer rule above therefore has the
            bottom edge to itself). */}
        <NextIntlClientProvider>
          <ContactModalProvider>
            {/* THE SKIP-LINK (mount-contract box 9 — this lane's only new UI,
                carried by no section header because it belongs to no section).
                SC 2.4.1 Bypass Blocks: the bar's nav row is on every one of the
                site's pages, and a keyboard or switch user must not walk it
                before reaching the page.
                THE REVEAL IS IN-FLOW, deliberately (design board Q1). `sr-only`
                clips it to an absolutely-positioned 1px box at rest;
                `focus:not-sr-only focus:block` puts it back into NORMAL FLOW at
                the top of the document while focused, so the page is pushed
                down and the sticky pill simply rides lower for that moment —
                the layout shift IS the visible feedback, and only a keyboard
                user ever sees it. The alternative, a fixed overlay pill, would
                need a NEW top-of-scale z value (a z-50 tie loses to the
                later-DOM bar) and would add a stacking decision forever; the
                z-map stays closed at 40/45/50 + the top layer (layers board §2).
                The focus ring comes from globals' `:focus-visible` safety net.
                THE PADDING IS PLAIN `focus:px-4`, NOT the
                `clamp(1rem,10vw,12.5rem)` gutter Header and Footer each carry:
                a third copy of that clamp would trip the §15.15 `ui/Container`
                promotion ahead of its own pre-page board.
                KEEP-IN-SYNC with shell.test.tsx's SKIP_LINK constant (§6.6).
                While the menu is open the freeze inerts this link like every
                other non-header sibling — correct: Esc is the way out of the
                menu, not a jump to <main>. */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:block focus:border-b focus:border-line-subtle focus:bg-surface focus:px-4 focus:py-3"
            >
              {t('skipToContent')}
            </a>

            <Header />

            {/* The skip target, and the document's one <main> landmark. No
                tabindex: a fragment jump moves the sequential-focus starting
                point natively, and globals' `scroll-padding-top` keeps the
                landing clear of the glass pill (SC 2.4.11). Full-bleed — the
                gutter belongs to Header and Footer today, and the third
                consumer that would promote it is the first PAGE (§15.15's
                Container/gutter board, layers Q5).
                `flex-1` is the growing half of the sticky footer above: it takes
                the leftover height on short pages and shrinks to nothing extra
                on long ones (a flex item's `min-height: auto` keeps tall content
                from being squashed). */}
            <main id="main" className="flex-1">
              {children}
            </main>

            <Footer />

            {/* LAST, after {children} AND the Footer. It renders no box in
                normal flow at all any more — both children are `fixed` corner
                controls — so its position here buys DOM order rather than
                geometry: last in the tab order, after the page's own content
                and the footer's links. The clearance spacer that used to make
                this placement load-bearing was removed on 2026-09-04 (owner);
                FloatingActions' own header carries that decision and what now
                carries the clearance duty. */}
            <FloatingActions />
          </ContactModalProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
