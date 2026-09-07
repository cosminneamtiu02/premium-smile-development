import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';

// THE NOT-FOUND PAGE — a REAL page, five of them (owner, 2026-09-06: "i wanted
// a not found, but it must still contain the page root with header and footer
// and floating buttons, but just have a heading with page not found and text in
// justify").
//
// It sits under [locale] like every other route, so the locale layout gives it
// the whole shell for free — <html lang>, the Header pill, the Footer's NAP,
// the fixed corner controls, the skip link, the suggestion banner. This file
// renders NONE of them, and must not: §6 forbids a page from styling or
// re-rendering the shell, and the layout is where that assembly lives
// (src/app/[locale]/layout.tsx, "THE SHELL").
// It is also pre-rendered ×5 for free: `output: 'export'` walks the layout's
// own generateStaticParams (§5), which is why the services/team/blog stubs
// declare none of their own either.
//
// ── HOW A VISITOR GETS HERE. Not by clicking: nothing on the site links to it.
// A static host answers an unknown URL with the single file out/404.html, and
// that file — built by tools/generate-404.ts from src/lib/not-found-html/not-found-html.ts — is a
// DISPATCHER: it reads the dead URL's first path segment, then the §8.7
// language cookie, then falls back to the default locale, and forwards here
// instantly. The miss itself already returned HTTP 404, so no soft-404 is
// created; that document's header carries the full argument and the bans
// (routing to HOME: banned; any timed redirect: banned).
//
// ── NO NEW MESSAGE KEYS. `common.notFound.{title,message}` are the same two
// the dispatcher's fallback body renders, so the sentence a visitor sees before
// the forward and the one they see after it are the same sentence (§8.10 — the
// values are the owner's, authored in src/messages/*.json).
//
// No `params` plumbing: the locale reaches next-intl through the [locale] root
// param (src/i18n/request.ts, §15.16) — pages never thread it by hand. The one
// exception is generateMetadata below, which the layout's own already
// demonstrates and request.ts' header names explicitly.
//
// ── KEEP-IN-SYNC (§4's sharing table) with the story twin BESIDE this file,
// ./NotFound.stories.tsx. This page is an async Server
// Component, so no browser runner can render it; the story therefore rebuilds
// the same two elements through the isomorphic `useTranslations` and its play
// functions pin them from the outside — one real <h1> whose text leads with
// `404: ` before `notFound.title` (Heading's 'page' step, 36px), one paragraph
// whose COMPUTED text-align is `center` at `text-xl`.
// Change the band here and that suite goes red naming the pair. (The pair is
// twelve lines of markup, deliberately not extracted: a shared component would
// buy a third file and an import fence for two elements.)

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    // Per locale, and in the §10.3 pattern's spirit: what this page is, then
    // the clinic. A German visitor's tab should not read Romanian.
    // `404: ` LEADS (owner, 2026-09-07 — "title should contain 404"): the
    // status number is locale-neutral machinery, so it rides the template the
    // way the ` — ` join already does rather than entering five message files
    // (§17.4 governs translatable strings; a number that reads the same in
    // every tab is not one). The dispatcher's own <title> carries the same
    // prefix from the same argument — tools/generate-404.ts — and the
    // source-text pins in tests/unit/not-found-404.test.ts hold the pair.
    title: `404: ${t('notFound.title')} — ${t('siteName')}`,
    // NOINDEX ALWAYS — not env-gated like the shell's. This page is reachable
    // at a real URL and a host answers it with 200, so without this meta Google
    // would be free to index five "page not found" pages as ordinary content:
    // the textbook soft-404, and the exact failure the dispatcher's 404 status
    // exists to avoid. `follow` stays on so the shell's own links (nav, footer)
    // still pass crawlers through to the real pages.
    robots: { index: false, follow: true },
  };
}

export default async function NotFoundPage() {
  const t = await getTranslations('common');

  return (
    // THE PAGE-BAND RECIPE (§15.15 a, DECIDED on board fb-343; the law is
    // Container.tsx's own header): a semantic, full-bleed outer owning paint
    // and vertical rhythm, with ui/Container inside owning width and the
    // container-query context. The outer paints nothing of its own here — the
    // shell's <body> already carries bg-page, and a band that repainted the
    // same ground would only add a seam — so what it contributes is the
    // element and the rhythm, and the `py` rides the Container exactly as the
    // Footer's does (recipe rule 3, the shipped precedent).
    // `flex grow flex-col justify-center` (owner, 2026-09-07 — "more central
    // on y axis"): the shell's <main> is a column flex context since the same
    // correction (its comment names this band as first consumer), so growing
    // here hands the section main's leftover height and `justify-center`
    // centres the Container inside it. The Container's own py-16 stays as the
    // breathing floor for content taller than the viewport.
    // `min-h-[calc(100dvh-6rem)]` is what makes the centring VISIBLE: the
    // Footer is taller than any viewport's leftover, so `grow` alone never
    // receives space — this floor sizes the band to the first screenful
    // instead, putting the message mid-screen on landing and the Footer below
    // the fold. The 6rem is the sticky pill's in-flow reach — its `mt-4` plus
    // the `h-20` row — and globals.css' `scroll-padding-top: 6rem` is the
    // same coupled value from the shell's side (§17.7 stable anchors: change
    // the bar family and both spellings move together).
    // `pb-24` (6rem) is the OPTICAL LIFT (owner, 2026-09-07 round 4 — "just a
    // bit higher now"): border-box keeps the pad inside the min-h, so the
    // centring region loses 6rem at the bottom and the message rides up by
    // half of it — 3rem — at every viewport. True geometric centre reads
    // slightly low to the eye; this is the classic correction, spelled as one
    // spacing-scale step.
    <section className="flex min-h-[calc(100dvh-6rem)] grow flex-col justify-center pb-24">
      {/* `flex flex-col gap-4` because the PARENT owns spacing (§6.4): neither
          ui/Heading nor a preflight-reset <p> ships a margin, so without a
          stack the heading and the paragraph would sit flush against each
          other.
          `items-center text-center` (owner, 2026-09-07 — "centered in the
          container", this band's second correction): the wrapper centres BOXES
          and display text, which is exactly the freedom §15.15 b leaves
          wrappers. The prose below still carries its OWN `text-center` on the
          element — the canon bars wrapper centring from being what reaches
          prose, and that stays true even now that the two values coincide
          (round 3 below): delete the wrapper's utility and the paragraph must
          not change. Each half is pinned as computed style by the story twin. */}
      <Container className="flex flex-col items-center gap-4 py-16 text-center">
        {/* ONE h1 per page (§9), and it is a REAL h1: Heading owns the display
            step, never the element, so `asChild` hands the outline slot to the
            markup and the atom can never fake structure (Heading.tsx). `size`
            is 'page' — the step THIS band measured into the atom (owner,
            2026-09-07 round 4, "make both text and heading larger"): 36px, one
            additive step over 'section', entered through Heading's own
            one-step-per-measured-consumer law rather than a className override
            (§6.8 bans restyling an atom's internals). */}
        {/* `404: ` LEADS THE VISIBLE HEADING TOO (owner, 2026-09-07 round 3 —
            "add before Această pagină nu există a 404, so 404: Această pagină
            nu există"): the same locale-neutral prefix generateMetadata
            composes above, riding the JSX for the same §17.4 reason — the
            number never enters five message files. The DISPATCHER's fallback
            h1 stays unprefixed on purpose: it stacks all five titles in one
            heading, where a single shared number would read as part of none of
            the five languages — and its document <title> already carries it. */}
        <Heading size="page" asChild>
          <h1>404: {t('notFound.title')}</h1>
        </Heading>

        {/* CENTRED, PER ELEMENT (owner, 2026-09-07 round 3 — "f*ck justify
            keep centered" — SUPERSEDING their 2026-09-06 "text in justify":
            the §15.1 dated justify exception closes after one day of life,
            and the dispatcher's fallback body mirrors the reversal so the
            sentence before the forward stays the sentence after it). The
            utility still rides the <p> ITSELF and never a wrapper — the
            §15.15 b canon (PR #70): globals.css aligns p/li/blockquote to
            `start` at the base tier precisely so inherited alignment cannot
            reach prose, so a deliberate exception belongs on the element,
            where it wins by layer order — even while the wrapper above
            happens to centre display text with the same value.
            `max-w-xl` is the prose MEASURE, which Container deliberately does
            not own (its header's "WHAT THIS ATOM DOES NOT OWN" list): at 1920
            the gutter column is 1536px wide, and 1.125rem body text needs a
            shorter line than that. */}
        {/* `text-xl` (1.25rem — owner round 4, "make both text and heading
            larger"): one step over the site's 1.125rem body base, still rem so
            zoom and user font settings scale it (§7). Rides the element like
            the alignment above it. */}
        <p className="max-w-xl text-center text-xl">{t('notFound.message')}</p>
      </Container>
    </section>
  );
}
