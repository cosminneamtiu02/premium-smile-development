import type { Locale } from '../../i18n/locales';
import type { ImagePath } from '../image-path/image-path';

// lib/hero-slides — THE Home opener's slides: each picture and its words in
// all five languages. Site DATA in §4's foundation ring (the lib/prices and
// lib/reviews precedents): one file the page reads, nothing fetched, nothing
// mutated, React-free (fenced by tests/unit/lib-react-free.test.ts). The Hero
// band is „a dumb component … I populate it with path and text" (owner
// dispatch 2026-09-19, epic #103): app/[locale]/(home)/page.tsx imports this
// list, picks the visitor's language and hands finished strings over; the band
// never sees this file.
//
// WHY A TYPESCRIPT MODULE AND NOT MESSAGE KEYS — the lib/prices argument, word
// for word (board Q3, owner fb-465): a slide is CONTENT, the way a price row
// and a review are content, so its picture and its words travel together in
// one object literal, and `Record<Locale, …>` makes a missing German slogan a
// failed `tsc` instead of a leaked English one. The `home` namespace keeps
// only what is not a fact about a slide: the region's name, the „{index} din
// {total}" sentence and the two button labels.
//
// AN ARRAY, NOT AN OBJECT KEYED BY ID: the ring's order is designed here —
// the first row is the LCP picture and the slide the page opens on.
//
// WHERE THE WORDS COME FROM. The three slides, their Romanian and their
// English are the old site's own (`home.hero.slides.{calm,team,result}` in
// apps/frontend/src/i18n/locales/{ro,en}/common.json, read 2026-09-19); the
// `team` slogan carried a forced line break there (`\n` + whitespace-pre-line),
// dropped here — the new stage wraps where the column says, not where a
// string does. THE OTHER THREE LANGUAGES ARE DRAFTS (§15.17): written by
// Claude on the owner's dispatch and FLAGGED FOR THE OWNER'S CONFIRMATION,
// the reviews/prices lanes' shape. The old site had no supporting line; a
// drafted `text` line rode each row from 2026-09-19 (the owner's „image,
// text and stuff") until the owner STRUCK IT ENTIRELY on 2026-09-21 (round 8:
// "remove all text … leave it blank on every slide … remove the whole thing
// that holds that text and replace with empty space") — the field is gone
// from this type, the populator and the band, and the band keeps the line's
// height as a blank spacer so the slogan keeps its distance from the
// buttons. The old `result` slogan
// („ca într-un studio de lux") is the owner's own wording, kept verbatim,
// but note it against the CMSR rule this file otherwise follows: descriptive,
// never superlative, never a promise.
//
// A slide's accessible NAME is not authored here: lib/rotation's law names a
// slide and its bead by ONE ICU string, „{index} din {total}"
// (`home.hero.slide`), which the page formats — so a screen reader hears the
// position, and the data carries only what the visitor reads.
//
// PICTURES are `public/images/demo/hero-*.jpg` UNTIL THE OWNER'S PHOTOGRAPHS
// LAND (§11) — and their `alt` describes THOSE pictures, not the scenes the
// real photographs will show (the old site's alts travel in each row's TODO): hero-calm.jpg is the Image lane's committed demo photograph;
// hero-team.jpg and hero-result.jpg are synthetic scenes generated for this
// lane (no people, nothing to license, obviously placeholders). The site's own
// go in public/images/hero/ BY CONVENTION, which tests/unit/
// hero-slides-data.test.ts will enforce the day a non-demo path appears; the
// TYPE (lib/image-path) stops at §11's folder so a demo picture needs no cast.
// Every picture is 1600 × 1200 — the band renders them `fill` + `object-cover`
// at `sizes="100vw"`, so the ratio only decides how much a portrait phone
// crops from the sides.

/** The translated part of one slide — every locale, or it does not compile. */
export type HeroSlideWords = Readonly<{
  /** What the picture shows (§11 — the alt text, finished). */
  alt: string;
  /** The slogan — display text on ui/Heading's 'hero' step. */
  title: string;
}>;

export type HeroSlideEntry = Readonly<{
  /** Stable English kebab-case id — the React key of the slide and of its bead. */
  id: string;
  /** The picture under public/images/ (lib/image-path). */
  picture: Readonly<{ src: ImagePath }>;
  /** Words in all five locales. */
  words: Readonly<Record<Locale, HeroSlideWords>>;
}>;

/**
 * The opener's ring, in display order. Add or reorder rows HERE — the type
 * refuses a missing language, and tests/unit/hero-slides-data.test.ts pins
 * what a cast could smuggle past the compiler (empty strings, a duplicate id,
 * a picture that does not exist on disk).
 */
export const heroSlides: readonly HeroSlideEntry[] = [
  {
    id: 'calm',
    // TODO(owner): the alt below describes the DEMO picture (a dental examination close-up — the Image lane’s committed demo photograph),
    // because an alt must describe what is shown (SC 1.1.1, G2 a11y
    // 2026-09-19). The old site's own alt, to restore WITH the real
    // photograph it was written for: „Cabinet de tratament liniștit cu lumină naturală" /
    // "Calm treatment room with natural light".
    picture: { src: '/images/demo/hero-calm.jpg' },
    words: {
      ro: {
        alt: 'Examinare stomatologică, prim-plan',
        title: 'O clinică stomatologică modernă pentru toată familia',
      },
      en: {
        alt: 'Dental examination, close-up',
        title: 'A modern dental practice for the whole family',
      },
      de: {
        alt: 'Zahnärztliche Untersuchung, Nahaufnahme',
        title: 'Eine moderne Zahnklinik für die ganze Familie',
      },
      fr: {
        alt: 'Examen dentaire, gros plan',
        title: 'Un cabinet dentaire moderne pour toute la famille',
      },
      it: {
        alt: 'Visita odontoiatrica, primo piano',
        title: 'Uno studio dentistico moderno per tutta la famiglia',
      },
    },
  },
  {
    id: 'team',
    // TODO(owner): the alt below describes the DEMO picture (three abstract silhouettes — a synthetic scene generated for this lane),
    // because an alt must describe what is shown (SC 1.1.1, G2 a11y
    // 2026-09-19). The old site's own alt, to restore WITH the real
    // photograph it was written for: „Medic primitor salutând un pacient la recepție" /
    // "Friendly clinician greeting a patient at reception".
    picture: { src: '/images/demo/hero-team.jpg' },
    words: {
      ro: {
        alt: 'Trei siluete stilizate într-o încăpere luminoasă',
        title: 'O echipă care ascultă, pe limba ta',
      },
      en: {
        alt: 'Three stylised silhouettes in a bright room',
        title: 'A team that listens, in your language',
      },
      de: {
        alt: 'Drei stilisierte Silhouetten in einem hellen Raum',
        title: 'Ein Team, das zuhört – in Ihrer Sprache',
      },
      fr: {
        alt: 'Trois silhouettes stylisées dans une pièce lumineuse',
        title: 'Une équipe à l’écoute, dans votre langue',
      },
      it: {
        alt: 'Tre sagome stilizzate in una stanza luminosa',
        title: 'Un team che ascolta, nella tua lingua',
      },
    },
  },
  {
    id: 'result',
    // TODO(owner): the alt below describes the DEMO picture (a stylised smile emblem — a synthetic scene generated for this lane),
    // because an alt must describe what is shown (SC 1.1.1, G2 a11y
    // 2026-09-19). The old site's own alt, to restore WITH the real
    // photograph it was written for: „Pacient zâmbind încrezător după tratament" /
    // "Patient smiling confidently after treatment".
    picture: { src: '/images/demo/hero-result.jpg' },
    words: {
      ro: {
        alt: 'Emblemă stilizată a unui zâmbet',
        title: 'Tratamente realizate ca într-un studio de lux',
      },
      en: {
        alt: 'Stylised emblem of a smile',
        title: 'Treatments crafted like a luxury studio',
      },
      de: {
        alt: 'Stilisiertes Emblem eines Lächelns',
        title: 'Behandlungen wie in einem exklusiven Studio',
      },
      fr: {
        alt: 'Emblème stylisé d’un sourire',
        title: 'Des soins réalisés comme dans un studio de luxe',
      },
      it: {
        alt: 'Emblema stilizzato di un sorriso',
        title: 'Trattamenti realizzati come in uno studio di lusso',
      },
    },
  },
];
