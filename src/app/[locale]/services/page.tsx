import { getLocale, getTranslations } from 'next-intl/server';
import { PriceList } from '@/components/sections/PriceList/PriceList';
import { isLocale } from '@/i18n/locales';
import { populatePriceList, SERVICES_TITLE_ID } from './populate';

// THE SERVICES PAGE — the clinic's „LISTĂ DE PREȚURI" as a jump menu beside
// category cards, built to the owner-approved board
// .claude/plans/price-list.plan.md. It replaces the interim stub that existed
// only so the shell's nav had a resolvable target (PR #69, the link check).
//
// ── THIS FILE IS THE ONE POPULATOR (board §1.4, owner fb-459). sections/
// PriceList is DUMB: it holds no message key, imports no data, formats nothing
// and does not know what a `Locale` is. So everything that has to KNOW happens
// here, in three lines — the language, the words, the sentence the amounts are
// spoken in — and the band receives finished strings. The mapping itself lives
// in ./populate.ts (its header argues why it is neither in lib/prices nor
// inline here); this file is the wiring.
//
// ── THE PAGE OPENS WITH THE PRICE BAND, AND THE <h1> IS `sr-only` (owner
// 2026-09-14: „remove 'Our services' at the page start"). What the owner
// objected to is the PIXELS — a whole title band repeating, at the 36px
// display step, what the eleven cards under it already say. So the opener went
// entirely: the `bg-page` section, its <Container>, the `pt-12 @lg:pt-16
// @3xl:pt-20` rhythm box and the ui/Heading 'page' step that dressed the text
// (a display step on something never displayed is dead weight — this file no
// longer imports the atom at all, and the 404 page is once again the only
// page in the site consuming that step). What STAYED is the ELEMENT, because
// two standing rules need it and neither is what the owner was looking at:
//   · §9 — one <h1> per page, logical heading order. Delete it and this page
//     opens with eleven <h2>s and no root: the outline a screen reader's
//     heading list, a rotor and the a11y addon all read as broken.
//   · §10.3 and PHASE4_SEO_PLAN.md — the per-page title and outline the SEO
//     lane builds on; the <h1> is the page's own name inside the document,
//     beside the <title> that lane will author.
// `sr-only` is Tailwind's own utility and not a class invented here — the
// shell's skip link is its other consumer (src/app/[locale]/layout.tsx, THE
// REVEAL IS IN-FLOW). It clips the element to an absolutely-positioned 1px
// box: NOT `display:none`, NOT `aria-hidden`, so the heading keeps its place
// in the accessibility tree and in the outline while taking no pixels. The
// page therefore owes no padding of its own either — an out-of-flow element
// cannot open a gap, so the top rhythm is now the band's own `py-12 @lg:py-16
// @3xl:py-20`, ONE band's rhythm instead of two stacked ones, which is the
// very thing the old opener's `pt`-only box existed to avoid.
//
// ── THE BAND IS STILL NOT A NAMED REGION (G2 a11y L1, 2026-09-13). The
// board's §3.1 had the page close the band's `aria-labelledby` with this h1;
// measured on the emitted page that made a region „Serviciile noastre"
// wrapping everything inside <main> but the h1 — a landmark stop that
// duplicates main for a screen-reader user, with eleven category regions and
// the „Categorii" nav already below it. So the band root stays an unnamed
// <section> (generic, no landmark), and `SERVICES_TITLE_ID` is simply the h1's
// stable id — the handle the story twin grabs it by, pinned there. Naming the
// band with it would read worse now than it did then: the region's name would
// be a string nobody can see on the page it names.
//
// ── `isLocale` IS THE NARROWING, not a guard against reality. next-intl hands
// back a plain `string`, and `name[locale]` on a `Record<Locale, string>`
// refuses one; without the predicate the only way through is a cast, which
// type-checks a typo exactly as happily as a locale. The throw is unreachable
// on the built site — src/i18n/request.ts falls back to `defaultLocale` for
// anything that is not one of the five — which is precisely why it may be a
// throw and not a rendered error state (§15.19's recorded `isLocale()` trigger,
// board §2.6).
//
// ── NO `params` PLUMBING (§15.16 Phase C): the locale reaches next-intl
// through the [locale] root param resolved in src/i18n/request.ts, and
// `getLocale()` reads back the value that resolution produced — the same
// source the messages came from, so the words and the language can never
// disagree.
//
// ── NO `generateMetadata` YET. Per-route titles, descriptions, hreflang and
// the `Dentist` JSON-LD are the SEO lane's (PHASE4_SEO_PLAN.md); the layout's
// own metadata carries the page until then. Zero hardcoded user-facing strings
// live in this file (§17.4) — `services.title` and `services.prices.*` are the
// owner's, in src/messages/*.json.
//
// ── KEEP-IN-SYNC with ./Services.stories.tsx: this page is an async Server
// Component (getTranslations/getLocale from next-intl/server), which no browser
// runner can execute — the shell.test.tsx / Pages/NotFound precedent — so the
// twin beside it renders the same markup through the isomorphic
// `useTranslations` + `useLocale` and its play functions pin it from the
// outside. Change the JSX here and that suite must follow, or it goes red
// naming what drifted.

export default async function ServicesPage() {
  const t = await getTranslations('services');
  const locale = await getLocale();
  if (!isLocale(locale))
    throw new Error(`services page: unknown locale "${locale}"`);

  const categories = populatePriceList(locale, (lei) =>
    t('prices.amount', { amount: lei }),
  );

  return (
    <>
      {/* THE OUTLINE ROOT — read, never seen (the header argues why it
          survives the owner's cut). It stands OUTSIDE the band, where the page
          owns it: PriceList is a props-in composition that holds no page
          heading, and an out-of-flow element costs no layout wherever it sits.
          A bare <h1>: no ui/Heading, because there is no display step to
          choose for text that is never displayed. */}
      <h1 id={SERVICES_TITLE_ID} className="sr-only">
        {t('title')}
      </h1>
      <PriceList menuTitle={t('prices.menu')} categories={categories} />
    </>
  );
}
