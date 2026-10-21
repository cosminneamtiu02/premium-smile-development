import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import {
  DoctorIntro,
  type DoctorIntroCredo,
} from '@/components/sections/DoctorIntro/DoctorIntro';
import { DoctorProfile } from '@/components/sections/DoctorProfile/DoctorProfile';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { Keywords } from '@/components/ui/Keyword/Keyword';
import { isLocale } from '@/i18n/locales';
import { doctors, findDoctor } from '@/lib/team/team';
import { populateDoctorPage } from '../populate';
import { toStatTiles } from '../stat-tiles';

// THE DOCTOR PAGE — one per person, at `/{locale}/team/{id}/` (run ledger D3),
// built to the owner's 2026-09-21 dispatch: „Each doctor will have his own
// page … this page as structure will be reused for more doctors", reworked on
// his pack feedback of 2026-09-25 (round 2, whose ledger —
// round2/ledger-round2.md in the run workspace — carries D12 onward) and
// RESHAPED on 2026-10-13 (CLAUDE.md §15.23 round 7 — the owner, verbatim:
// "hero section, then Experience confirmed over time and below on the left
// biography and on the right the thing with the "Courses and
// specialisations" but hugely rectified. no year anymore"). FOUR BANDS:
//   1. the opener — the cutout beside the specialty and the <h1>, and under
//      the name, in the empty space beside the photograph, the framed CREDO
//      card: „Filozofia mea" over the doctor's own quoted words, key words set
//      apart by ui/Keyword (DoctorIntro, D12);
//   2. the „în cifre" tiles on the lilac band — a glyph, a number that counts
//      up once, a label and a sentence each (DoctorStats, D30) — SECOND since
//      2026-10-13, on the owner's word: "so "IN NUMBERS" would be the second
//      element in the page";
//   3. one band on the page ground, the biography on the left — „Despre
//      {name}", a few paragraphs about the doctor, their key words set apart
//      by ui/Keyword like the credo's (since 2026-10-13) — and his courses on
//      the right, ONE IDEA PER DOT with no year, the ideas lit one by one by
//      themselves (DoctorProfile, which composes DoctorCourses);
//   4. the „Ne găsești" map, which every page of this run closes with — since
//      2026-10-13 in THE BAND SCALE, the very band Home and Team draw (the
//      JSX's own note; CLAUDE.md §15.32 round 3).
// Round 1's „Echipa mea" band (two assistants beside the week) went in round 2
// (D13); the week itself — the schedule card beside the biography — went on
// 2026-10-13: "no more schedul box at all, drop it and remove anything related
// to it". The courses' YEARS left the same day ("there wont be any more years
// … this must stand"), and with them the timeline's scroll-driven light.
//
// ── THE WHOLE PAGE IN THE BAND SCALE (2026-10-13, CLAUDE.md §15.32 round 4).
// The owner, verbatim: "take current heading and eyebrow from main page. look
// how reactive and nice it is. make the exact same thing with the heading and
// eyebrow from the individual dr page" — and, asked whether the content under
// the titles should grow with them, "Whole page, like Home". So on a laptop
// or a desktop every band here draws in ui/Container's ONE design pixel, the
// owner's 1401 window scaled to the column, as every band of Home and Team
// does: one heading size across the four bands at every width — the
// biography's and the map's openers on the column's left edge, the tiles'
// centred (D30), the courses' at the second column's start — and everything
// under each heading — the biography, the courses, the tiles, the credo card,
// the name itself — growing and shrinking with it. The two bands that live
// only on this page wear the scale themselves (DoctorIntro and DoctorProfile —
// each header's THE BAND SCALE — the courses inside the latter's rhythm box
// drawn in its pixel); the two this page shares with Home and Team take their
// `scaled` from here, one word each (the JSX's notes). Phones, touch tablets
// and every window under the step keep the theme's own sizes.
//
// ── THIS FILE IS THE ONE POPULATOR (run ledger D1, the services page's
// precedent). The three content bands are DUMB: DoctorIntro, DoctorStats and
// DoctorProfile — with the DoctorCourses block it composes — hold no message
// key, import no data and do not know what a `Locale` is, and ClinicLocation
// reads only the clinic's own NAP. So everything that has to KNOW happens
// here — the language, the words, the person — and the bands receive finished
// strings. The mapping itself lives in ../populate.ts, beside the Team page's
// (its header argues why it is neither in lib/team nor inline here), and its
// one JSX step — a stat id becoming its glyph — in ../stat-tiles.tsx (whose
// header argues why that is not populate.ts); this file is the wiring. Every
// eyebrow and title is a `team.doctor.*` key (D20); the one that needs the
// person — the biography's „Despre {name}" — takes him as an ICU ARGUMENT,
// the name the opener prints as the <h1>, so the h2 is unique per page and no
// key is ever minted per doctor.
//
// ── THE FUTURE SEAM — THE DOCTOR'S BLOG ARTICLES (run ledger D19; the owner,
// 2026-09-25: "very important … note it somewhere" · "it will sit above map
// section"). A band linking THIS doctor's blog posts will stand above the map
// — since 2026-10-13 between the biography-and-courses band and the map. It
// is NOT built, because there is nothing of a doctor's own for it to list
// yet: the blog's LIST exists in every language since 2026-10-14
// (/{locale}/blog/, CLAUDE.md §15.39), and so does ONE article, a placeholder
// every card of the list opens for now (lib/blog-article's THE STAND-IN, the
// owner's "dummy" of 2026-10-15).
// The JSX below carries a comment at the exact spot; when the band lands it
// is a DUMB band populated from here like the three above, and
// ./Doctor.stories.tsx gains it in the same change.
//
// ── THE ROUTE IS A DATA LIST, AND THE GRID IS BUILT BY MULTIPLICATION. Next
// runs a CHILD segment's `generateStaticParams` once per combination its
// PARENT produced, and merges the two: the [locale] layout emits five locales
// (routing.locales), this segment emits one entry per doctor, and the export
// therefore writes five × `doctors.length` pages — /ro/team/toma-lucian/,
// /de/team/toma-lucian/, … . That is why the function below returns `slug`
// ALONE and never mentions the locale: naming it here would be a second
// spelling of the manifest, free to drift from the layout's.
//
// ── A SLUG NOBODY WROTE IS A 404. Under `output: 'export'` there is no server
// to ask at request time (§16): the export writes exactly the pages
// `generateStaticParams` returned — flag or no flag, Next guesses nothing (the
// `dynamicParams` docstring below quotes its build step) — so such a slug
// simply does not exist as a file, and a miss is what every other miss on
// this site is: the host serves out/404.html, whose inline script forwards to
// the visitor's localized 404 (§5's S6 dispatcher). `dynamicParams = false`
// covers the two places a request CAN still reach the route: `next dev`,
// which then answers the unknown slug with the 404 itself, and the build,
// which it arms with a belt against a params list that loses its `slug`. The
// `notFound()` below is the component's own answer to `populateDoctorPage`'s
// `undefined` — the narrowing, and the same 404 for anything that gets past
// both — and it is a BUILD-TIME signal rather than a navigation, which is why
// eslint.config.mjs allows exactly this import out of `next/navigation` while
// banning `useRouter`/`redirect` (§15.13).
//
// ── `params` IS PLUMBED INTO THE PAGE BODY ONLY FOR THE SLUG. §15.16's Phase
// C deleted the locale's `params` plumbing site-wide: the locale reaches
// next-intl through the [locale] root param resolved in src/i18n/request.ts,
// and `getLocale()` reads back the value that resolution produced — the same
// source the messages came from, so the words and the language can never
// disagree. `{ slug }` is a different thing entirely: it is THIS segment's own
// parameter, which nothing else in the framework knows, so it arrives the only
// way it can. `generateMetadata` below takes BOTH halves, because a metadata
// function is the standing exception the layout's own and the 404 page's
// already demonstrate (request.ts' header names it explicitly) — and because
// it needs the slug to know whose page it is titling.
//
// ── `isLocale` IS THE NARROWING, not a guard against reality (the services
// page's paragraph, same words): next-intl hands back a plain `string`, and
// `words[locale]` on a `Record<Locale, …>` refuses one. The throw is
// unreachable on the built site — src/i18n/request.ts falls back to
// `defaultLocale` for anything that is not one of the five — which is why it
// may be a throw and not a rendered error state.
//
// ── A MINIMAL `generateMetadata` (G2 a11y, 2026-09-21), and only that. The
// full §10.3 treatment — description, OG, hreflang, the `Dentist` JSON-LD — is
// still the SEO lane's (PHASE4_SEO_PLAN.md). What could not wait is SC 2.4.2
// Page Titled, a LEVEL A criterion inside this site's AA bar (§9): this run
// added one route PER DOCTOR, and every one of them inherited the layout's
// bare „Premium Smile", so five open tabs of five doctors were five identical
// titles. The title is the doctor's own name out of lib/team — the same string
// the opener prints as the page's <h1>, in the same language — joined to the
// clinic with the 404 page's ` — `. It stays TOTAL: an unknown locale or an
// unknown slug falls back to the site name alone rather than throwing, because
// a metadata function runs for shapes the page body never sees and a build
// must not die in the head of a page that renders. Zero hardcoded user-facing
// strings live here (§17.4): every word is a `team.*` key or a fact from
// lib/team.
//
// ── KEEP-IN-SYNC with ./Doctor.stories.tsx: this page is an async Server
// Component (getTranslations/getLocale from next-intl/server), which no
// browser runner can execute — the shell.test.tsx / Pages/Services precedent —
// so the twin beside it renders the same markup through the isomorphic
// `useTranslations` + `useLocale` and the SAME ../populate.ts, and its play
// functions pin it from the outside. Change the JSX here and that suite must
// follow, or it goes red naming what drifted.

/**
 * Refuse a slug the list does not hold — see A SLUG NOBODY WROTE IS A 404
 * above. What the flag buys, read off Next 16.3.4's own build step
 * (`buildAppStaticPaths` in node_modules/next/dist/build/static-paths/app.js),
 * is NOT a narrower export: under `output: 'export'` the default already
 * writes exactly the pages `generateStaticParams` returned and guesses
 * nothing, and an EXPLICIT `true` does not build at all („"dynamicParams:
 * true" cannot be used with "output: export"."). `false` adds two things.
 * The route's fallback mode becomes NOT_FOUND, so `next dev` answers an
 * unknown slug with the 404 itself instead of rendering the page on demand
 * and leaving it to the `notFound()` below. And it arms a build belt against
 * a params list that loses its key: „Segment "…" exports "dynamicParams:
 * false" but the param "slug" is missing from the generated route params."
 * (under the export, Next's own "incomplete params" check would refuse the
 * same list one step later — the belt names the segment first).
 */
export const dynamicParams = false;

/**
 * One entry per doctor; the locale half comes from the [locale] layout (see
 * THE ROUTE IS A DATA LIST above). Walking `doctors` rather than a second list
 * is what makes a new person ONE edit in lib/team: his page, his card on the
 * Team page and the card's link to it all come out of the same row.
 */
export function generateStaticParams() {
  return doctors.map((doctor) => ({ slug: doctor.id }));
}

/**
 * The tab's words: this doctor, then the clinic (see A MINIMAL
 * `generateMetadata` above). Both halves of `params` are read here — the
 * locale because a metadata function is the standing exception to §15.16's
 * no-plumbing rule, the slug because nothing else knows whose page this is.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const siteName = t('siteName');

  // Both fallbacks are the same one — the clinic's name alone — and neither is
  // reachable on the built site: `dynamicParams = false` means only the slugs
  // generateStaticParams emitted exist, and request.ts falls back to
  // `defaultLocale` for anything outside the five. They exist so this function
  // is total (see the header).
  if (!isLocale(locale)) return { title: siteName };
  const doctor = findDoctor(slug);
  if (doctor === undefined) return { title: siteName };

  return { title: `${doctor.words[locale].name} — ${siteName}` };
}

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations('team');
  const locale = await getLocale();
  if (!isLocale(locale))
    throw new Error(`doctor page: unknown locale "${locale}"`);

  const page = populateDoctorPage(locale, slug, {
    // ui/Keyword's `Keywords` turns lib/team's cut-up texts into text and <b>
    // fragments — the credo card's quote (D12) AND, since 2026-10-13, every
    // paragraph of the biography, which carries key words of its own
    // (CLAUDE.md §15.23 round 7, the owner: "i also wan thte text of
    // biografie to be like the text at [the credo's quote] … so gary-ish er
    // and with tighlighted keywords"; lib/team's THE BIOGRAPHY'S KEY WORDS).
    // The populator does the cutting and never builds an element; the page
    // does the rendering and never sees a `<k>` (run D1/D2). The walk's one
    // option since the doctor's week left the page, the same day.
    renderKeywords: (segments) => <Keywords segments={segments} />,
  });
  if (!page) notFound();

  return (
    <>
      {/* THE OPENER owns the page's <h1> (the doctor's name) — unlike the
          Services and Home pages, whose bands carry no page heading and whose
          <h1> is therefore an `sr-only` element of the page's own. Here the
          name IS the opener's biggest line, so §9's one outline root and the
          visible title are the same element. The credo card under it is
          REQUIRED (D12) and carries the outline's first <h2>. On a laptop or a
          desktop the band lays the name over the card beside a picture that
          takes a third of the column and grows down to the words' floor
          (D62–D64, 2026-10-01) — which retired the `align="lowered"` seat this
          page passed since round 2l (D54): the band places the name itself
          now, and the card centres in the height left under it. */}
      <DoctorIntro
        name={page.intro.name}
        position={page.intro.position}
        photo={page.intro.photo}
        credo={
          // Checked against the band's public shape here, where the literal is
          // spelled (G2-R2 tier 2, typescript F5): the populator hands over only
          // the quote node, so this is the one place the shape is written out.
          {
            eyebrow: t('doctor.philosophy.eyebrow'),
            title: t('doctor.philosophy.title'),
            body: page.intro.credo,
          } satisfies DoctorIntroCredo
        }
      />
      {/* THE „ÎN CIFRE" TILES (D30), SECOND since 2026-10-13 — the owner: "so
          "IN NUMBERS" would be the second element in the page" — on the lilac
          TintedBand ground, the page's one lilac band since the biography left
          it that day. The numbers come through as numbers — the island counts
          up to them — and are printed by `Intl.NumberFormat` in the visitor's
          language (§8.3), never by the band; the icon ids become glyphs in
          ../stat-tiles.tsx, the one mapping this page and its twin share
          (G2-R2 tier 3). `scaled` since 2026-10-13: THE BAND SCALE on a laptop
          or desktop, the tiles at 9/8 of the band's pixel, exactly the numbers
          band Home and Team draw — here on its lilac ground, centred, with its
          lead (the header's THE WHOLE PAGE IN THE BAND SCALE). */}
      <DoctorStats
        scaled
        eyebrow={t('doctor.stats.eyebrow')}
        title={t('doctor.stats.title')}
        lead={t('doctor.stats.lead')}
        atLeast={t('doctor.stats.atLeast')}
        tiles={toStatTiles(page.stats)}
        format={new Intl.NumberFormat(locale).format}
      />
      {/* THE BIOGRAPHY AND THE COURSES, one band on the page ground (CLAUDE.md
          §15.23 round 7 — the owner: "on the left biography and on the right
          the thing with the "Courses and specialisations" but hugely
          rectified. no year anymore. jsut dot ideas"). „Despre {name}" on the
          left — the name the ICU argument (see the header), the same string
          the opener's <h1> prints — over the paragraphs, each the node
          `renderKeywords` built above, its key words in <b> (since
          2026-10-13); and on the right the doctor's courses, ONE IDEA PER DOT
          in lib/team's order, lit one by one by themselves:
          sections/DoctorCourses, which the band composes and hands these
          three strings as given. A doctor without a course gets an empty
          `items`; the courses then render nothing and the biography stands
          alone. */}
      <DoctorProfile
        about={{
          eyebrow: t('doctor.about.eyebrow'),
          title: t('doctor.about.title', { name: page.intro.name }),
          paragraphs: page.profile.paragraphs,
        }}
        courses={{
          eyebrow: t('doctor.courses.eyebrow'),
          title: t('doctor.courses.title'),
          items: page.profile.courses,
        }}
      />
      {/* ── FUTURE SEAM (owner, 2026-09-25, "very important … note it
          somewhere" · "it will sit above map section", run ledger D19): a band
          linking THIS doctor's blog articles goes HERE — above ClinicLocation,
          and since 2026-10-13 under the biography and the courses. Not built:
          the blog's list exists in every language (CLAUDE.md §15.39), its
          article pages do not yet. When it lands it is a DUMB band populated
          from here, like the three above, and ./Doctor.stories.tsx follows in
          the same change. */}
      {/* The map closes every page of this run — the owner's „add at the end
          the map". It reads lib/clinic itself and takes only `scaled` from
          here: THE BAND SCALE on a laptop or desktop, the map band Home and
          Team draw to the pixel (CLAUDE.md §15.32 round 3 — the owner,
          2026-10-13: "as the current map on home page is now, i need it
          updated reactivity wise on absoultey every page … with this i am
          refering to individual doctor page"). Since round 4 the same day
          every other band of this page scales too (the header's THE WHOLE
          PAGE IN THE BAND SCALE), so the map's eyebrow and <h2> are one size
          with theirs at every width, on the column's left edge like the
          biography's. */}
      <ClinicLocation scaled />
    </>
  );
}
