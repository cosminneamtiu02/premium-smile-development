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
// THE PICTURES ARE THE CLINIC'S OWN (owner, 2026-10-01: "refactor on images
// in the auto scrolling component on main page … use the following … in
// downloads under POZE CLINICA"): three photographs from his folder, in his
// order — `_DSF3109-HDR.jpg` the lobby, `_DSF2784-HDR.jpg` a treatment room,
// `_DSF2694.jpg` the handpieces on the unit's arm (his list said `-HDR` for
// the third; the folder has it without, and he confirmed it is the tools).
// Each was re-encoded for the repository by the lane, never committed raw:
// 1920 × 1280 — the largest `deviceSizes` width in next.config, and the
// optimizer never makes a variant wider than that, so a wider source would
// only bloat the repository and the export — progressive JPEG at quality 82,
// the EXIF orientation baked in and every other tag dropped (camera model,
// timestamps; the originals carried both), pixels already sRGB. The band
// shows them `grayscale blur-xs` at 80 % over the page ground: the grey look
// is the band's, the files stay in colour. They live in public/images/hero/,
// the convention tests/unit/hero-slides-data.test.ts enforces since the day
// they arrived; the lane deleted the two synthetic demo scenes (hero-team,
// hero-result) and left `public/images/demo/hero-calm.jpg` in place as the
// Image atom's demo photograph (ui/Image, ui/Avatar and ReviewCard fixtures
// read it; it has nothing to do with this band any more).
//
// WHERE THE WORDS COME FROM. Every slogan and every alt below is a DRAFT by
// Claude in ALL FIVE languages, written on the owner's dispatch of 2026-10-01
// ("paired text wise, idk, you decide on the text. these sound kind of
// pretentious, make them sound friendlier") and FLAGGED FOR THE OWNER'S
// CONFIRMATION (§15.17) — the old site's own slogans („O clinică
// stomatologică modernă pentru toată familia", „O echipă care ascultă, pe
// limba ta", „Tratamente realizate ca într-un studio de lux") left with the
// demo pictures on that word. Each slogan is paired to its picture: a welcome
// on the lobby, the visit explained step by step on the treatment room, the
// hands and their tools on the handpieces. The register is each message
// file's own — ro „tu", en "you", de „Sie", fr « vous », it «tu». The rules
// every shipped string on this site follows are MACHINE-CHECKED for this
// list: CMSR (tests/unit/cmsr-scan.test.ts walks these rows since this lane —
// no superlative, no guarantee, no result claim; „mâini blânde" describes a
// manner, not an outcome) and D-DASH (no dash inside a sentence; the data
// test). The French exclamation carries a narrow no-break space (U+202F)
// before the „!", the language's own typography, so a phone never breaks the
// mark onto its own line. The old `\n` line break and the drafted `text` line
// of the 2026-09 rounds are history: the column decides where a slogan wraps,
// and the band keeps the struck line's room above the slogan.
//
// A slide's accessible NAME is not authored here: lib/rotation's law names a
// slide and its bead by ONE ICU string, „{index} din {total}"
// (`home.hero.slide`), which the page formats — so a screen reader hears the
// position, and the data carries only what the visitor reads. The `alt` is
// what the PICTURE shows (SC 1.1.1), never the slogan again: a screen reader
// reads the slogan from its <p>, so an alt that repeated it would say the
// same words twice (pinned by the data test).

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
 * a picture that does not exist on disk or is narrower than the optimizer's
 * largest variant, a slogan word that cannot fit a 320px column).
 *
 * TODO(owner): confirm the five-language slogans and alts below (Claude's
 * drafts, 2026-10-01) — or rewrite them; the Romanian line is what the
 * visitor in Sibiu reads first.
 */
export const heroSlides: readonly HeroSlideEntry[] = [
  {
    id: 'lobby',
    picture: { src: '/images/hero/lobby.jpg' },
    words: {
      ro: {
        alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
        title: 'Bine ai venit! Te așteptăm cu drag.',
      },
      en: {
        alt: 'The clinic’s waiting room, with yellow armchairs and an open door to a treatment room',
        title: 'Welcome! We look forward to seeing you.',
      },
      de: {
        alt: 'Das Wartezimmer der Klinik mit gelben Sesseln und einer offenen Tür zu einem Behandlungszimmer',
        title: 'Herzlich willkommen! Wir freuen uns auf Sie.',
      },
      fr: {
        alt: 'La salle d’attente de la clinique, avec des fauteuils jaunes et une porte ouverte sur un cabinet de soins',
        title: 'Bienvenue ! Nous avons hâte de vous accueillir.',
      },
      it: {
        alt: 'La sala d’attesa della clinica, con poltrone gialle e una porta aperta su una sala di trattamento',
        title: 'Ti diamo il benvenuto! Ti aspettiamo con piacere.',
      },
    },
  },
  {
    id: 'treatment-room',
    picture: { src: '/images/hero/treatment-room.jpg' },
    words: {
      ro: {
        alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
        title: 'Ne facem timp să îți explicăm fiecare pas.',
      },
      en: {
        alt: 'A treatment room with the dental chair and, on the wall, a screen showing a panoramic X-ray',
        title: 'We take the time to explain every step.',
      },
      de: {
        alt: 'Ein Behandlungszimmer mit dem Behandlungsstuhl und, an der Wand, einem Bildschirm mit einem Panoramaröntgenbild',
        title: 'Wir nehmen uns Zeit und erklären jeden Schritt.',
      },
      fr: {
        alt: 'Une salle de soins avec le fauteuil dentaire et, au mur, un écran affichant une radiographie panoramique',
        title: 'Nous prenons le temps de vous expliquer chaque étape.',
      },
      it: {
        alt: 'Una sala di trattamento con la poltrona odontoiatrica e, alla parete, uno schermo con una radiografia panoramica',
        title: 'Ci prendiamo il tempo di spiegarti ogni passaggio.',
      },
    },
  },
  {
    id: 'instruments',
    picture: { src: '/images/hero/instruments.jpg' },
    words: {
      ro: {
        alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
        title: 'Instrumente moderne, mâini blânde.',
      },
      en: {
        alt: 'Close-up of the handpieces hanging from the dental unit’s arm',
        title: 'Modern instruments, gentle hands.',
      },
      de: {
        alt: 'Nahaufnahme der Handstücke am Arm der Behandlungseinheit',
        title: 'Moderne Instrumente, behutsame Hände.',
      },
      fr: {
        alt: 'Gros plan sur les instruments suspendus au bras de l’unité de soins',
        title: 'Des instruments modernes, des mains douces.',
      },
      it: {
        alt: 'Primo piano degli strumenti appesi al braccio del riunito',
        title: 'Strumenti moderni, mani delicate.',
      },
    },
  },
];
