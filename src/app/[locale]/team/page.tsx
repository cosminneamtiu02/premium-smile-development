import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { TeamRoster } from '@/components/sections/TeamRoster/TeamRoster';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale } from '@/i18n/locales';
import { populateTeamRoster } from './populate';

// THE TEAM PAGE — „Echipa noastră": every doctor as a card with his quote and
// his two buttons, the auxiliary staff as a grid of tiles, the map last. It
// replaces the interim stub that existed only so the shell's nav had a
// resolvable target (PR #69, the link check) — that file's one heading reused
// the nav label and shipped no keys of its own.
//
// ── AS SIMPLE AS THE OWNER ASKED (run ledger D10, his words: „build personnel
// page as simple as possible as it is now in team composition and add at the
// end the map"). One <h1>, the doctor cards, the tiles, the map. No intro
// paragraph, no sub-headings over the two groups, no gallery — §14's TeamIntro
// and ClinicGallery rows are not what this lane built, and adding either
// without his word would be improvising content (§15.17: the owner authors it).
//
// ── THIS FILE IS THE ONE POPULATOR (run ledger D1, the services and home
// pages' precedent). sections/TeamRoster is a DUMB band: it holds no message
// key, imports no data, formats nothing and does not know what a `Locale` is —
// it receives finished people and lays them out, alternating the doctors'
// sides from their index. So everything that has to KNOW happens here — the
// language, the two button words, the URLs — and ../team/populate.ts does the
// walk (its header argues why it is neither in lib/team nor inline here).
// ClinicLocation is the exception that proves the rule: it is a page BAND
// wired to site data (lib/clinic, §10.1) and takes nothing from this file.
//
// ── THE <h1> IS THE BAND'S, not the page's. On Home and Services the page
// owns a bare `sr-only` heading because neither band carries a page title;
// here „Echipa noastră" is the visible opener the owner asked for, so the
// element lives where it is painted (TeamRoster renders `title` through
// ui/Heading's `hero` step, §15.24's one size per level) and this file simply
// supplies the words. §9's one outline root is satisfied by that heading, and
// the band around it stays UNNAMED — a region named by the page's own title
// would duplicate <main> for a screen-reader user (the services page's G2 a11y
// verdict, same shape).
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
// inside this site's AA bar (§9): until this lane, every route inherited the
// layout's bare „Premium Smile", and this run added two more — so a visitor
// with five tabs open, or anyone reading a history list, had nothing to tell
// the Team page from the Home page from a doctor's page. The title is the
// 404 page's own idiom, `title — siteName` on the ` — ` join, and it is built
// from the SAME `team.title` key the band prints, so the tab and the <h1> can
// never disagree. Zero hardcoded user-facing strings live in this file
// (§17.4) — `team.title` and `team.roster.*` are the owner's, in
// src/messages/*.json, and every name, position and sentence is a fact from
// lib/team.
//
// ── KEEP-IN-SYNC with ./Team.stories.tsx: this page is an async Server
// Component (getTranslations/getLocale from next-intl/server), which no browser
// runner can execute — the shell.test.tsx / Pages/Services precedent — so the
// twin beside it renders the same markup through the isomorphic
// `useTranslations` + `useLocale` and the SAME ./populate.ts, and its play
// functions pin it from the outside. Change the JSX here and that suite must
// follow, or it goes red naming what drifted.

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

  const roster = populateTeamRoster(
    locale,
    { services: t('roster.services'), profile: t('roster.profile') },
    // ui/Keyword's `Keywords` turns lib/team's cut-up sentence into text and
    // <b> fragments. The populator does the cutting and never builds an
    // element; the page does the rendering and never sees a `<k>` (run D1/D2).
    (segments) => <Keywords segments={segments} />,
  );

  return (
    <>
      <TeamRoster
        title={t('title')}
        doctors={roster.doctors}
        members={roster.members}
      />
      {/* The map closes every page of this run — the owner's „add at the end
          the map so i can test how it goes back and forth on the page". It
          reads lib/clinic itself and takes nothing from here. */}
      <ClinicLocation />
    </>
  );
}
