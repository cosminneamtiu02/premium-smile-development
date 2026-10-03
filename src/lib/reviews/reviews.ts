import type { Locale } from '../../i18n/locales';
import type { ImagePath } from '../image-path/image-path';
import type { Initials } from '../initials/initials';
import type { Rating } from '../rating/rating';
import type { IsoDate } from '../time-ago/time-ago';

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
// THE REAL LIST (owner, 2026-09-30: "start filling the page with custom data
// … reviews"). The rows below are the clinic's OWN Google reviews, read off
// its Google Maps listing on the owner's dispatch the same day — the stars,
// the day each was posted (Google's own timestamp) and the reviewer's name
// and picture as Google shows them. THE TEXT is the patient's, in the
// language they wrote it, with four kinds of change and no other:
//   · spelling, diacritics and punctuation corrected (owner: "correct
//     spelling obviously") — a sentence break restored where the original's
//     line break was, even after an emoji, so a screen reader does not run
//     two sentences into one (G2 a11y, 2026-09-30);
//   · every phrase the CMSR's advertising guide bans CUT, and each cut
//     marked „[…]" (owner, 2026-09-30, choosing "trim with …" over "word for
//     word"): the guide (Decizia 4/2CN/2025, in force 2025-07-01) allows a
//     clinic to show its own patients' testimonials but makes the clinic
//     answerable for their content, and it lists superlatives („cea mai
//     bună", „optim") among the banned wording. A cut takes the smallest span
//     that leaves the sentence grammatical, never a word the guide allows —
//     and with the brackets silent, as screen readers keep them by default,
//     every cut sentence still reads whole;
//   · a sentence the patient wrote in ANOTHER language is given in the
//     page's language (WCAG 3.1.2 — a Romanian voice mispronounces an
//     English sentence); each such sentence is a draft, flagged;
//   · the EN/DE/FR/IT texts are DRAFTED by Claude from the corrected, cut
//     original — flagged, like every other drafted string on this site.
// THE TITLE is not the patient's: it names the ONE characteristic that review
// is about, in the clinic's words, and no two rows share one (owner: "i do not
// want any repetitions or repeted characteristics"); a review too short to
// carry a characteristic of its own is left out rather than given a copy of
// another's (one of the owner's ten was a single line whose only
// characteristic was the superlative the guide bans). Titles AND quotes are
// read by tests/unit/cmsr-scan.test.ts, so a superlative left in the next
// review fails CI instead of shipping. HOW THE ROWS WERE READ: four from the
// listing itself, headless and signed out, before Google answered the rest
// with a CAPTCHA; the others from the links the owner sent on 2026-10-01 (a
// contributor's page filtered to this clinic, one request each — never the
// owner's own browser), which also carry Google's exact timestamps. Of the
// ten the owner first named, one was dropped by the rule above and one was
// swapped, on the owner's word, for another review; after a preview the
// owner took out the two longest (2026-10-01: "remove too long reviws …
// jsut to see how it looks without them" → "they look perfect now"), so
// SEVEN ship. THE OWNER'S GATES
// STAND (board D15): the patients' consent to show their names and pictures
// (GDPR — a name beside a dental review is health data, art. 9). NO INVENTED
// REVIEW EXISTS ANYWHERE (owner, 2026-10-01: "all fabricated ones need to be
// dropped"): the six fabricated demo rows that stood in for this list until
// the real rows landed are deleted, and the band's and the card's stories and
// tests render THIS list — D15's "fabricated demo copy never enters this
// file", widened to the whole repository.
//
// NEWEST FIRST, the deck's order (tests/unit/reviews-data.test.ts pins it):
// `postedOn` is the day the review appeared on Google, and the card says how
// long ago that was through lib/time-ago — computed at build, never stored as
// words.
//
// PICTURES live under public/images/ — the folder the export optimizer scans
// (§11). The site's own portraits go in public/images/reviews/ BY CONVENTION,
// which tests/unit/reviews-data.test.ts enforces on the shipped list together
// with the file's existence (so a typo fails CI instead of shipping a broken
// disc), while the TYPE stops at §11's folder (lib/image-path). A
// reviewer's picture is the photograph they chose for their Google profile,
// cropped square at 256px (the largest width the 3rem disc can use, at three
// device pixels per CSS pixel, among §11's baked sizes); a reviewer whose
// Google picture is only a generated letter carries no picture here, and the
// card shows ui/Avatar's own two letters instead. A picture is DECORATIVE
// (its alt is empty): the name is printed on the card.
// TRIGGER DISCHARGED 2026-09-19 (hero lane, epic #103 — G3 typescript L1 /
// org T6): the template `/images/${string}` used to be spelled in four tiers
// — this row, ui/Avatar, sections/ReviewCard, the deck's ReviewSlide — and
// the next lane to type an image path was to promote it (§4's "byte-identical
// copies at N ≥ 3 → a dedicated promotion lane"). lib/hero-slides was that
// lane: the type is `ImagePath` in lib/image-path now, and all five point at it.

/** The translated part of one review — every locale, or it does not compile. */
export type ReviewWords = Readonly<{
  /** The card's heading: the ONE characteristic this review is about, in the clinic's words, e.g. „Explicații clare". */
  title: string;
  /** The quoted body — BARE text; the card adds locale-correct quotation marks itself (board D6). */
  text: string;
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
  /** The day the review appeared on Google — the card says how long ago, through lib/time-ago, at build. */
  postedOn: IsoDate;
  /** Optional portrait under public/images/ (decorative, alt='') — the site's own go in public/images/reviews/, a test-enforced convention. */
  picture?: Readonly<{ src: ImagePath }>;
  /** Title and text in all five locales. */
  words: Readonly<Record<Locale, ReviewWords>>;
}>;

/**
 * The clinic's Google reviews, NEWEST FIRST. Add a row here — the types refuse
 * a third initial, a 4.3, a missing language or a date without its dashes, and
 * tests/unit/reviews-data.test.ts checks what only a test can see (the picture
 * exists, the day is real and not in the future, the order, no two titles
 * alike).
 */
export const reviews: readonly Review[] = [
  {
    id: 'milcu-teodora-maria',
    name: 'Milcu Teodora-Maria',
    initials: 'MT',
    rating: 5,
    postedOn: '2026-05-04',
    picture: { src: '/images/reviews/milcu-teodora-maria.jpg' },
    words: {
      ro: {
        title: 'Empatie și implicare',
        text: 'Profesionalism, empatie, implicare! Recomand cu […] încredere!',
      },
      en: {
        title: 'Empathy and commitment',
        text: 'Professionalism, empathy, commitment! I recommend them with […] confidence!',
      },
      de: {
        title: 'Empathie und Engagement',
        text: 'Professionalität, Empathie, Engagement! Ich empfehle sie mit […] Überzeugung!',
      },
      fr: {
        title: 'Empathie et implication',
        text: 'Professionnalisme, empathie, implication ! Je recommande avec […] confiance !',
      },
      it: {
        title: 'Empatia e impegno',
        text: 'Professionalità, empatia, impegno! Consiglio con […] fiducia!',
      },
    },
  },
  {
    id: 'mirela-chirca',
    name: 'Mirela Chirca',
    initials: 'MC',
    rating: 5,
    postedOn: '2025-12-02',
    words: {
      ro: {
        title: 'Procedura, explicată clar',
        text: '[…] Aici am găsit profesionalitate, seriozitate, multă răbdare, ambient primitor, instrumente și tratament […] și o atenție […] la pacient, la fricile și anxietățile sale. Recomand cu încredere această clinică, sunt foarte mulțumită de Premium Smile. O recomand pe doamna doctor Oana Malea, […] empatică, care explică foarte clar procedura pe care o va face. Vă mulțumesc.',
      },
      en: {
        title: 'The procedure, clearly explained',
        text: '[…] Here I found professionalism, seriousness, a lot of patience, a welcoming atmosphere, instruments and treatment […] and […] attention to the patient, to their fears and anxieties. I recommend this clinic with confidence; I am very satisfied with Premium Smile. I recommend Dr. Oana Malea, […] empathetic, who explains very clearly the procedure she is going to do. Thank you.',
      },
      de: {
        title: 'Die Behandlung, klar erklärt',
        text: '[…] Hier fand ich Professionalität, Seriosität, viel Geduld, eine einladende Atmosphäre, Instrumente und Behandlung […] und eine […] Aufmerksamkeit für den Patienten, für seine Ängste und Sorgen. Ich empfehle diese Klinik mit Überzeugung und bin mit Premium Smile sehr zufrieden. Ich empfehle Frau Dr. Oana Malea, […] einfühlsam, die sehr klar erklärt, welche Behandlung sie vornehmen wird. Vielen Dank.',
      },
      fr: {
        title: 'L’intervention, clairement expliquée',
        text: '[…] J’ai trouvé ici du professionnalisme, du sérieux, beaucoup de patience, une ambiance accueillante, des instruments et des soins […] et une attention […] portée au patient, à ses peurs et à ses angoisses. Je recommande cette clinique avec confiance, je suis très satisfaite de Premium Smile. Je recommande le docteur Oana Malea, […] empathique, qui explique très clairement l’intervention qu’elle va réaliser. Merci.',
      },
      it: {
        title: 'La procedura, spiegata con chiarezza',
        text: '[…] Qui ho trovato professionalità, serietà, tanta pazienza, un ambiente accogliente, strumenti e trattamento […] e un’attenzione […] al paziente, alle sue paure e ansie. Consiglio con fiducia questa clinica, sono molto soddisfatta di Premium Smile. Consiglio la dottoressa Oana Malea, […] empatica, che spiega molto chiaramente la procedura che eseguirà. Grazie.',
      },
    },
  },
  {
    id: 'alexandra-cordos',
    name: 'Alexandra Cordos',
    initials: 'AC',
    rating: 5,
    postedOn: '2025-09-03',
    picture: { src: '/images/reviews/alexandra-cordos.jpg' },
    words: {
      ro: {
        title: 'De la recepție până în cabinet',
        text: 'Experiența mea la Clinica Premium Smile este una […]. Începând cu personalul de la recepție, asistentele și minunata doamnă Dr. Malea, toți au dat dovadă de profesionalism. Recomand cu tot dragul această clinică. Alexandra',
      },
      en: {
        title: 'From reception to the treatment room',
        text: 'My experience at the Premium Smile Clinic is […]. Starting with the reception staff, the nurses and the wonderful Dr. Malea, everyone showed professionalism. I wholeheartedly recommend this clinic. Alexandra',
      },
      de: {
        title: 'Vom Empfang bis ins Behandlungszimmer',
        text: 'Meine Erfahrung in der Klinik Premium Smile ist […]. Vom Empfangspersonal über die Assistentinnen bis zur wunderbaren Frau Dr. Malea haben alle Professionalität gezeigt. Ich empfehle diese Klinik von Herzen. Alexandra',
      },
      fr: {
        title: 'De l’accueil jusqu’au cabinet',
        text: 'Mon expérience à la clinique Premium Smile est […]. Du personnel de l’accueil aux assistantes, jusqu’à la merveilleuse docteure Malea, tous ont fait preuve de professionnalisme. Je recommande cette clinique de tout cœur. Alexandra',
      },
      it: {
        title: 'Dalla reception allo studio',
        text: 'La mia esperienza alla clinica Premium Smile è […]. A cominciare dal personale della reception, le assistenti e la meravigliosa dottoressa Malea, tutti hanno dimostrato professionalità. Consiglio di cuore questa clinica. Alexandra',
      },
    },
  },
  {
    id: 'mirela-schiopu',
    name: 'Mirela Schiopu',
    initials: 'MS',
    rating: 5,
    postedOn: '2024-04-25',
    words: {
      ro: {
        title: 'Atenție la detalii',
        text: 'Experiența mea cu medicul stomatolog Oana Malea a fost […]. Profesionalismul său și atenția acordată detaliilor au fost remarcabile. Atmosfera din cabinet este relaxantă și prietenoasă, iar abordarea sa empatică a făcut întregul proces mai plăcut. Recomand cu încredere acest medic tuturor celor în căutarea unei experiențe stomatologice […].',
      },
      en: {
        title: 'Attention to detail',
        text: 'My experience with dentist Oana Malea was […]. Her professionalism and attention to detail were remarkable. The atmosphere in the office is relaxing and friendly, and her empathetic approach made the whole process more pleasant. I recommend this doctor with confidence to anyone looking for a […] dental experience.',
      },
      de: {
        title: 'Aufmerksamkeit für Details',
        text: 'Meine Erfahrung mit der Zahnärztin Oana Malea war […]. Ihre Professionalität und ihre Aufmerksamkeit für Details waren bemerkenswert. Die Atmosphäre in der Praxis ist entspannt und freundlich, und ihre einfühlsame Art hat den ganzen Ablauf angenehmer gemacht. Ich empfehle diese Ärztin mit Überzeugung allen, die eine […] zahnärztliche Erfahrung suchen.',
      },
      fr: {
        title: 'L’attention aux détails',
        text: 'Mon expérience avec la dentiste Oana Malea a été […]. Son professionnalisme et son attention aux détails ont été remarquables. L’atmosphère du cabinet est détendue et chaleureuse, et son approche empathique a rendu tout le processus plus agréable. Je recommande ce médecin avec confiance à tous ceux qui recherchent une expérience dentaire […].',
      },
      it: {
        title: 'Attenzione ai dettagli',
        text: 'La mia esperienza con la dentista Oana Malea è stata […]. La sua professionalità e l’attenzione ai dettagli sono state notevoli. L’atmosfera nello studio è rilassante e amichevole, e il suo approccio empatico ha reso l’intero percorso più piacevole. Consiglio con fiducia questa dottoressa a chiunque cerchi un’esperienza odontoiatrica […].',
      },
    },
  },
  {
    id: 'dani-popa',
    name: 'Dani Popa',
    initials: 'DP',
    rating: 5,
    postedOn: '2024-03-18',
    picture: { src: '/images/reviews/dani-popa.jpg' },
    words: {
      ro: {
        title: 'Instrumente și tratamente noi',
        text: 'Lucrez cu dr. Oana Malea de 2 ani, ador experiența, nu am nimic de reproșat. Se lucrează foarte profesional, iar instrumentele și tratamentele folosite sunt noi […].',
      },
      en: {
        title: 'New instruments and treatments',
        text: 'I have been a patient of Dr. Oana Malea for 2 years, I love the experience and have nothing to complain about. The work is done very professionally, and the instruments and treatments used are new […].',
      },
      de: {
        title: 'Neue Instrumente und Behandlungen',
        text: 'Ich bin seit 2 Jahren bei Dr. Oana Malea in Behandlung, ich liebe die Erfahrung und habe nichts zu beanstanden. Es wird sehr professionell gearbeitet, und die verwendeten Instrumente und Behandlungen sind neu […].',
      },
      fr: {
        title: 'Des instruments et des soins nouveaux',
        text: 'Cela fait 2 ans que je consulte le Dr Oana Malea, j’adore l’expérience et je n’ai rien à redire. Le travail est très professionnel, et les instruments et les soins utilisés sont nouveaux […].',
      },
      it: {
        title: 'Strumenti e trattamenti nuovi',
        text: 'Da 2 anni sono in cura presso la dottoressa Oana Malea, adoro l’esperienza e non ho nulla da ridire. Si lavora in modo molto professionale, e gli strumenti e i trattamenti usati sono nuovi […].',
      },
    },
  },
  {
    id: 'radu-mladen',
    name: 'Radu Mladen',
    initials: 'RM',
    rating: 5,
    postedOn: '2024-03-15',
    words: {
      ro: {
        title: 'Același medic de zece ani',
        text: 'Oana este medicul meu stomatolog de aproximativ 10 ani […]. În primul rând, m-a ajutat să scap de teama clasică, specifică celor din generația mea, de a merge la stomatolog. Mai mult de atât, am și 2 implanturi acum 😁. Apreciez faptul că se perfecționează constant, este comunicativă și punctuală. Rămân fanul ei și în următorii 10 ani 🤝',
      },
      en: {
        title: 'The same dentist for ten years',
        text: 'Oana has been my dentist for about 10 years […]. First of all, she helped me get rid of the classic fear of going to the dentist, typical of my generation. On top of that, I now have 2 implants 😁. I appreciate that she keeps improving and that she is communicative and punctual. I’ll stay her fan for the next 10 years too 🤝',
      },
      de: {
        title: 'Seit zehn Jahren dieselbe Zahnärztin',
        text: 'Oana ist seit etwa 10 Jahren meine Zahnärztin […]. Vor allem hat sie mir geholfen, die klassische Angst vor dem Zahnarztbesuch loszuwerden, die für meine Generation typisch ist. Außerdem habe ich jetzt 2 Implantate 😁. Ich schätze, dass sie sich ständig weiterbildet, kommunikativ und pünktlich ist. Ich bleibe auch in den nächsten 10 Jahren ihr Fan 🤝',
      },
      fr: {
        title: 'La même dentiste depuis dix ans',
        text: 'Oana est ma dentiste depuis environ 10 ans […]. Avant tout, elle m’a aidé à me débarrasser de la peur classique d’aller chez le dentiste, typique de ma génération. En plus, j’ai maintenant 2 implants 😁. J’apprécie qu’elle se perfectionne constamment, qu’elle soit communicative et ponctuelle. Je reste son fan pour les 10 prochaines années 🤝',
      },
      it: {
        title: 'La stessa dentista da dieci anni',
        text: 'Oana è la mia dentista da circa 10 anni […]. Prima di tutto, mi ha aiutato a liberarmi della classica paura di andare dal dentista, tipica della mia generazione. In più, ora ho anche 2 impianti 😁. Apprezzo che si aggiorni costantemente, che sia comunicativa e puntuale. Resto un suo fan anche per i prossimi 10 anni 🤝',
      },
    },
  },
  {
    id: 'alin-tapai',
    name: 'Alin Tapai',
    initials: 'AT',
    rating: 5,
    postedOn: '2024-03-14',
    words: {
      ro: {
        title: 'Grijă și pentru cei mici',
        text: 'Sunt foarte mulțumit de calitatea lucrărilor, de modalitatea în care tratează pacienții, aici menționez că am fost eu, cât și cele două fetițe (care nu s-au plictisit până au intrat pe rând, au avut de colorat, citit sau desene animate), cât și de profesionalism […]. Recomand cu toată încrederea!',
      },
      en: {
        title: 'Care for the little ones too',
        text: 'I am very satisfied with the quality of the work and with the way they treat patients. I was there with my two little girls, who were not bored until their turn came: they had coloring books, things to read or cartoons. I am just as satisfied with the professionalism […]. I recommend them with full confidence!',
      },
      de: {
        title: 'Auch an die Kleinen gedacht',
        text: 'Ich bin sehr zufrieden mit der Qualität der Arbeit und mit der Art, wie die Patienten behandelt werden. Ich war mit meinen zwei kleinen Töchtern dort, und sie haben sich nicht gelangweilt, bis sie an der Reihe waren: Es gab etwas zum Ausmalen, zum Lesen oder Zeichentrickfilme. Ebenso zufrieden bin ich mit der Professionalität […]. Ich empfehle sie mit vollem Vertrauen!',
      },
      fr: {
        title: 'Les petits aussi sont bien accueillis',
        text: 'Je suis très satisfait de la qualité du travail et de la façon dont ils traitent les patients. J’y suis allé avec mes deux petites filles, qui ne se sont pas ennuyées en attendant leur tour : elles avaient de quoi colorier, lire ou regarder des dessins animés. Je suis tout aussi satisfait du professionnalisme […]. Je recommande en toute confiance !',
      },
      it: {
        title: 'Un pensiero anche per i più piccoli',
        text: 'Sono molto soddisfatto della qualità del lavoro e del modo in cui trattano i pazienti. Ci sono stato con le mie due bambine, che non si sono annoiate fino al loro turno: avevano da colorare, da leggere o cartoni animati. Sono altrettanto soddisfatto della professionalità […]. Consiglio con tutta fiducia!',
      },
    },
  },
];
