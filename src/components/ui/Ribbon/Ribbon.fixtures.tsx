import {
  useId,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '@/lib/cx/cx';
import { Button } from '../Button/Button';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import { Heading } from '../Heading/Heading';
import { Image } from '../Image/Image';
import { Ribbon, RibbonStation } from './Ribbon';

// ui/Ribbon's STAND-IN COLUMN — for the stories and the tests, never shipped.
// The ribbon was approved wrapping the doctor-card lane's TWO-SECTION card
// (sections/PersonnelCard's D16 rework: the content — portrait and name
// beside the quote — over the buttons row), which is not on develop. This
// file imitates that card with this repo's atoms, reading — never
// importing — the lane's rows: CONTENT, BLOCK, PAIR, PLACE, QUOTE and
// ACTIONS_ROW below are its strings, and `side` alternates by index as the
// Team page alternates it — the quote's washed `ink-faint` included, so the
// owner judges the card's own picture (a named wearer in
// tests/unit/ink-faint-census.test.ts, on the same white ground). Measured
// at a 1009px column, the prototype's real card was 1009 × 504 with the
// quote 504 × 84 centred 184px right of the card's centre, the name block
// 265 × 72 268px left of it, the buttons row 768 × 56 and the portrait's cell
// 192 × 256; Ribbon.test.tsx holds this one to what layout decides alone to
// a pixel, to what the typeface decides within a line of text, and to the
// two-column step (a card ≥ ~893px).
//
// ── THE SURFACE IS SPELLED HERE, ON A PLAIN <article>. ui/Card fixes its
// padding at p-6 and its header forbids `className` as a padding API, while
// a ribbon's card takes the two LANES as its padding, spelled as ui/Ribbon's
// TWO BOXES paragraph asks — `max(1.5rem, var(--ribbon-lane-top, 1.5rem))`
// on top, the same with `--ribbon-lane-side` either side, the card's own
// 1.5rem below. How the REAL card takes the lanes is the doctor-card lane's
// decision, not this one's. The surface is ui/Card's `surface` row and its
// corner and container mark, without the card's inner flex column (this
// card's one child is a column of its own).
//
// ── THE SEAM (§15.26), exactly what the real card will carry: the LITERAL
// attribute `data-ribbon-keepout` on the quote, the name block and the
// buttons row, and `data-ribbon-keepout="portrait"` on the portrait's cell.
//
// ── A LIST, BY ROUTE B (ui/Ribbon's THE COLUMN AS A LIST): the root is
// `role="list"` and each card sits in a WRAPPER station of
// `role="listitem"`, keeping its own <article>. That role is also how the
// stories and the tests find the ribbon's root.
//
// Texts are Romanian with diacritics (§15.7), German for the German story;
// demo people, factual words — no superlative, no promise of a result (the
// CMSR rules for dental practices). Portraits: the repo's demo photographs.

export type StandInDoctor = Readonly<{
  name: string;
  position: string;
  quote: string;
  portrait: string;
  /** The two buttons' labels. */
  services: string;
  profile: string;
}>;

const RO_BUTTONS = { services: 'Vezi serviciile', profile: 'Vezi profilul' };
const DE_BUTTONS = {
  services: 'Leistungen ansehen',
  profile: 'Profil ansehen',
};

export const DOCTORS_RO: readonly StandInDoctor[] = [
  {
    name: 'Dr. Elena Marin',
    position: 'Medic specialist ortodonție',
    quote:
      'Lucrez în ortodonție de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu ascultarea pacientului, apoi construim împreună un plan potrivit.',
    portrait: '/images/demo/portrait-1.jpg',
    ...RO_BUTTONS,
  },
  {
    name: 'Dr. Andrei Șerban',
    position: 'Medic dentist, chirurgie orală',
    quote:
      'Mă ocup de chirurgie orală: extracții și mici intervenții. Înainte de fiecare procedură explic pașii și răspund la întrebări, iar controlul de după se programează la o săptămână.',
    portrait: '/images/demo/portrait-2.jpg',
    ...RO_BUTTONS,
  },
  {
    name: 'Dr. Cristina Țurcanu',
    position: 'Medic dentist, endodonție',
    quote:
      'Tratez canalele dinților la microscop și îi arăt pacientului radiografiile înainte și după fiecare etapă. Programăm împreună vizitele, iar la fiecare control verificăm cum se vindecă dintele.',
    portrait: '/images/demo/portrait-3.jpg',
    ...RO_BUTTONS,
  },
];

export const DOCTORS_DE: readonly StandInDoctor[] = [
  {
    name: 'Dr. Elena Marin',
    position: 'Fachzahnärztin für Kieferorthopädie',
    quote:
      'Ich arbeite seit über zehn Jahren in der Kieferorthopädie und erkläre jeden Schritt der Behandlung. Die Beratung beginnt mit dem Zuhören, danach erstellen wir gemeinsam einen passenden Plan.',
    portrait: '/images/demo/portrait-1.jpg',
    ...DE_BUTTONS,
  },
  {
    name: 'Dr. Andrei Șerban',
    position: 'Zahnarzt, Oralchirurgie',
    quote:
      'Ich arbeite in der Oralchirurgie: Extraktionen und kleine Eingriffe. Vor jedem Eingriff erkläre ich die Schritte und beantworte Fragen, und die Nachkontrolle wird für eine Woche später vereinbart.',
    portrait: '/images/demo/portrait-2.jpg',
    ...DE_BUTTONS,
  },
  {
    name: 'Dr. Cristina Țurcanu',
    position: 'Zahnärztin, Endodontie',
    quote:
      'Ich behandle Wurzelkanäle unter dem Mikroskop und zeige den Patientinnen und Patienten die Röntgenbilder vor und nach jedem Schritt. Die Termine planen wir gemeinsam, und bei jeder Kontrolle prüfen wir, wie der Zahn heilt.',
    portrait: '/images/demo/portrait-3.jpg',
    ...DE_BUTTONS,
  },
];

/** A quote of about 1 100 characters — the tallest card the ribbon wraps. */
export const LONG_QUOTE_RO =
  'Lucrez în ortodonție de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu ascultarea pacientului: ce îl deranjează, ce și-ar dori să schimbe și cât timp poate dedica tratamentului. Urmează examinarea clinică, fotografiile dentare și radiografiile, pe care le privim împreună pe ecran înainte de orice decizie. Apoi construim împreună un plan potrivit, cu variantele posibile — aparat dentar fix sau gutiere transparente — și cu etapele fiecăreia, astfel încât pacientul să știe de la început ce urmează. Când tratamentul are nevoie și de alte specialități, stabilesc planul împreună cu colegii din clinică, iar ordinea pașilor este explicată pacientului înainte de prima programare. La fiecare control verificăm împreună cum evoluează dantura și ajustăm planul dacă este nevoie. Între vizite, pacientul poate suna la clinică dacă apare o problemă, iar următoarea programare o stabilim împreună, după calendarul fiecăruia. Vorbesc română, engleză și franceză, așa că pacienții veniți din străinătate pot discuta cu mine direct, în una dintre aceste limbi.';

/** The same quote in German, the longest language. */
export const LONG_QUOTE_DE =
  'Ich arbeite seit über zehn Jahren in der Kieferorthopädie und erkläre jeden Schritt der Behandlung. Die Beratung beginnt mit dem Zuhören: was den Patienten stört, was er ändern möchte und wie viel Zeit er der Behandlung widmen kann. Danach folgen die klinische Untersuchung, die Zahnfotos und die Röntgenbilder, die wir vor jeder Entscheidung gemeinsam am Bildschirm ansehen. Dann erstellen wir gemeinsam einen passenden Plan mit den möglichen Varianten — feste Zahnspange oder transparente Schienen — und ihren einzelnen Schritten, damit der Patient von Anfang an weiß, was ihn erwartet. Braucht die Behandlung auch andere Fachgebiete, erstelle ich den Plan gemeinsam mit meinen Kolleginnen und Kollegen in der Klinik, und die Reihenfolge der Schritte wird vor dem ersten Termin erklärt. Bei jeder Kontrolle prüfen wir gemeinsam, wie sich die Zähne entwickeln, und passen den Plan an, wenn es nötig ist. Zwischen den Terminen kann der Patient die Klinik anrufen, wenn ein Problem auftritt, und den nächsten Termin legen wir gemeinsam fest, nach dem Kalender jedes Einzelnen. Ich spreche Rumänisch, Englisch und Französisch, sodass Patienten aus dem Ausland direkt in einer dieser Sprachen mit mir sprechen können.';

// ── THE DOCTOR-CARD LANE'S ROWS (read from its PersonnelCard.tsx, the doctor
// kind only). The two sides differ in which track holds the block.
type Side = 'start' | 'end';

const CONTENT: Record<Side, string> = {
  start:
    'flex flex-col gap-6 @3xl:grid @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:items-center @3xl:gap-x-8',
  end: 'flex flex-col gap-6 @3xl:grid @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl:items-center @3xl:gap-x-8',
};

/** The portrait over the name pair — painted the other way up on a phone. */
const BLOCK =
  'flex flex-col-reverse items-center gap-3 text-center @3xl:flex-col';

/** The name over the position — and on a phone the position over the name. */
const PAIR = 'flex flex-col-reverse items-center gap-3 @3xl:flex-col';

const PLACE: Record<Side, Record<'block' | 'quote', string>> = {
  start: {
    block: '@3xl:col-start-1 @3xl:row-start-1',
    quote: '@3xl:col-start-2 @3xl:row-start-1',
  },
  end: {
    block: '@3xl:col-start-2 @3xl:row-start-1',
    quote: '@3xl:col-start-1 @3xl:row-start-1',
  },
};

const QUOTE =
  'min-w-0 text-lg text-ink-faint text-justify before:content-[open-quote] after:content-[close-quote]';

const ACTIONS_ROW =
  'mx-auto flex w-full max-w-3xl flex-wrap gap-3 *:grow *:basis-64';

/** ui/Card's `surface` row, corner and container mark — with the two LANES as its padding (the header). */
const SURFACE =
  '@container rounded-md border border-line-subtle bg-surface ' +
  'pt-[max(1.5rem,var(--ribbon-lane-top,1.5rem))] ' +
  'px-[max(1.5rem,var(--ribbon-lane-side,1.5rem))] pb-6';

type StandInCardProps = Readonly<{
  doctor: StandInDoctor;
  /** The card's place in the column: every second card is laid out mirrored. */
  index: number;
}> &
  Omit<ComponentPropsWithoutRef<'article'>, 'children'>;

/** The doctor card the owner saw under the prototype, stood in. */
function StandInCard({
  doctor,
  index,
  className,
  ...rest
}: StandInCardProps): ReactElement {
  const headingId = useId();
  const servicesId = useId();
  const profileId = useId();
  const side: Side = index % 2 === 0 ? 'start' : 'end';
  return (
    <article
      {...rest}
      aria-labelledby={headingId}
      className={cx(SURFACE, className)}
    >
      <div className="flex flex-col gap-6">
        <div className={CONTENT[side]}>
          <div className={cx(BLOCK, PLACE[side].block)}>
            <div
              data-ribbon-keepout="portrait"
              className="aspect-3/4 w-48 max-w-full"
            >
              <Image
                variant="framed"
                src={doctor.portrait}
                width={600}
                height={800}
                alt=""
                sizes="12rem"
              />
            </div>
            <div data-ribbon-keepout="" className={PAIR}>
              <Heading size="band" asChild>
                <h2 id={headingId} className="hyphens-none">
                  {doctor.name}
                </h2>
              </Heading>
              <Eyebrow className="hyphens-none text-center">
                {doctor.position}
              </Eyebrow>
            </div>
          </div>
          <blockquote
            data-ribbon-keepout=""
            className={cx(QUOTE, PLACE[side].quote)}
          >
            {doctor.quote}
          </blockquote>
        </div>
        <div data-ribbon-keepout="" className={ACTIONS_ROW}>
          <Button variant="solid" size="lg" asChild>
            <a
              id={servicesId}
              aria-labelledby={`${servicesId} ${headingId}`}
              href="#servicii"
            >
              {doctor.services}
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a
              id={profileId}
              aria-labelledby={`${profileId} ${headingId}`}
              href="#profil"
            >
              {doctor.profile}
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

/** The stand-in cards, wrapped by the ribbon — a list, each card in a station of its own (A LIST, BY ROUTE B). */
export function StandInColumn({
  doctors,
}: Readonly<{ doctors: readonly StandInDoctor[] }>): ReactElement {
  return (
    <Ribbon role="list">
      {doctors.map((doctor, index) => (
        <RibbonStation key={doctor.name} role="listitem">
          <StandInCard doctor={doctor} index={index} />
        </RibbonStation>
      ))}
    </Ribbon>
  );
}

/** The column widths the stories draw at, in rem — the ribbon follows the COLUMN, not the window. */
const WIDTHS = {
  /** 1009px: two cards, two columns each, the ribbon 20px wide. */
  desktop: 'w-[63.0625rem]',
  /** 599px: the stacked card, the ribbon 13.8px. */
  tablet: 'w-[37.4375rem]',
  /** 297px: the bolder phone, the ribbon 9.3px. */
  phone: 'w-[18.5625rem]',
  /** 241px: the column a 320px window leaves, the ribbon 8.4px. */
  narrowest: 'w-[15.0625rem]',
} as const;

type StandInWidth = keyof typeof WIDTHS;

/** A column of one of the stories' widths, centred in the window. */
export function StandInFrame({
  width,
  children,
}: Readonly<{ width: StandInWidth; children: ReactNode }>): ReactElement {
  return <div className={cx('mx-auto', WIDTHS[width])}>{children}</div>;
}
