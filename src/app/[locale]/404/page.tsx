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
// that file — built by tools/generate-404.ts from src/lib/not-found-html.ts — is a
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
// functions pin them from the outside — one real <h1> carrying
// `notFound.title`, one paragraph whose COMPUTED text-align is `justify`.
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
    title: `${t('notFound.title')} — ${t('siteName')}`,
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
    <section>
      {/* `flex flex-col gap-4` because the PARENT owns spacing (§6.4): neither
          ui/Heading nor a preflight-reset <p> ships a margin, so without a
          stack the heading and the paragraph would sit flush against each
          other. */}
      <Container className="flex flex-col gap-4 py-16">
        {/* ONE h1 per page (§9), and it is a REAL h1: Heading owns the display
            step, never the element, so `asChild` hands the outline slot to the
            markup and the atom can never fake structure (Heading.tsx). `size`
            is the section step — the largest this scale ships. */}
        <Heading size="section" asChild>
          <h1>{t('notFound.title')}</h1>
        </Heading>

        {/* JUSTIFIED, PER ELEMENT — the owner's 2026-09-06 words ("text in
            justify"), a dated exception to the §15.1 locked decision that long
            prose aligns to `start`. The utility rides the <p> ITSELF and never
            a wrapper: that is the §15.15 b canon (PR #70) — globals.css aligns
            p/li/blockquote to `start` at the base tier precisely so inherited
            alignment cannot reach prose, so a deliberate exception belongs on
            the element, where it wins by layer order.
            It is only acceptable because §15.14's site-wide `hyphens: auto` is
            already in the sheet and engages under the shell's `<html lang>`:
            justification without hyphenation opens rivers of white space, and
            German — the +30–35% language — is where that shows first, which is
            what the GermanStress story is for.
            `max-w-xl` is the prose MEASURE, which Container deliberately does
            not own (its header's "WHAT THIS ATOM DOES NOT OWN" list): at 1920
            the gutter column is 1536px wide, and 1.125rem body text needs a
            shorter line than that. */}
        <p className="max-w-xl text-justify">{t('notFound.message')}</p>
      </Container>
    </section>
  );
}
