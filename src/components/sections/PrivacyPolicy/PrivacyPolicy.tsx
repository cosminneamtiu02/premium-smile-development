import type { ReactElement, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card/Card';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { LOCALE_COOKIE_MAX_AGE_S } from '@/i18n/cookie';
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from '@/i18n/locales';
import { clinic } from '@/lib/clinic/clinic';
import { PRIVACY_MAP_ANCHOR } from '@/lib/routes/routes';
import { privacyTranslator } from './messages';

// sections/PrivacyPolicy — the privacy and cookie policy, the whole of the
// /{locale}/privacy page (CLAUDE.md §12: "a short privacy/cookie policy page
// (all locales) disclosing the language cookie"; BACKLOG.md entry 3; the
// owner, 2026-10-10: "build all things mentioned and all fixes"). It says
// what the site MEASURABLY does with a visitor's data and nothing it does not:
//   · the host's server logs — the only thing every visit leaves;
//   · ONE cookie, the language one (COOKIES.md §2) — its name and lifetime READ
//     from src/i18n, never retyped, so the page cannot drift from the cookie;
//   · the Google map — the visitor's IP reaches Google when it loads
//     (COOKIES.md §3; the frame is `credentialless`, so no stored Google
//     cookie rides along in current browsers — CLAUDE.md §15.38);
//   · a call or a WhatsApp message, the links out, the visitor's rights, the
//     complaint authority (GDPR art. 13), and who runs the clinic (Law
//     365/2002 art. 5, for a regulated profession).
// The WORDS are drafts awaiting the owner's and a lawyer's read (BACKLOG.md
// entry 3), in their own message files — ./messages.ts says why.
//
// ── A BAND WIRED TO SITE DATA, like ClinicLocation and the Footer (§4's
// sub-kinds): it reads lib/clinic and translates itself, so the page that
// mounts it passes nothing. It also holds the page's ONE <h1> (§9), the
// DoctorIntro precedent — the policy IS the page.
//
// ── THE CLINIC'S LEGAL FACTS ARE `null` UNTIL THE OWNER SUPPLIES THEM
// (lib/clinic's `legal`): each null prints the locale's „[de completat]" in
// its place, and the e-mail is a link only once it exists. Nothing is ever
// invented on a legal page.
//
// ── ZERO CLIENT JAVASCRIPT. No 'use client', no state, no effect: the page
// is inert HTML (§16), every link a plain <a href>. `useLocale` and
// `useTranslations` are next-intl's isomorphic hooks — resolved at build in
// the export and through the provider in Storybook — the ClinicLocation idiom.
//
// ── THE OUTLINE: h1 (the title) → ten h2s, one per part, each part a plain
// <section> carrying an ENGLISH fragment id (§15.20) so a link can point at it
// — the map band's note points at #map. The parts stay UNNAMED (no
// aria-labelledby): ten region landmarks on one text page would bury the
// page's real landmarks; a screen reader walks this page by its headings.
//
// ── A TAG AND ITS ARGUMENT NEVER SHARE A NAME. `t.rich` takes ONE values
// object for both, so `<email>{emailAddress}</email>` — the tag wraps the
// address it prints, under another name. Spelled `{email}` inside `<email>`,
// one of the two would silently win.

/**
 * The day the policy's words last changed — printed under the title as each
 * language's long date. Move it with every change to the five files.
 */
export const POLICY_UPDATED = '2026-10-10';

/** The h1's id — the handle the page twin and the tests find the title by. */
export const PRIVACY_TITLE_ID = 'privacy-title';

/**
 * THE INLINE LINK. Underlined at rest — a link inside a sentence must differ
 * from it by more than colour (SC 1.4.1) — lavender under the pointer, with
 * ui/TextButton's own focus ring and colour clock (`outline-offset-2
 * focus-visible:outline-2 focus-visible:outline-focus`, 200ms ease-out).
 * Every link here sits on the page ground, where `--accent` reads 4.81:1
 * (tests/unit/accent-census.test.ts names this file a wearer, with that
 * ground). KEEP-IN-SYNC with sections/ClinicLocation's NOTE_LINK — the note
 * under the map links HERE in the same dress; PrivacyPolicy.test.tsx holds
 * the two strings equal.
 */
export const POLICY_LINK =
  'rounded-xs underline decoration-1 underline-offset-2 outline-offset-2 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'transition-[color] duration-200 ease-out hover:text-accent ' +
  'motion-reduce:transition-none';

/**
 * Who serves the pages TODAY: GitHub Pages, the interim production host
 * (CLAUDE.md §15.2). TODO(launch): switch both fields with the host the day
 * the clinic's domain lands (BACKLOG.md entry 3) — Cloudflare, the
 * recommended one, also adds a cookie of its own unless its bot protection
 * stays off (BACKLOG.md entry 1).
 */
const HOST = {
  name: 'GitHub Pages',
  privacy:
    'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
} as const;

/** The pages the policy points visitors to — each checked live on 2026-10-10. */
const SOURCES = {
  google: (locale: Locale) =>
    `https://policies.google.com/privacy?hl=${locale}`,
  whatsapp: 'https://www.whatsapp.com/legal/privacy-policy-eea',
  anspdcp: 'https://www.dataprotection.ro/',
  cmsr: 'https://cmsr.ro/',
} as const;

/** A month as the cookie's lifetime counts it: a twelfth of 365 days. */
const SECONDS_PER_MONTH = (365 * 24 * 60 * 60) / 12;

type PartProps = Readonly<{ id: string; title: string; children: ReactNode }>;

/** One part of the policy: a plain <section> with its id, an h2, its text. */
function Part({ id, title, children }: PartProps): ReactElement {
  return (
    <section id={id} className="flex flex-col gap-4">
      <Heading size="band" asChild>
        <h2>{title}</h2>
      </Heading>
      {children}
    </section>
  );
}

/** A paragraph of the policy's prose, at the site's 18px body size (§15.1). */
function Prose({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return <p className="text-lg">{children}</p>;
}

/**
 * A bulleted list. Tailwind's preflight strips list markers, so they come
 * back here, in the display lilac (`accent-decorative`, a graphic's colour).
 */
function Bullets({
  items,
}: Readonly<{ items: readonly string[] }>): ReactElement {
  return (
    <ul className="flex list-disc flex-col gap-2 ps-6 text-lg marker:text-accent-decorative">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function PrivacyPolicy(): ReactElement {
  const requested = useLocale();
  // The workbench's pseudo-locale is no language a policy exists in: it reads
  // the reference, Romanian, rather than inventing one (ClinicLocation's map
  // url does the same).
  const locale: Locale = isLocale(requested) ? requested : defaultLocale;
  const t = privacyTranslator(locale);
  // The map band's own title, so the policy names that section exactly as the
  // visitor sees it, in every language.
  const home = useTranslations('home');
  const band = home('location.title');

  const { legal } = clinic;
  const fact = (value: string | null): string => value ?? t('missing');
  const address = `${clinic.address.street}, ${clinic.address.postalCode} ${clinic.address.city}`;
  // English in BRITISH order („10 October 2026"), the European reader's — the
  // bare `en` formats American (the copy review, 2026-10-10).
  const date = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${POLICY_UPDATED}T00:00:00Z`));
  const months = Math.round(LOCALE_COOKIE_MAX_AGE_S / SECONDS_PER_MONTH);

  // The sources open IN THE SAME TAB (the a11y review, 2026-10-10): these are
  // references in a text an older visitor reads end to end, and Back works —
  // a new tab greys Back out and announces nothing (G201). No referrer either:
  // the page they leave stays ours. Named in lower case on purpose: a
  // capitalised name would read as a component to the hooks lint rule and
  // stop it guarding this callback (the React review).
  const external = (href: string) =>
    function externalLink(chunks: ReactNode): ReactElement {
      return (
        <a href={href} rel="noreferrer" className={POLICY_LINK}>
          {chunks}
        </a>
      );
    };
  // The e-mail is a link only once it exists; until then the sentence reads
  // its placeholder as plain text.
  const email = (chunks: ReactNode): ReactNode =>
    legal.email === null ? (
      chunks
    ) : (
      <a href={`mailto:${legal.email}`} className={POLICY_LINK}>
        {chunks}
      </a>
    );
  // `tel:` carries no target: a protocol handler takes the number, nothing
  // navigates (the Footer's phone-disc rule).
  const phone = (chunks: ReactNode): ReactElement => (
    <a href={`tel:${clinic.phone}`} className={POLICY_LINK}>
      {chunks}
    </a>
  );
  const emailAddress = fact(legal.email);

  const cookieRows: ReadonlyArray<readonly [string, ReactNode]> = [
    [t('cookies.nameLabel'), <code key="name">{LOCALE_COOKIE}</code>],
    [t('cookies.purposeLabel'), t('cookies.purpose')],
    [t('cookies.whenLabel'), t('cookies.when')],
    [t('cookies.durationLabel'), t('cookies.duration', { months })],
    [t('cookies.typeLabel'), t('cookies.type')],
  ];

  return (
    // THE PAGE-BAND RECIPE (ui/Container's header): the outer owns rhythm,
    // Container inside owns width and the container context. No paint of its
    // own — the shell's <body> already carries `bg-page` (the 404 page's
    // reasoning). An <article>, because the policy is one whole document.
    <article>
      <Container>
        {/* The rhythm box. THE FULL COLUMN, no prose measure: the owner,
            2026-10-10, on the built page — "too much space on the right side.
            align it with top bar width" — so the policy's edges are the top
            bar's (both are ui/Container's column) at every width. A
            `max-w-3xl` measure (48rem, about 94 characters of Romanian a
            line) stood here first and left the column's last 241px empty at a
            1280 window, 753px at 1920 (measured). Start-aligned, like all long
            prose (§15.1). */}
        <div className="flex flex-col gap-12 py-12 @lg:py-16 @3xl:py-20">
          <header className="flex flex-col gap-4">
            <Heading size="hero" asChild>
              <h1 id={PRIVACY_TITLE_ID}>{t('title')}</h1>
            </Heading>
            <p className="text-base text-ink-muted">{t('updated', { date })}</p>
            <p className="text-xl">{t('intro', { name: clinic.name })}</p>
          </header>

          {/* THE SHORT VERSION FIRST — the four facts most visitors came for,
              in the deck's idle frame (the credo card's dress). */}
          <Card tone="framed" asChild>
            <section id="summary">
              <Heading size="band" asChild>
                <h2>{t('summary.title')}</h2>
              </Heading>
              <Bullets
                items={[
                  t('summary.noTracking'),
                  t('summary.oneCookie'),
                  t('summary.map', { band }),
                  t('summary.noForms'),
                ]}
              />
            </section>
          </Card>

          <Part id="controller" title={t('controller.title')}>
            <Prose>
              {t('controller.company', {
                company: fact(legal.companyName),
                name: clinic.name,
                address,
              })}
            </Prose>
            <Prose>
              {t('controller.identity', {
                cui: fact(legal.cui),
                tradeRegister: fact(legal.tradeRegister),
                registeredOffice: fact(legal.registeredOffice),
              })}
            </Prose>
            <Prose>
              {t.rich('controller.contact', {
                email,
                phone,
                emailAddress,
                phoneNumber: clinic.phoneDisplay,
              })}
            </Prose>
            <Prose>
              {t.rich('controller.profession', {
                cmsr: external(SOURCES.cmsr),
              })}
            </Prose>
          </Part>

          <Part id="visit" title={t('visit.title')}>
            <Prose>{t('visit.logs', { host: HOST.name })}</Prose>
            <Prose>{t('visit.purpose')}</Prose>
            <Prose>
              {t.rich('visit.provider', { policy: external(HOST.privacy) })}
            </Prose>
          </Part>

          <Part id="cookies" title={t('cookies.title')}>
            <Prose>{t('cookies.what')}</Prose>
            <Prose>{t('cookies.ours')}</Prose>
            {/* THE COOKIE, AS A DEFINITION LIST: label beside value from the
                card's own `@md` (28rem of card), label over value below it, so
                a phone never squeezes two columns. One <dl>, five pairs, each
                pair one <div> (HTML's own grouping for dt/dd). */}
            <Card>
              <dl className="flex flex-col gap-4 text-lg">
                {cookieRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-1 @md:grid-cols-[minmax(0,11rem)_1fr] @md:gap-6"
                  >
                    <dt className="font-semibold text-ink-strong">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Prose>{t('cookies.none')}</Prose>
            <Prose>{t('cookies.delete')}</Prose>
          </Part>

          <Part id={PRIVACY_MAP_ANCHOR} title={t('map.title')}>
            <Prose>{t('map.what', { band })}</Prose>
            <Prose>{t('map.data')}</Prose>
            <Prose>
              {t.rich('map.basis', {
                google: external(SOURCES.google(locale)),
              })}
            </Prose>
            <Prose>{t('map.without')}</Prose>
          </Part>

          <Part id="contact" title={t('contact.title')}>
            <Prose>{t('contact.phone')}</Prose>
            <Prose>{t('contact.health')}</Prose>
            <Prose>
              {t.rich('contact.whatsapp', {
                whatsapp: external(SOURCES.whatsapp),
              })}
            </Prose>
            <Prose>{t('contact.patient')}</Prose>
          </Part>

          {/* THE REVIEWS (the copy review, 2026-10-10): the Home page shows
              patients' Google reviews with their names and some photos, and a
              policy that says what the site does with personal data says so,
              with the way to have one removed. */}
          <Part id="reviews" title={t('reviews.title')}>
            <Prose>{t('reviews.text')}</Prose>
          </Part>

          <Part id="links" title={t('links.title')}>
            <Prose>{t('links.text')}</Prose>
          </Part>

          <Part id="rights" title={t('rights.title')}>
            <Prose>{t('rights.intro')}</Prose>
            <Bullets
              items={[
                t('rights.access'),
                t('rights.rectify'),
                t('rights.erase'),
                t('rights.restrict'),
                t('rights.port'),
              ]}
            />
            {/* The right to OBJECT, on its own (GDPR art. 21(4): "explicitly
                … clearly and separately from any other information"). */}
            <Prose>{t('rights.object')}</Prose>
            <Prose>{t('rights.automated')}</Prose>
            {/* E-mail, phone or the clinic — never a placeholder alone (the
                a11y review: until the e-mail exists, the phone still works). */}
            <Prose>
              {t.rich('rights.ask', {
                email,
                phone,
                emailAddress,
                phoneNumber: clinic.phoneDisplay,
              })}
            </Prose>
            <Prose>
              {t.rich('rights.complain', {
                anspdcp: external(SOURCES.anspdcp),
              })}
            </Prose>
          </Part>

          <Part id="changes" title={t('changes.title')}>
            <Prose>{t('changes.text')}</Prose>
          </Part>
        </div>
      </Container>
    </article>
  );
}
