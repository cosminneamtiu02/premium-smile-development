import type { Locale } from '../../i18n/locales';
import type { ImagePath } from '../image-path/image-path';
import type { Initials } from '../initials/initials';
import type { Rating } from '../rating/rating';

// lib/reviews — THE list the reviews deck is populated from at build time
// (owner brief 2026-09-10: "populate it from a list … static, no call to any
// server … a dumb component populated at compile time"). Site DATA in §4's
// foundation ring, the lib/clinic precedent: one file every consumer reads,
// nothing fetched, nothing mutated.
//
// WHY A TYPESCRIPT MODULE AND NOT reviews.json (board D2, owner fb-434). A JSON
// import is typed as plain `string` and `number`, so nothing could stop a
// three-letter monogram or a 4.3. Here every row is checked against
// lib/initials' `Initials` (two capitals) and lib/rating's `Rating` (eleven
// half-steps) THE MOMENT IT IS TYPED — a red squiggle in the editor, a failed
// `tsc` in CI — which is the earliest "error" the owner asked for. The
// annotation types each row contextually, so a wrong literal is reported ON
// ITS OWN LINE; an `as const satisfies` spelling would have typed the empty
// list as `readonly []` and every consumer's element as `never`.
//
// FACTS AND WORDS IN ONE TYPED ROW (board D2, amended at build time — the
// planner's call inside the owner's "fully go with your recommendations"). A
// row carries what is the same in every language — the id, the name (a proper
// noun), the monogram, the rating, the picture path — AND the translated
// content: `words` is a Record over the five locales, so a review with a
// missing German title is a COMPILE error, the same guarantee the message
// files get from tests/unit/translation-parity.test.ts. The words were first
// planned as `home.reviews.items.<id>.*` message keys; that shape was dropped
// because Storybook and the tests could then only render a demo review by
// putting fabricated copy INTO the shipped message bundle, and the parity test
// cannot tie an id's keys to the row that needs them. Reviews are CONTENT
// (§15.17 — the owner's hands), the way blog posts are content in MDX rather
// than in the message files; the band's own control labels (region name,
// prev/next, the slide and rating formats) stay in `home.reviews.*` where UI
// strings belong.
//
// THE LIST SHIPS EMPTY (board D15, owner fb-446). The twelve reviews the old
// site displayed were fabricated demo copy and never enter this file; the
// owner supplies REAL reviews, each with the patient's written consent
// (a name + a procedure is health data, GDPR art. 9) and the CMSR testimonial
// check (§15.18's consumer gate). UNTIL THE LIST HAS ROWS, THE BAND SHOWS
// THE DEMO ROWS BELOW (owner, 2026-09-20 — the hero lane's round 4 put the
// band on Home under the map over three labelled placeholders; round 5 the
// same day: "bring the 5 examples story from storybook as demo on home
// page"): `demoReviews`, the six rows the Storybook stories always had,
// of which the band shows the first five. THAT REVERSES D15's "never enter
// this file" FOR THE DEMO ROWS ON THE OWNER'S WORD — fabricated testimonials
// under fabricated names now ship in the export (the interim GitHub Pages
// host is public, noindex) — and it is flagged TODO(owner) on the export:
// consented real reviews must replace them before launch. The moment
// `reviews` has one row, the band drops them on its own (ReviewsCarousel.tsx,
// AN EMPTY LIST). The stories import the same six rows, so the workbench and
// the page cannot drift apart.
//
// PICTURES live under public/images/ — the folder the export optimizer scans
// (§11). The site's own portraits go in public/images/reviews/ BY CONVENTION,
// which tests/unit/reviews-data.test.ts enforces on the shipped list together
// with the file's existence (so a typo fails CI instead of shipping a broken
// disc), while the TYPE stops at §11's folder — a story may then carry a
// committed demo portrait from public/images/demo/ without a cast (owner
// 2026-09-12: the deck's examples alternate photograph and letters). A
// picture is DECORATIVE (its alt is empty): the name is printed on the card.
// TRIGGER DISCHARGED 2026-09-19 (hero lane, epic #103 — G3 typescript L1 /
// org T6): the template `/images/${string}` used to be spelled in four tiers
// — this row, ui/Avatar, sections/ReviewCard, the deck's ReviewSlide — and
// the next lane to type an image path was to promote it (§4's "byte-identical
// copies at N ≥ 3 → a dedicated promotion lane"). lib/hero-slides was that
// lane: the type is `ImagePath` in lib/image-path now, and all five point at it.

/** The translated part of one review — every locale, or it does not compile. */
export type ReviewWords = Readonly<{
  /** The card's heading, e.g. „Încrederea regăsită". */
  title: string;
  /** The quoted body — BARE text; the card adds locale-correct quotation marks itself (board D6). */
  text: string;
  /** The procedure, e.g. „Fațete dentare" — the card shouts it in mono via CSS. */
  procedure: string;
}>;

export type Review = Readonly<{
  /** Stable, kebab-case, dot-free — the deck's React key and the aria-labelledby seed. */
  id: string;
  /** The patient's name as they consented to have it shown — locale-invariant. */
  name: string;
  /** The monogram shown when there is no picture, or when the picture fails to load. */
  initials: Initials;
  /** Whole or half stars, 0 to 5. */
  rating: Rating;
  /** Optional portrait under public/images/ (decorative, alt='') — the site's own go in public/images/reviews/, a test-enforced convention. */
  picture?: Readonly<{ src: ImagePath }>;
  /** Title, text and procedure in all five locales. */
  words: Readonly<Record<Locale, ReviewWords>>;
}>;

/**
 * The owner's list. Add rows here — the types refuse a third initial, a 4.3 or
 * a missing language, and tests/unit/reviews-data.test.ts checks what only the
 * file system knows (the picture exists) and what a cast could smuggle past
 * the compiler.
 */
export const reviews: readonly Review[] = [];

/**
 * The three committed DEMO portraits — synthetic silhouettes under
 * public/images/demo/, the PersonnelCard lane's fixtures — standing in for
 * reviewer photographs, which are the owner's §11 gate. Every OTHER row
 * carries one, so the deck shows the two faces side by side: a photograph,
 * then two letters, then a photograph (owner 2026-09-12: "the image/name
 * initials to alternate"). Under `npm run test` the optimizer's width variants
 * may not exist and those discs fall back to the letters — the atom's own belt
 * firing, not a broken story; the built Storybook and the baselines carry the
 * portraits.
 */
const PORTRAIT_1 = { src: '/images/demo/portrait-1.jpg' } as const;
const PORTRAIT_2 = { src: '/images/demo/portrait-2.jpg' } as const;
const PORTRAIT_3 = { src: '/images/demo/portrait-3.jpg' } as const;

/**
 * Six DEMO reviews (see the header). Ratings cover the halves ui/StarRating
 * draws — 5, 4.5, 4 and 3.5 — and rows one, three and five carry a portrait,
 * so every disc face alternates with the next.
 */
/**
 * THE SIX DEMO ROWS the Storybook stories always rendered — moved here on
 * 2026-09-20 (owner, the hero lane's round 5). The Home band shows the
 * first FIVE (the stories' "Five") while `reviews` above is empty; the
 * first real row retires them by itself. RO/EN are the old site's own
 * fabricated testimonials, DE/FR/IT demo drafts. TODO(owner): fabricated
 * copy on the public site — replace with consented real reviews before
 * launch (lib/reviews' THE LIST SHIPS EMPTY paragraph).
 */
export const demoReviews: readonly Review[] = [
  {
    id: 'ana-petrescu',
    name: 'Ana Petrescu',
    initials: 'AP',
    rating: 5,
    picture: PORTRAIT_1,
    words: {
      ro: {
        title: 'Copiii îmi cer să mergem',
        text: 'Doi copii, zero crize. Camera pediatrică și personalul fac fiecare vizită să pară o aventură.',
        procedure: 'Pacient familie',
      },
      en: {
        title: 'My kids actually ask to go',
        text: 'Two children, zero tantrums. The pediatric room and the staff make every visit feel like an adventure.',
        procedure: 'Family patient',
      },
      de: {
        title: 'Meine Kinder wollen sogar hin',
        text: 'Zwei Kinder, kein Theater. Das Kinderzimmer und das Team machen jeden Besuch zu einem Abenteuer.',
        procedure: 'Familienbehandlung',
      },
      fr: {
        title: 'Mes enfants demandent à y aller',
        text: 'Deux enfants, aucune crise. La salle pédiatrique et l’équipe font de chaque visite une aventure.',
        procedure: 'Patient famille',
      },
      it: {
        title: 'I bambini chiedono di andarci',
        text: 'Due bambini, zero capricci. La sala pediatrica e il personale rendono ogni visita un’avventura.',
        procedure: 'Paziente famiglia',
      },
    },
  },
  {
    id: 'cristian-voicu',
    name: 'Cristian Voicu',
    initials: 'CV',
    rating: 5,
    words: {
      ro: {
        title: 'Au văzut imaginea de ansamblu',
        text: 'Alte clinici mi-au dat un preț. Premium Smile mi-a dat un plan. Trei ani mai târziu, gura mea este sănătoasă.',
        procedure: 'Plan complet',
      },
      en: {
        title: 'They saw the whole picture',
        text: 'Other clinics gave me a price. Premium Smile gave me a plan. Three years later, my mouth is healthy.',
        procedure: 'Full mouth plan',
      },
      de: {
        title: 'Sie haben das Ganze gesehen',
        text: 'Andere Praxen nannten mir einen Preis. Premium Smile gab mir einen Plan. Drei Jahre später ist mein Mund gesund.',
        procedure: 'Gesamtbehandlungsplan',
      },
      fr: {
        title: 'Ils ont vu l’ensemble',
        text: 'D’autres cliniques m’ont donné un prix. Premium Smile m’a donné un plan. Trois ans plus tard, ma bouche est saine.',
        procedure: 'Plan complet',
      },
      it: {
        title: 'Hanno visto il quadro completo',
        text: 'Altre cliniche mi hanno dato un prezzo. Premium Smile mi ha dato un piano. Tre anni dopo, la mia bocca è sana.',
        procedure: 'Piano completo',
      },
    },
  },
  {
    // THE GERMAN STRESS ROW (§8.4): the longest body in the deck by a wide
    // margin, with two compounds that cannot break at a space. It is what
    // decides whether the stage's tallest card still fits its neighbours.
    id: 'bogdan-ene',
    name: 'Bogdan Ene',
    initials: 'BE',
    rating: 4.5,
    picture: PORTRAIT_2,
    words: {
      ro: {
        title: 'Fără durere, chiar și la tratamentul de canal',
        text: 'Sincer, mă așteptam la ce e mai rău. Mi-au explicat fiecare minut, m-au ținut anesteziat și am plecat fără pic de durere.',
        procedure: 'Tratament canal',
      },
      en: {
        title: 'Painless, even the root canal',
        text: 'Honestly, I expected the worst. They walked me through every minute, kept me numb, and I left without a single ache.',
        procedure: 'Root canal',
      },
      de: {
        title: 'Schmerzfrei, sogar bei der Wurzelkanalbehandlung',
        text: 'Ehrlich gesagt hatte ich mit dem Schlimmsten gerechnet. Die einzelnen Behandlungsschritte wurden mir in aller Ruhe erklärt, die Betäubung hielt durchgehend, und am nächsten Morgen kam sogar noch ein Kontrollanruf aus der Praxis.',
        procedure: 'Wurzelkanalbehandlung',
      },
      fr: {
        title: 'Sans douleur, même le traitement de canal',
        text: 'Honnêtement, je m’attendais au pire. On m’a expliqué chaque minute, l’anesthésie a tenu, et je suis reparti sans la moindre douleur.',
        procedure: 'Traitement de canal',
      },
      it: {
        title: 'Senza dolore, anche la devitalizzazione',
        text: 'Sinceramente mi aspettavo il peggio. Mi hanno spiegato ogni minuto, l’anestesia ha tenuto e sono uscito senza un dolore.',
        procedure: 'Devitalizzazione',
      },
    },
  },
  {
    id: 'ioana-stan',
    name: 'Ioana Stan',
    initials: 'IS',
    rating: 4.5,
    words: {
      ro: {
        title: 'Ca o persoană diferită',
        text: 'Optsprezece luni de aligneri transparenți, controale săptămânale, zero presiune. Alinierea și ocluzia sunt în sfârșit corecte.',
        procedure: 'Ortodonție',
      },
      en: {
        title: 'Like a different person',
        text: 'Eighteen months of clear aligners, weekly check-ins, zero pressure. My alignment and bite are finally right.',
        procedure: 'Orthodontics',
      },
      de: {
        title: 'Wie ein anderer Mensch',
        text: 'Achtzehn Monate transparente Schienen, wöchentliche Kontrollen, kein Druck. Zahnstellung und Biss stimmen endlich.',
        procedure: 'Kieferorthopädie',
      },
      fr: {
        title: 'Comme une autre personne',
        text: 'Dix-huit mois de gouttières transparentes, des contrôles chaque semaine, aucune pression. L’alignement et l’occlusion sont enfin corrects.',
        procedure: 'Orthodontie',
      },
      it: {
        title: 'Come una persona diversa',
        text: 'Diciotto mesi di allineatori trasparenti, controlli settimanali, zero pressione. Allineamento e occlusione sono finalmente giusti.',
        procedure: 'Ortodonzia',
      },
    },
  },
  {
    id: 'diana-munteanu',
    name: 'Diana Munteanu',
    initials: 'DM',
    rating: 4,
    picture: PORTRAIT_3,
    words: {
      ro: {
        title: 'O reparație mică a schimbat totul',
        text: 'Doar un dinte din față ciobit, dar mă deranja de ani buni. Douăzeci de minute aici și nu mai disting care a fost reparat.',
        procedure: 'Lipire estetică',
      },
      en: {
        title: 'A small fix that changed everything',
        text: 'Just one chipped front tooth, but it bothered me for years. Twenty minutes here and I cannot tell which one was repaired.',
        procedure: 'Cosmetic bonding',
      },
      de: {
        title: 'Eine kleine Korrektur, die alles verändert hat',
        text: 'Nur ein abgesplitterter Schneidezahn, der mich jahrelang gestört hat. Zwanzig Minuten hier, und ich erkenne nicht mehr, welcher es war.',
        procedure: 'Ästhetische Füllung',
      },
      fr: {
        title: 'Une petite réparation qui a tout changé',
        text: 'Une seule dent de devant ébréchée, mais elle me gênait depuis des années. Vingt minutes ici et je ne distingue plus laquelle a été réparée.',
        procedure: 'Collage esthétique',
      },
      it: {
        title: 'Una piccola riparazione ha cambiato tutto',
        text: 'Solo un dente davanti scheggiato, ma mi dava fastidio da anni. Venti minuti qui e non distinguo più quale sia stato riparato.',
        procedure: 'Ricostruzione estetica',
      },
    },
  },
  {
    id: 'stefan-radu',
    name: 'Ștefan Radu',
    initials: 'ȘR',
    rating: 3.5,
    words: {
      ro: {
        title: 'Rapid, lin, prietenos',
        text: 'Toate cele patru măsele de minte într-o dimineață. Instrucțiuni clare, mâini blânde și un telefon de control a doua zi.',
        procedure: 'Măsele de minte',
      },
      en: {
        title: 'Smooth, swift, friendly',
        text: 'All four wisdom teeth in one morning. Clear instructions, gentle hands, and a follow-up call the next day.',
        procedure: 'Wisdom teeth',
      },
      de: {
        title: 'Schnell, ruhig, freundlich',
        text: 'Alle vier Weisheitszähne an einem Vormittag. Klare Anweisungen, sanfte Hände und am nächsten Tag ein Kontrollanruf.',
        procedure: 'Weisheitszähne',
      },
      fr: {
        title: 'Rapide, calme, aimable',
        text: 'Les quatre dents de sagesse en une matinée. Des consignes claires, des gestes doux et un appel de suivi le lendemain.',
        procedure: 'Dents de sagesse',
      },
      it: {
        title: 'Rapido, calmo, gentile',
        text: 'Tutti e quattro i denti del giudizio in una mattina. Istruzioni chiare, mani delicate e una telefonata di controllo il giorno dopo.',
        procedure: 'Denti del giudizio',
      },
    },
  },
];
