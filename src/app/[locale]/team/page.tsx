import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorShowcase } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { TeamRoster } from '@/components/sections/TeamRoster/TeamRoster';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale } from '@/i18n/locales';
import { clinicStats } from '@/lib/team/team';
import {
  populateDoctorShowcase,
  populateStats,
  populateTeamRoster,
} from './populate';
import { toStatTiles } from './stat-tiles';

// THE TEAM PAGE — „Echipa noastră": the doctors band first (since 2026-10-15
// opened by the page's own centred hero, then every doctor as a card under
// the ribbon), the auxiliary staff as a grid of tiles, the clinic's numbers
// (since 2026-10-01 — the Home page's „în cifre" band, prop for prop: the
// owner, "same component as on main page with the stats on the team page
// between map and helping staff"), the map last. It replaced the interim stub
// that existed only so the shell's nav had a resolvable target (PR #69, the
// link check).
//
// ── THE DOCTORS ARE A BAND OF THEIR OWN since 2026-09-30 (owner, verbatim:
// "make this the official dr card under personell card … integrate it in the
// page and crete it as a section in the home page and in the personell page
// with heading and eyebrow smth in the direction of specialistii cu care ne
// mandrim familia premium smile"). sections/DoctorShowcase is that section —
// the SAME band the Home page mounts — and sections/TeamRoster, which used to
// hold the title, the doctors and the staff, keeps the staff tiles alone. No
// intro paragraph and no gallery: §14's TeamIntro and ClinicGallery rows are
// still nobody's, and adding either without the owner's word would be
// improvising content (§15.17).
//
// ── THIS FILE IS THE ONE POPULATOR (run ledger D1, the services and home
// pages' precedent). The three bands are DUMB: they hold no message key, import
// no data, format nothing and do not know what a `Locale` is — they receive
// finished people and lay them out. So everything that has to KNOW happens
// here — the language, the hero's heading and lead, the button's words, the
// URLs — and ./populate.ts does the walks (its header argues why it is neither
// in lib/team nor inline here). ClinicLocation is the exception that proves
// the rule: it is a page BAND wired to site data (lib/clinic, §10.1) and takes
// nothing from this file.
//
// ── THE <h1> IS THE HERO'S, VISIBLE, since 2026-10-15 — the owner, verbatim:
// "take the hero section of the blog page with all blog articles and
// implement something similar instead of "FAMILIA PREMIUM SMILE /
// Specialiștii cu care ne mândrim" on the echipa page" and "this must take
// place only on the echipa page". So the doctors band opens HERE with its
// PAGE opener (sections/DoctorShowcase's D12): sections/PageHero — the blog
// list's centred hero, moved into a shared composition the same day — whose
// <h1> and lead are `team.hero.*`, Claude's drafts in all five languages,
// flagged for the owner (§15.17), each heading opening on the page's own
// name („Echipa noastră:", "Our team:", „Unser Team:", « Notre équipe : »,
// «Il nostro team:») and keeping the owner's „specialiștii cu care ne
// mândrim" in the heading. „familia" is NOWHERE in the hero, on purpose: the
// owner asked for „Familia Premium Smile" to be replaced (BACKLOG.md entry 4,
// "sounds particularly toxic") — never put it back here.
// Home keeps the band opener, its eyebrow and <h2>. From 2026-09-30 until
// that day the page's <h1> was `sr-only` here, in the page's markup (the
// Services page's shape), under the band's eyebrow and <h2>; before that,
// TeamRoster painted „Echipa noastră" itself. The outline: h1 (the hero) →
// h2 (each doctor — the cards' level under a page opener) → h2 (the staff
// band, since 2026-10-02) → h3 (each staff tile) → h2 (the numbers) → h3
// (each tile) → h2 (the map). The TAB TITLE stays `team.title` (below), the
// page's short name, which every language's heading now opens on.
//
// ── EVERY BAND DRAWS IN ONE SCALE, AND THE STAFF HAVE A TITLE (2026-10-02,
// CLAUDE.md §15.32 — owner, verbatim: "the other page you have to implement
// the same thing once done is the team page. there you have little work. you
// hav eto create an eyebrow and headline for the 3 cars with helping staff").
// On a laptop or desktop all four bands draw in ui/Container's THE BAND SCALE,
// so every eyebrow and <h2> on the page is one size and one offset — and the
// hero's <h1>, since 2026-10-15, the blog list's own 65.04 design pixels
// (sections/PageHero): the doctors band always, the staff band always (its one
// page), the numbers and the map because this page passes `scaled` (the
// doctor page passes it to both since 2026-10-13, §15.32 rounds 3 and 4).
// The staff band's eyebrow and title are `team.roster.*` — Claude's
// drafts in all five languages, flagged for the owner (§15.17) — and its
// tiles keep one width: the column's own on a phone (§15.35), 18rem on
// tablets, a third of the scaled column on a laptop or desktop
// (sections/TeamRoster's D9).
//
// ── `isLocale` IS THE NARROWING, not a guard against reality: next-intl hands
// back a plain `string`, and `words[locale]` on a `Record<Locale, …>` refuses
// one. The throw is unreachable on the built site — src/i18n/request.ts falls
// back to `defaultLocale` for anything that is not one of the five — which is
// why it may be a throw and not a rendered error state.
//
// ── NO `params` PLUMBING IN THE PAGE BODY (§15.16 Phase C): the locale reaches
// next-intl through the [locale] root param resolved in src/i18n/request.ts,
// and `getLocale()` reads back the value that resolution produced — the same
// source the messages came from, so the words and the language can never
// disagree. The sibling `[slug]` segment plumbs `params` for its own slug and
// for nothing else. The ONE exception here is `generateMetadata` below, which
// takes the locale as a parameter exactly as the layout's own and the 404
// page's do (request.ts' header names that exception explicitly).
//
// ── A MINIMAL `generateMetadata` (G2 a11y, 2026-09-21), and only that. The
// full §10.3 treatment — description, OG, hreflang, the `Dentist` JSON-LD — is
// still the SEO lane's (PHASE4_SEO_PLAN.md), and this is deliberately not it.
// What could not wait is SC 2.4.2 Page Titled, a LEVEL A criterion sitting
// inside this site's AA bar (§9). The title is the 404 page's own idiom,
// `title — siteName` on the ` — ` join, built from `team.title`, the page's
// short name — the words the hero's <h1> opens on in every language (THE <h1>
// IS THE HERO'S, above), so the tab and the outline root say the same page;
// until 2026-10-15 the <h1> printed `team.title` itself. Zero hardcoded
// user-facing strings live in this file (§17.4) — `team.title`, `team.hero.*`,
// `team.showcase.profile` (the cards' link; the band opener's
// `team.showcase.eyebrow` and `.title` are Home's now), `team.roster.*` and the
// numbers band's three `team.doctor.stats.*` keys live in src/messages/*.json,
// and every name, position, number and sentence is a fact from lib/team.
//
// ── KEEP-IN-SYNC with ./Team.stories.tsx: this page is an async Server
// Component (getTranslations/getLocale from next-intl/server), which no browser
// runner can execute — the shell.test.tsx / Pages/Services precedent — so the
// twin beside it renders the same markup through the isomorphic
// `useTranslations` + `useLocale` and the SAME ./populate.ts, and its play
// functions pin what the TWIN renders. What holds the two together is
// ../page-twins.test.ts, which reads this file and the twin as source and
// compares the bands, in order, and the doctors band's props (G2 react,
// 2026-09-30: until then nothing a gate runs noticed this page losing
// `firstScreen`).

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'team' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  // Per locale, and in the §10.3 pattern's spirit: what this page is, then the
  // clinic. A German visitor's tab must not read Romanian, which is why the
  // locale arrives as a parameter rather than being assumed.
  return { title: `${t('title')} — ${tc('siteName')}` };
}

export default async function TeamPage() {
  const t = await getTranslations('team');
  const locale = await getLocale();
  if (!isLocale(locale))
    throw new Error(`team page: unknown locale "${locale}"`);

  const doctors = populateDoctorShowcase(
    locale,
    t('showcase.profile'),
    // ui/Keyword's `Keywords` turns lib/team's cut-up sentence into text and
    // <b> fragments. The populator does the cutting and never builds an
    // element; the page does the rendering and never sees a `<k>` (run D1/D2).
    (segments) => <Keywords segments={segments} />,
  );

  // THE PAGE OPENER's words (the band's D12): the hero's <h1> and its lead,
  // `team.hero.*` — one line break in the heading, two in the lead.
  const hero = { title: t('hero.title'), lead: t('hero.lead') };

  return (
    <>
      {/* THE PAGE OPENER (the band's D12, the header's THE <h1> IS THE
          HERO'S): the page's one <h1> and its lead, centred over the cards;
          Home mounts the same band with its eyebrow and <h2> instead.
          `firstScreen`: the band opens the first screen here, and its first
          doctor's picture preloads (the band's D9) — the blog list's first
          card's precedent, now that the hero's heading stands above it. */}
      <DoctorShowcase firstScreen hero={hero} doctors={doctors} />
      {/* THE STAFF, titled since 2026-10-02 (the header's ONE SCALE
          paragraph): the band's own eyebrow and <h2>, the tiles <h3>s. */}
      <TeamRoster
        eyebrow={t('roster.eyebrow')}
        title={t('roster.title')}
        members={populateTeamRoster(locale)}
      />
      {/* THE CLINIC'S NUMBERS — the Home page's band, prop for prop (owner,
          2026-10-01: "same component as on main page with the stats on the
          team page between map and helping staff"): the page ground, the
          eyebrow and title at the start, no lead, lib/team's three
          `clinicStats` tiles. The words are the doctor page's own keys.
          `scaled`, like every band on this page. */}
      <DoctorStats
        scaled
        ground="page"
        align="start"
        eyebrow={t('doctor.stats.eyebrow')}
        title={t('doctor.stats.title')}
        atLeast={t('doctor.stats.atLeast')}
        tiles={toStatTiles(populateStats(locale, clinicStats))}
        format={new Intl.NumberFormat(locale).format}
      />
      {/* The map closes every page of this run — the owner's „add at the end
          the map so i can test how it goes back and forth on the page". It
          reads lib/clinic itself and takes only `scaled` from here. */}
      <ClinicLocation scaled />
    </>
  );
}
