import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { DoctorShowcase } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import { TeamRoster } from '@/components/sections/TeamRoster/TeamRoster';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale } from '@/i18n/locales';
import { populateDoctorShowcase, populateTeamRoster } from './populate';

// THE TEAM PAGE — „Echipa noastră": the doctors band first (its eyebrow and
// title, every doctor as a card under the ribbon), the auxiliary staff as a
// grid of tiles, the map last. It replaced the interim stub that existed only
// so the shell's nav had a resolvable target (PR #69, the link check).
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
// pages' precedent). Both bands are DUMB: they hold no message key, import no
// data, format nothing and do not know what a `Locale` is — they receive
// finished people and lay them out. So everything that has to KNOW happens
// here — the language, the band's eyebrow and title, the button's words, the
// URLs — and ./populate.ts does the walks (its header argues why it is neither
// in lib/team nor inline here). ClinicLocation is the exception that proves
// the rule: it is a page BAND wired to site data (lib/clinic, §10.1) and takes
// nothing from this file.
//
// ── THE <h1> IS THE PAGE'S, AND `sr-only` — the Services page's shape, since
// 2026-09-30. Until then „Echipa noastră" was the visible opener, painted by
// TeamRoster; now the visible opener is the doctors band's own eyebrow and
// <h2> („Familia Premium Smile" / „Specialiștii cu care ne mândrim"), two
// stacked titles would say the same thing twice, and the band must read the
// same on Home, where it cannot be an <h1>. §9's one outline root and the SEO
// lane's outline still need the element, so it stays, in the page's markup,
// with the words the tab title shows: h1 (the page) → h2 (the band) → h3 (each
// doctor) → h2 (each staff tile) → h2 (the map).
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
// `title — siteName` on the ` — ` join, and it is built from the SAME
// `team.title` key the <h1> prints, so the tab and the outline root can never
// disagree. Zero hardcoded user-facing strings live in this file (§17.4) —
// `team.title` and `team.showcase.*` are the owner's, in src/messages/*.json,
// and every name, position and sentence is a fact from lib/team.
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

  return (
    <>
      <h1 className="sr-only">{t('title')}</h1>
      {/* `firstScreen`: on THIS page the band opens the first screen, and the
          first doctor's picture is its largest paint (measured — the band's
          D9), so that one picture preloads. Home mounts the same band under
          the Hero and leaves the prop off. */}
      <DoctorShowcase
        firstScreen
        eyebrow={t('showcase.eyebrow')}
        title={t('showcase.title')}
        doctors={doctors}
      />
      <TeamRoster members={populateTeamRoster(locale)} />
      {/* The map closes every page of this run — the owner's „add at the end
          the map so i can test how it goes back and forth on the page". It
          reads lib/clinic itself and takes nothing from here. */}
      <ClinicLocation />
    </>
  );
}
