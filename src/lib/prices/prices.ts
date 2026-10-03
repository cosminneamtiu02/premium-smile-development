import type { Locale } from '../../i18n/locales';

// lib/prices — THE tariff: the eleven categories of the clinic's printed price
// list, their 102 rows, and every name in all five languages. Site DATA in §4's
// foundation ring (the lib/clinic and lib/reviews precedents): one file every
// consumer reads, nothing fetched, nothing mutated, React-free (fenced by
// tests/unit/lib-react-free.test.ts). The Services band is „a dumb component
// that gets populated" (board fb-459): the PAGE imports this list, picks the
// visitor's language and formats the amounts; the band never sees this file.
//
// WHY A TYPESCRIPT MODULE AND NOT prices.json (board Q3, owner fb-465). A JSON
// import is typed as plain `string` and `number`, so nothing could stop a row
// whose German name is missing, a misspelled key, or `lei: 4.99`. One type
// annotation on top gives the file JSON's shape AND the compiler's checks:
// `Record<Locale, string>` requires all five languages, so a missing German
// name is a red squiggle in the editor and a failed `tsc` in CI — the same
// guarantee the message files get from tests/unit/translation-parity.test.ts,
// which a data id could never have obtained from them (that test checks the
// five files against EACH OTHER, never against this list).
//
// WORDS INLINE, NOT MESSAGE KEYS (board §2.2 option B, owner fb-465). A price
// row is CONTENT — the way blog posts are content in MDX and reviews are
// content in lib/reviews (§15.19: "facts AND the five-language words per row")
// — so the name travels WITH its number instead of in five JSON files that
// know nothing about it. One item is then one object literal read top to
// bottom, and adding a treatment touches one file instead of six. The
// `services` namespace keeps only what is not a fact about a treatment: the
// page title, the menu's landmark name and the amount sentence. (It kept a
// „back to categories" label too until the owner's 2026-09-14 round struck the
// link — „it has no place here" — and the key left the five message files with
// it.)
//
// AN ARRAY, NOT AN OBJECT KEYED BY ID (board §2.1). Display order has to be
// designed, not inherited from JavaScript's insertion-order rules for string
// keys: the menu order and the card order both come from this array, and
// reordering the page means moving lines in this file.
//
// WHERE THE ROMANIAN COMES FROM. The 102 rows are TRANSCRIBED from the owner's
// printed „LISTĂ DE PREȚURI" (photograph, 2026-09-13; the transcription table
// with the per-row checks is board §2b), paired name-to-price BY ORDER inside
// each section, every section's two counts matched. The sheet's own spelling is
// inconsistent („Mentinere periodica", „Extractie implant") and carries a few
// typos („Augumentare", „prodontotici", „oror-sinusală"); the site's Romanian
// ships with FULL DIACRITICS and the words corrected (board N4, owner fb-454).
//
// THE OTHER FOUR LANGUAGES ARE DRAFTS (§15.17). EN/DE/FR/IT names, the eleven
// short category names and ALL ELEVEN EYEBROWS were written by Claude on the
// owner's dispatch as the terminology a British/German/French/Italian dental
// clinic prints on its own tariff, and are FLAGGED FOR THE OWNER'S
// CONFIRMATION — the same shape as the reviews lane's drafted control labels
// (§15.19). Eight of the eyebrows are younger than the rest: the field became
// REQUIRED on the owner's pack round of 2026-09-14 („why in categories is it
// only in some places heading + eyebrow. i want that in all of them"), so the
// eight categories that had none were given one in that round — including
// their Romanian, which everywhere else in this file is the owner's own sheet.
// They carry exactly the same confirm-me status as the four other languages.
// Brand names (Dentium, Bredent), eponyms (Khoury, Kemeny) and
// abbreviations (PRGF, PMMA, DCR) are deliberately NOT translated.
//
// THE FIVE UNCERTAIN ROWS carry a `TODO(owner)` line of their own (board §2c.4,
// owner fb-455 „decide for me"): the photograph is skewed and its price column
// sits about one row lower than the names in places, so those five amounts are
// recorded AS READ with the doubt travelling beside the number. The first
// rendered page is the cheap check — a page reads against the sheet far better
// than a transcription table does.
//
// ONE `lei: number`, AND THE RECORDED UPGRADE PATH (board §2.3 + its round-2
// rider). All 102 amounts on the sheet are fixed whole-RON figures — no „de
// la", no ranges, no „la cerere" — so v1 ships the plainest honest shape: one
// positive integer per row and ONE sentence key. When the first non-fixed row
// appears, `lei: number` becomes a discriminated union
// (`{ kind: 'fixed' | 'from' | 'range' | 'quote'; … }`) and the compiler then
// points at every place that must learn the new kind. Building it now would
// cost four sentences × five languages and a `switch` for cases that do not
// exist; building it later costs one small lane. The later cost is the one
// taken.
//
// WHAT THE TYPE DELIBERATELY CANNOT SAY — CMSR. There is no `oldPrice`, no
// `discount`, no `package`, and no free-text `note` that could smuggle one in.
// Since 2025-07-01 the CMSR advertising rules ban price promotions, vouchers
// and package framing on dental sites; a plain tariff is allowed. A
// strikethrough „was 800, now 600" is therefore not a design option here — the
// type makes it unexpressible rather than merely discouraged. The same rule
// governs the drafted eyebrows: descriptive, never superlative, never a
// promise.
//
// THIS FILE NEVER FORMATS (board §2.4). An amount is a NUMBER here and becomes
// a sentence exactly once, in the page, through the ICU key
// `services.prices.amount` = "{amount, number} RON" — so the digit grouping is
// the platform's (ro/de „1.300", en „1,300", fr „1 300", it „1300") and the
// unit word is the owner's. `Intl`'s own currency mode is unusable as-is: it
// prints a bare „L" in German and French and puts „lei" in FRONT in English.
// EUR on the foreign locales stays parked (§15.4); it would be a display-time
// decision (a rate, its date, a rounding rule), and the data stores lei only.
//
// UNITS LIVE INSIDE THE NAME (board §2c.1, §2.3 rider). Eight rows carry a unit
// („/ dinte / ședință", „per arcadă", „/ element", „/ hemiarcadă", „(per
// ședință)") and they keep it inside the name, in every language, exactly as
// the clinic words it. A `unit` field would force eight phrasings × five
// languages into a second vocabulary that only those eight rows would use.
//
// IDS ARE ENGLISH (board Q8, owner fb-461). A category id does four jobs at
// once — the card's `id` attribute, the menu link's `#href`, React's list key
// and the visible fragment in a shared URL — so it must be stable and URL-safe;
// English keeps `/de/services/#oral-surgery` consistent with `/services`
// itself, and fragments cost nothing to change later (search engines ignore
// them, no redirect is ever owed) if §15.3 decides localized slugs.

/** One string per locale — all five, or it does not compile. */
export type LocalizedName = Readonly<Record<Locale, string>>;

export type PriceItem = Readonly<{
  /** Stable English kebab-case id, unique within its category — the React key. */
  id: string;
  /** The treatment as the clinic names it, in all five languages. Units („/ dinte / ședință", „per arcadă") stay INSIDE the name. */
  name: LocalizedName;
  /** Whole lei, a positive integer — the page turns it into a sentence, never this file. */
  lei: number;
}>;

export type PriceCategory = Readonly<{
  /** Stable English kebab-case id: the card's DOM id, the menu link's `#href`, the React key. */
  id: string;
  /** SHORT name — the menu link AND the card heading say the same word (board N1). */
  name: LocalizedName;
  /**
   * The mono micro-label above the heading — the owner's „smart comment"
   * (board fb-453), and REQUIRED since their 2026-09-14 pack round: every card
   * wears one, so a category added without an eyebrow is a compile error here
   * rather than a card that quietly reads differently from its neighbours.
   * sections/PriceList's `PriceCategoryProps` requires it on the other side of
   * the walk for the same reason (CategoryCard.tsx, THE HEAD IS
   * sections/SectionHeading). It says what the one-word name cannot — what the
   * rows below it actually are — and it is bound by the CMSR rule this file's
   * header states: descriptive, never superlative, never a promise.
   */
  eyebrow: LocalizedName;
  items: readonly PriceItem[];
}>;

/**
 * The clinic's tariff, in printed order. Add or reorder rows HERE — the type
 * refuses a missing language, and tests/unit/prices-data.test.ts pins the
 * sheet's own counts (11 categories, 102 rows) plus what a cast could smuggle
 * past the compiler.
 */
export const priceCategories: readonly PriceCategory[] = [
  {
    id: 'consultations',
    name: {
      ro: 'Consultații',
      en: 'Consultations',
      de: 'Konsultationen',
      fr: 'Consultations',
      it: 'Visite',
    },
    eyebrow: {
      ro: 'Examinare clinică',
      en: 'Clinical examination',
      de: 'Klinische Untersuchung',
      fr: 'Examen clinique',
      it: 'Esame clinico',
    },
    items: [
      {
        id: 'primary',
        name: {
          ro: 'Consultație primară (simplă) – examinare clinică',
          en: 'Initial consultation (basic) – clinical examination',
          de: 'Erstkonsultation (einfach) – klinische Untersuchung',
          fr: 'Première consultation (simple) – examen clinique',
          it: 'Prima visita (semplice) – esame clinico',
        },
        lei: 200,
      },
      {
        id: 'specialist',
        name: {
          ro: 'Consultație specialist (ortodonție / implantologie / endodonție / protetică)',
          en: 'Specialist consultation (orthodontics / implantology / endodontics / prosthodontics)',
          de: 'Facharztkonsultation (Kieferorthopädie / Implantologie / Endodontie / Prothetik)',
          fr: 'Consultation spécialisée (orthodontie / implantologie / endodontie / prothèse)',
          it: 'Visita specialistica (ortodonzia / implantologia / endodonzia / protesi)',
        },
        lei: 250,
      },
    ],
  },
  {
    id: 'emergencies',
    name: {
      ro: 'Urgențe',
      en: 'Emergencies',
      de: 'Notfälle',
      fr: 'Urgences',
      it: 'Urgenze',
    },
    eyebrow: {
      ro: 'Drenaj și incizie',
      en: 'Drainage and incision',
      de: 'Drainage und Inzision',
      fr: 'Drainage et incision',
      it: 'Drenaggio e incisione',
    },
    items: [
      {
        id: 'drainage-single-root',
        name: {
          ro: 'Drenaj endodontic monoradicular',
          en: 'Endodontic drainage, single-rooted tooth',
          de: 'Endodontische Drainage, einwurzeliger Zahn',
          fr: 'Drainage endodontique, dent monoradiculée',
          it: 'Drenaggio endodontico, dente monoradicolato',
        },
        lei: 200,
      },
      {
        id: 'drainage-multi-root',
        name: {
          ro: 'Drenaj endodontic dinte pluriradicular',
          en: 'Endodontic drainage, multi-rooted tooth',
          de: 'Endodontische Drainage, mehrwurzeliger Zahn',
          fr: 'Drainage endodontique, dent pluriradiculée',
          it: 'Drenaggio endodontico, dente pluriradicolato',
        },
        lei: 200,
      },
      {
        id: 'abscess-incision-drainage',
        name: {
          ro: 'Incizie + drenaj abces vestibular',
          en: 'Incision and drainage of a vestibular abscess',
          de: 'Inzision und Drainage eines vestibulären Abszesses',
          fr: "Incision et drainage d'un abcès vestibulaire",
          it: 'Incisione e drenaggio di ascesso vestibolare',
        },
        lei: 200,
      },
    ],
  },
  {
    id: 'prophylaxis',
    name: {
      ro: 'Profilaxie',
      en: 'Prophylaxis',
      de: 'Prophylaxe',
      fr: 'Prophylaxie',
      it: 'Profilassi',
    },
    eyebrow: {
      ro: 'Igienizare și menținere',
      en: 'Cleaning and maintenance',
      de: 'Zahnreinigung und Erhaltung',
      fr: 'Nettoyage et maintenance',
      it: 'Igiene e mantenimento',
    },
    items: [
      {
        id: 'professional-cleaning',
        name: {
          ro: 'Igienizare profesională',
          en: 'Professional cleaning',
          de: 'Professionelle Zahnreinigung',
          fr: 'Nettoyage dentaire professionnel',
          it: 'Igiene dentale professionale',
        },
        lei: 350,
      },
      {
        id: 'professional-cleaning-recall',
        name: {
          ro: 'Igienizare profesională – recall la 3–6 luni',
          en: 'Professional cleaning – 3–6 month recall',
          de: 'Professionelle Zahnreinigung – Recall nach 3–6 Monaten',
          fr: 'Nettoyage dentaire professionnel – rappel à 3–6 mois',
          it: 'Igiene dentale professionale – richiamo a 3–6 mesi',
        },
        lei: 300,
      },
    ],
  },
  {
    id: 'aesthetics',
    name: {
      ro: 'Estetică dentară',
      en: 'Dental aesthetics',
      de: 'Zahnästhetik',
      fr: 'Esthétique dentaire',
      it: 'Estetica dentale',
    },
    eyebrow: {
      ro: 'Tratamente de albire',
      en: 'Whitening treatments',
      de: 'Aufhellungsbehandlungen',
      fr: 'Traitements de blanchiment',
      it: 'Trattamenti di sbiancamento',
    },
    items: [
      {
        id: 'whitening-lamp',
        name: {
          ro: 'Tratament albire dentară profesională cu lampă',
          en: 'Professional tooth whitening with lamp',
          de: 'Professionelle Zahnaufhellung mit Lampe',
          fr: 'Blanchiment dentaire professionnel à la lampe',
          it: 'Sbiancamento dentale professionale con lampada',
        },
        lei: 1300,
      },
      {
        id: 'whitening-laser',
        name: {
          ro: 'Tratament albire dentară profesională cu laser',
          en: 'Professional tooth whitening with laser',
          de: 'Professionelle Zahnaufhellung mit Laser',
          fr: 'Blanchiment dentaire professionnel au laser',
          it: 'Sbiancamento dentale professionale con laser',
        },
        lei: 1100,
      },
      {
        id: 'whitening-endodontic',
        name: {
          ro: 'Tratament albire endodontică / dinte / ședință',
          en: 'Endodontic whitening / tooth / session',
          de: 'Endodontische Aufhellung / Zahn / Sitzung',
          fr: 'Blanchiment endodontique / dent / séance',
          it: 'Sbiancamento endodontico / dente / seduta',
        },
        lei: 100,
      },
    ],
  },
  {
    id: 'restorative',
    name: {
      ro: 'Odontoterapie',
      en: 'Restorative dentistry',
      de: 'Zahnerhaltung',
      fr: 'Soins conservateurs',
      it: 'Conservativa',
    },
    eyebrow: {
      ro: 'Tratamente odontale',
      en: 'Conservative treatments',
      de: 'Konservierende Behandlungen',
      fr: 'Traitements conservateurs',
      it: 'Trattamenti conservativi',
    },
    items: [
      {
        id: 'composite-filling-one-surface',
        name: {
          ro: 'Obturație coronară definitivă cu material compozit (fizionomic) – o suprafață',
          en: 'Permanent composite filling (tooth-coloured) – one surface',
          de: 'Definitive Kompositfüllung (zahnfarben) – eine Fläche',
          fr: 'Obturation définitive en composite (teinte dentaire) – une face',
          it: 'Otturazione definitiva in composito (estetico) – una superficie',
        },
        lei: 320,
      },
      {
        id: 'composite-filling-two-surfaces',
        name: {
          ro: 'Obturație coronară definitivă cu material compozit (fizionomic) – două suprafețe',
          en: 'Permanent composite filling (tooth-coloured) – two surfaces',
          de: 'Definitive Kompositfüllung (zahnfarben) – zwei Flächen',
          fr: 'Obturation définitive en composite (teinte dentaire) – deux faces',
          it: 'Otturazione definitiva in composito (estetico) – due superfici',
        },
        lei: 360,
      },
      {
        id: 'composite-filling-three-surfaces',
        name: {
          ro: 'Obturație coronară definitivă cu material compozit (fizionomic) – trei suprafețe',
          en: 'Permanent composite filling (tooth-coloured) – three surfaces',
          de: 'Definitive Kompositfüllung (zahnfarben) – drei Flächen',
          fr: 'Obturation définitive en composite (teinte dentaire) – trois faces',
          it: 'Otturazione definitiva in composito (estetico) – tre superfici',
        },
        lei: 390,
      },
      {
        id: 'glass-ionomer-filling',
        name: {
          ro: 'Obturație coronară definitivă cu ciment ionomer de sticlă',
          en: 'Permanent filling with glass ionomer cement',
          de: 'Definitive Füllung mit Glasionomerzement',
          fr: 'Obturation définitive au ciment verre ionomère',
          it: 'Otturazione definitiva in cemento vetroionomerico',
        },
        lei: 300,
      },
      {
        id: 'anterior-filling',
        name: {
          ro: 'Obturație frontală',
          en: 'Anterior tooth filling',
          de: 'Füllung im Frontzahnbereich',
          fr: 'Obturation sur dent antérieure',
          it: 'Otturazione su dente frontale',
        },
        lei: 450,
      },
      {
        id: 'composite-veneer',
        name: {
          ro: 'Fațetare dentară cu material compozit (fizionomic)',
          en: 'Composite veneer (tooth-coloured)',
          de: 'Kompositveneer (zahnfarben)',
          fr: 'Facette dentaire en composite (teinte dentaire)',
          it: 'Faccetta dentale in composito (estetico)',
        },
        lei: 550,
      },
      {
        id: 'wall-buildup-endodontic',
        name: {
          ro: 'Refacere pereți în scop endodontic',
          en: 'Wall build-up prior to root canal treatment',
          de: 'Wandaufbau vor der Wurzelkanalbehandlung',
          fr: 'Reconstitution des parois avant traitement endodontique',
          it: 'Ricostruzione delle pareti prima del trattamento endodontico',
        },
        lei: 250,
      },
      {
        id: 'fibreglass-band-restoration',
        name: {
          ro: 'Reconstrucție dinte lipsă cu bandă din fibră de sticlă',
          en: 'Missing tooth rebuilt with a fibreglass band',
          de: 'Ersatz eines fehlenden Zahns mit Glasfaserband',
          fr: "Reconstruction d'une dent absente avec bande de fibre de verre",
          it: 'Ricostruzione di dente mancante con banda in fibra di vetro',
        },
        lei: 500,
      },
    ],
  },
  {
    id: 'endodontics',
    name: {
      ro: 'Endodonție',
      en: 'Endodontics',
      de: 'Endodontie',
      fr: 'Endodontie',
      it: 'Endodonzia',
    },
    eyebrow: {
      ro: 'Tratamente la microscop',
      en: 'Treatments under the microscope',
      de: 'Behandlungen unter dem Mikroskop',
      fr: 'Traitements sous microscope',
      it: 'Trattamenti al microscopio',
    },
    items: [
      {
        id: 'emergency-dressing',
        name: {
          ro: 'Urgență / pansament',
          en: 'Emergency treatment / dressing',
          de: 'Notfallbehandlung / Einlage',
          fr: 'Urgence / pansement',
          it: 'Urgenza / medicazione',
        },
        lei: 200,
      },
      {
        id: 'root-canal-anterior',
        name: {
          ro: 'Tratament endodontic dinte frontal',
          en: 'Root canal treatment, anterior tooth',
          de: 'Wurzelkanalbehandlung, Frontzahn',
          fr: 'Traitement endodontique, dent antérieure',
          it: 'Trattamento endodontico, dente frontale',
        },
        lei: 620,
      },
      {
        id: 'root-canal-two-roots',
        name: {
          ro: 'Tratament endodontic dinte biradicular',
          en: 'Root canal treatment, two-rooted tooth',
          de: 'Wurzelkanalbehandlung, zweiwurzeliger Zahn',
          fr: 'Traitement endodontique, dent biradiculée',
          it: 'Trattamento endodontico, dente biradicolato',
        },
        lei: 700,
      },
      {
        id: 'root-canal-multi-root',
        name: {
          ro: 'Tratament endodontic dinte pluriradicular',
          en: 'Root canal treatment, multi-rooted tooth',
          de: 'Wurzelkanalbehandlung, mehrwurzeliger Zahn',
          fr: 'Traitement endodontique, dent pluriradiculée',
          it: 'Trattamento endodontico, dente pluriradicolato',
        },
        lei: 800,
      },
      {
        id: 'gangrene-periodontitis',
        name: {
          ro: 'Tratament gangrenă / parodontită (per ședință)',
          en: 'Treatment of pulp gangrene / apical periodontitis (per session)',
          de: 'Behandlung von Pulpagangrän / apikaler Parodontitis (pro Sitzung)',
          fr: 'Traitement de gangrène pulpaire / parodontite apicale (par séance)',
          it: 'Trattamento di gangrena pulpare / parodontite apicale (per seduta)',
        },
        lei: 400,
      },
      {
        id: 'retreatment-single-root',
        name: {
          ro: 'Retratament endodontic dinte monoradicular',
          en: 'Root canal retreatment, single-rooted tooth',
          de: 'Wurzelkanal-Revision, einwurzeliger Zahn',
          fr: 'Retraitement endodontique, dent monoradiculée',
          it: 'Ritrattamento endodontico, dente monoradicolato',
        },
        lei: 700,
      },
      {
        id: 'retreatment-two-roots',
        name: {
          ro: 'Retratament endodontic dinte biradicular',
          en: 'Root canal retreatment, two-rooted tooth',
          de: 'Wurzelkanal-Revision, zweiwurzeliger Zahn',
          fr: 'Retraitement endodontique, dent biradiculée',
          it: 'Ritrattamento endodontico, dente biradicolato',
        },
        lei: 800,
      },
      {
        id: 'retreatment-multi-root',
        name: {
          ro: 'Retratament endodontic dinte pluriradicular',
          en: 'Root canal retreatment, multi-rooted tooth',
          de: 'Wurzelkanal-Revision, mehrwurzeliger Zahn',
          fr: 'Retraitement endodontique, dent pluriradiculée',
          it: 'Ritrattamento endodontico, dente pluriradicolato',
        },
        lei: 900,
      },
      // TODO(owner): verify against the printed sheet — board §2c.4 (transcribed from a skewed photo)
      {
        id: 'foreign-body-file',
        name: {
          ro: 'Extracție corp străin de pe canalul radicular (ac)',
          en: 'Removal of a foreign body from the root canal (endodontic file)',
          de: 'Entfernung eines Fremdkörpers aus dem Wurzelkanal (Wurzelkanalfeile)',
          fr: "Extraction d'un corps étranger du canal radiculaire (lime endodontique)",
          it: 'Rimozione di corpo estraneo dal canale radicolare (lima endodontica)',
        },
        lei: 300,
      },
      // TODO(owner): verify against the printed sheet — board §2c.4 (transcribed from a skewed photo)
      {
        id: 'foreign-body-post',
        name: {
          ro: 'Extracție corp străin de pe canalul radicular (pivot, DCR)',
          en: 'Removal of a foreign body from the root canal (post, DCR)',
          de: 'Entfernung eines Fremdkörpers aus dem Wurzelkanal (Stift, DCR)',
          fr: "Extraction d'un corps étranger du canal radiculaire (tenon, DCR)",
          it: 'Rimozione di corpo estraneo dal canale radicolare (perno, DCR)',
        },
        lei: 220,
      },
      {
        id: 'core-buildup-post-endodontic',
        name: {
          ro: 'Reconstituire coronară în urma tratamentului endodontic (pivot din fibră de sticlă)',
          en: 'Core build-up after root canal treatment (fibreglass post)',
          de: 'Stumpfaufbau nach Wurzelkanalbehandlung (Glasfaserstift)',
          fr: 'Reconstitution coronaire après traitement endodontique (tenon en fibre de verre)',
          it: 'Ricostruzione coronale dopo trattamento endodontico (perno in fibra di vetro)',
        },
        lei: 350,
      },
      {
        id: 'fibreglass-splinting',
        name: {
          ro: 'Imobilizare dinți parodontotici cu fibră de sticlă',
          en: 'Splinting of periodontally involved teeth with fibreglass',
          de: 'Schienung parodontal geschädigter Zähne mit Glasfaser',
          fr: 'Contention de dents atteintes de parodontite avec fibre de verre',
          it: 'Splintaggio di denti parodontopatici con fibra di vetro',
        },
        lei: 550,
      },
    ],
  },
  {
    id: 'oral-surgery',
    name: {
      ro: 'Chirurgie orală',
      en: 'Oral surgery',
      de: 'Oralchirurgie',
      fr: 'Chirurgie orale',
      it: 'Chirurgia orale',
    },
    eyebrow: {
      ro: 'Chirurgie dento-alveolară',
      en: 'Dentoalveolar surgery',
      de: 'Dentoalveoläre Chirurgie',
      fr: 'Chirurgie dento-alvéolaire',
      it: 'Chirurgia dento-alveolare',
    },
    items: [
      {
        id: 'extraction-single-root',
        name: {
          ro: 'Extracție dinte monoradicular',
          en: 'Extraction of a single-rooted tooth',
          de: 'Extraktion eines einwurzeligen Zahns',
          fr: "Extraction d'une dent monoradiculée",
          it: 'Estrazione di dente monoradicolato',
        },
        lei: 250,
      },
      {
        id: 'extraction-periodontal',
        name: {
          ro: 'Extracție dinte parodontotic',
          en: 'Extraction of a periodontally involved tooth',
          de: 'Extraktion eines parodontal geschädigten Zahns',
          fr: "Extraction d'une dent atteinte de parodontite",
          it: 'Estrazione di dente parodontopatico',
        },
        lei: 250,
      },
      {
        id: 'extraction-multi-root',
        name: {
          ro: 'Extracție dinte pluriradicular',
          en: 'Extraction of a multi-rooted tooth',
          de: 'Extraktion eines mehrwurzeligen Zahns',
          fr: "Extraction d'une dent pluriradiculée",
          it: 'Estrazione di dente pluriradicolato',
        },
        lei: 350,
      },
      {
        id: 'wisdom-tooth-erupted',
        name: {
          ro: 'Extracție molar de minte erupt',
          en: 'Extraction of an erupted wisdom tooth',
          de: 'Extraktion eines durchgebrochenen Weisheitszahns',
          fr: "Extraction d'une dent de sagesse éruptée",
          it: 'Estrazione di dente del giudizio erotto',
        },
        lei: 350,
      },
      {
        id: 'wisdom-tooth-impacted',
        name: {
          ro: 'Extracție molar de minte inclus',
          en: 'Extraction of an impacted wisdom tooth',
          de: 'Extraktion eines retinierten Weisheitszahns',
          fr: "Extraction d'une dent de sagesse incluse",
          it: 'Estrazione di dente del giudizio incluso',
        },
        lei: 600,
      },
      {
        id: 'wisdom-tooth-partially-erupted',
        name: {
          ro: 'Extracție molar de minte semierupt',
          en: 'Extraction of a partially erupted wisdom tooth',
          de: 'Extraktion eines teilretinierten Weisheitszahns',
          fr: "Extraction d'une dent de sagesse semi-incluse",
          it: 'Estrazione di dente del giudizio semi-incluso',
        },
        lei: 600,
      },
      {
        id: 'canine-impacted',
        name: {
          ro: 'Extracție canin inclus',
          en: 'Extraction of an impacted canine',
          de: 'Extraktion eines retinierten Eckzahns',
          fr: "Extraction d'une canine incluse",
          it: 'Estrazione di canino incluso',
        },
        lei: 600,
      },
      {
        id: 'surgical-root-extraction',
        name: {
          ro: 'Extracție chirurgicală rădăcină',
          en: 'Surgical extraction of a root',
          de: 'Chirurgische Wurzelentfernung',
          fr: "Extraction chirurgicale d'une racine",
          it: 'Estrazione chirurgica di radice',
        },
        lei: 250,
      },
      {
        id: 'extraction-preimplant-prgf',
        name: {
          ro: 'Extracție dinte preimplant cu PRGF',
          en: 'Pre-implant tooth extraction with PRGF',
          de: 'Präimplantologische Zahnextraktion mit PRGF',
          fr: 'Extraction dentaire pré-implantaire avec PRGF',
          it: 'Estrazione dentale pre-implantare con PRGF',
        },
        lei: 600,
      },
    ],
  },
  {
    id: 'periodontology',
    name: {
      ro: 'Parodontologie',
      en: 'Periodontics',
      de: 'Parodontologie',
      fr: 'Parodontologie',
      it: 'Parodontologia',
    },
    eyebrow: {
      ro: 'Tratamentul gingiilor',
      en: 'Gum treatment',
      de: 'Zahnfleischbehandlung',
      fr: 'Traitement des gencives',
      it: 'Trattamento delle gengive',
    },
    items: [
      {
        id: 'brushing-instruction',
        name: {
          ro: 'Instructaj periaj',
          en: 'Oral hygiene instruction',
          de: 'Mundhygieneinstruktion',
          fr: "Instruction d'hygiène bucco-dentaire",
          it: 'Istruzioni di igiene orale',
        },
        lei: 100,
      },
      {
        id: 'periodic-maintenance',
        name: {
          ro: 'Menținere periodică',
          en: 'Periodic maintenance',
          de: 'Regelmäßige Erhaltungstherapie',
          fr: 'Maintenance périodique',
          it: 'Mantenimento periodico',
        },
        lei: 350,
      },
      {
        id: 'periodic-maintenance-laser',
        name: {
          ro: 'Menținere periodică cu laser',
          en: 'Periodic maintenance with laser',
          de: 'Regelmäßige Erhaltungstherapie mit Laser',
          fr: 'Maintenance périodique au laser',
          it: 'Mantenimento periodico con laser',
        },
        lei: 500,
      },
      {
        id: 'closed-curettage',
        name: {
          ro: 'Chiuretaj câmp închis / hemiarcadă',
          en: 'Closed curettage / half-arch',
          de: 'Geschlossene Kürettage / Kieferhälfte',
          fr: 'Curetage à champ fermé / hémi-arcade',
          it: 'Curettage a campo chiuso / emiarcata',
        },
        lei: 500,
      },
      {
        id: 'closed-curettage-laser',
        name: {
          ro: 'Chiuretaj câmp închis cu laser / hemiarcadă',
          en: 'Closed curettage with laser / half-arch',
          de: 'Geschlossene Kürettage mit Laser / Kieferhälfte',
          fr: 'Curetage à champ fermé au laser / hémi-arcade',
          it: 'Curettage a campo chiuso con laser / emiarcata',
        },
        lei: 550,
      },
      {
        id: 'open-curettage-up-to-three-teeth',
        name: {
          ro: 'Chiuretaj parodontal în câmp deschis 1–3 dinți',
          en: 'Open-flap periodontal curettage, 1–3 teeth',
          de: 'Offene Parodontalkürettage, 1–3 Zähne',
          fr: 'Curetage parodontal à ciel ouvert, 1–3 dents',
          it: 'Curettage parodontale a cielo aperto, 1–3 denti',
        },
        lei: 400,
      },
      {
        id: 'open-curettage-over-three-teeth',
        name: {
          ro: 'Chiuretaj parodontal în câmp deschis > 3 dinți / ședință',
          en: 'Open-flap periodontal curettage, > 3 teeth / session',
          de: 'Offene Parodontalkürettage, > 3 Zähne / Sitzung',
          fr: 'Curetage parodontal à ciel ouvert, > 3 dents / séance',
          it: 'Curettage parodontale a cielo aperto, > 3 denti / seduta',
        },
        lei: 1100,
      },
      {
        id: 'oro-antral-closure',
        name: {
          ro: 'Închidere comunicare oro-sinusală',
          en: 'Closure of an oro-antral communication',
          de: 'Verschluss einer Mund-Antrum-Verbindung',
          fr: "Fermeture d'une communication bucco-sinusienne",
          it: 'Chiusura di comunicazione oro-antrale',
        },
        lei: 550,
      },
      {
        id: 'apicoectomy-single-root',
        name: {
          ro: 'Rezecție apicală dinte monoradicular',
          en: 'Apicoectomy, single-rooted tooth',
          de: 'Wurzelspitzenresektion, einwurzeliger Zahn',
          fr: 'Résection apicale, dent monoradiculée',
          it: 'Apicectomia, dente monoradicolato',
        },
        lei: 500,
      },
      {
        id: 'apicoectomy-multi-root',
        name: {
          ro: 'Rezecție apicală dinte pluriradicular',
          en: 'Apicoectomy, multi-rooted tooth',
          de: 'Wurzelspitzenresektion, mehrwurzeliger Zahn',
          fr: 'Résection apicale, dent pluriradiculée',
          it: 'Apicectomia, dente pluriradicolato',
        },
        lei: 550,
      },
      {
        id: 'cystectomy',
        name: {
          ro: 'Chistectomie',
          en: 'Cystectomy',
          de: 'Zystektomie',
          fr: 'Cystectomie',
          it: 'Cistectomia',
        },
        lei: 550,
      },
      {
        id: 'gingivectomy-gingivoplasty',
        name: {
          ro: 'Gingivectomie cu gingivoplastie',
          en: 'Gingivectomy with gingivoplasty',
          de: 'Gingivektomie mit Gingivoplastik',
          fr: 'Gingivectomie avec gingivoplastie',
          it: 'Gengivectomia con gengivoplastica',
        },
        lei: 250,
      },
      {
        id: 'post-extraction-bone-augmentation',
        name: {
          ro: 'Augmentare osoasă postextracțională',
          en: 'Post-extraction bone augmentation',
          de: 'Knochenaugmentation nach Extraktion',
          fr: 'Augmentation osseuse post-extractionnelle',
          it: 'Aumento osseo post-estrattivo',
        },
        lei: 550,
      },
    ],
  },
  {
    id: 'prosthetics',
    name: {
      ro: 'Protetică',
      en: 'Prosthodontics',
      de: 'Prothetik',
      fr: 'Prothèses',
      it: 'Protesi',
    },
    eyebrow: {
      ro: 'Coroane și proteze',
      en: 'Crowns and dentures',
      de: 'Kronen und Prothesen',
      fr: 'Couronnes et prothèses',
      it: 'Corone e protesi',
    },
    items: [
      {
        id: 'temporary-crown-chairside',
        name: {
          ro: 'Coroană provizorie realizată în cabinet / element',
          en: 'Chairside temporary crown / unit',
          de: 'Provisorische Krone, im Behandlungsstuhl gefertigt / Element',
          fr: 'Couronne provisoire réalisée au fauteuil / élément',
          it: 'Corona provvisoria realizzata alla poltrona / elemento',
        },
        lei: 80,
      },
      {
        id: 'temporary-crown-implant',
        name: {
          ro: 'Coroană provizorie pe implant',
          en: 'Temporary crown on an implant',
          de: 'Provisorische Krone auf Implantat',
          fr: 'Couronne provisoire sur implant',
          it: 'Corona provvisoria su impianto',
        },
        lei: 500,
      },
      {
        id: 'zirconia-crown-titanium-abutment',
        name: {
          ro: 'Coroană de zirconiu + bont protetic din titan',
          en: 'Zirconia crown + titanium abutment',
          de: 'Zirkonkrone + Titanabutment',
          fr: 'Couronne en zircone + pilier en titane',
          it: 'Corona in zirconia + moncone in titanio',
        },
        lei: 2000,
      },
      {
        id: 'zirconia-crown-titanium-abutment-base',
        name: {
          ro: 'Coroană de zirconiu + bont protetic din titan și bază din titan',
          en: 'Zirconia crown + titanium abutment with titanium base',
          de: 'Zirkonkrone + Titanabutment mit Titanbasis',
          fr: 'Couronne en zircone + pilier en titane avec base en titane',
          it: 'Corona in zirconia + moncone in titanio con base in titanio',
        },
        lei: 2200,
      },
      {
        id: 'implant-abutment',
        name: {
          ro: 'Bont protetic pe implant',
          en: 'Prosthetic abutment on an implant',
          de: 'Prothetisches Abutment auf Implantat',
          fr: 'Pilier prothétique sur implant',
          it: 'Moncone protesico su impianto',
        },
        lei: 500,
      },
      {
        id: 'metal-ceramic-crown',
        name: {
          ro: 'Coroană metalo-ceramică',
          en: 'Metal-ceramic crown',
          de: 'Metallkeramikkrone',
          fr: 'Couronne céramo-métallique',
          it: 'Corona metallo-ceramica',
        },
        lei: 800,
      },
      {
        id: 'all-ceramic-crown',
        name: {
          ro: 'Coroană integral ceramică',
          en: 'All-ceramic crown',
          de: 'Vollkeramikkrone',
          fr: 'Couronne tout céramique',
          it: 'Corona integralmente in ceramica',
        },
        lei: 2000,
      },
      {
        id: 'zirconia-crown',
        name: {
          ro: 'Coroană zirconiu',
          en: 'Zirconia crown',
          de: 'Zirkonkrone',
          fr: 'Couronne en zircone',
          it: 'Corona in zirconia',
        },
        lei: 1300,
      },
      {
        id: 'pmma-temporary-crown',
        name: {
          ro: 'Coroană provizorie PMMA',
          en: 'PMMA temporary crown',
          de: 'Provisorische PMMA-Krone',
          fr: 'Couronne provisoire en PMMA',
          it: 'Corona provvisoria in PMMA',
        },
        lei: 350,
      },
      {
        id: 'metal-ceramic-crown-implant',
        name: {
          ro: 'Coroană metalo-ceramică pe implant',
          en: 'Metal-ceramic crown on an implant',
          de: 'Metallkeramikkrone auf Implantat',
          fr: 'Couronne céramo-métallique sur implant',
          it: 'Corona metallo-ceramica su impianto',
        },
        lei: 1600,
      },
      {
        id: 'zirconia-crown-implant',
        name: {
          ro: 'Coroană de zirconiu pe implant (fără bont protetic)',
          en: 'Zirconia crown on an implant (abutment not included)',
          de: 'Zirkonkrone auf Implantat (ohne Abutment)',
          fr: 'Couronne en zircone sur implant (sans pilier)',
          it: 'Corona in zirconia su impianto (senza moncone)',
        },
        lei: 1800,
      },
      {
        id: 'acrylic-denture',
        name: {
          ro: 'Proteză totală / parțială acrilică',
          en: 'Complete / partial acrylic denture',
          de: 'Totale / partielle Acrylprothese',
          fr: 'Prothèse complète / partielle en résine acrylique',
          it: 'Protesi totale / parziale in resina acrilica',
        },
        lei: 2300,
      },
      {
        id: 'acrylic-denture-ceramic-teeth',
        name: {
          ro: 'Proteză totală / parțială acrilică (dinți ceramică)',
          en: 'Complete / partial acrylic denture (ceramic teeth)',
          de: 'Totale / partielle Acrylprothese (Keramikzähne)',
          fr: 'Prothèse complète / partielle en résine acrylique (dents en céramique)',
          it: 'Protesi totale / parziale in resina acrilica (denti in ceramica)',
        },
        lei: 2600,
      },
      {
        id: 'flexible-denture',
        name: {
          ro: 'Proteză flexibilă',
          en: 'Flexible denture',
          de: 'Flexible Prothese',
          fr: 'Prothèse flexible',
          it: 'Protesi flessibile',
        },
        lei: 2300,
      },
      // TODO(owner): verify against the printed sheet — board §2c.4 (transcribed from a skewed photo)
      {
        id: 'kemeny-flexible',
        name: {
          ro: 'Kemeny flexibil',
          en: 'Flexible Kemeny denture',
          de: 'Flexible Kemeny-Prothese',
          fr: 'Prothèse Kemeny flexible',
          it: 'Protesi Kemeny flessibile',
        },
        lei: 550,
      },
      {
        id: 'cast-partial-denture',
        name: {
          ro: 'Proteză scheletată',
          en: 'Cast metal partial denture',
          de: 'Modellgussprothese',
          fr: 'Prothèse squelettée',
          it: 'Protesi scheletrata',
        },
        lei: 3000,
      },
      {
        id: 'ceramic-inlay',
        name: {
          ro: 'Incrustație integral ceramică / zirconiu (inlay, onlay, overlay)',
          en: 'All-ceramic / zirconia inlay, onlay or overlay',
          de: 'Vollkeramik- / Zirkoneinlagefüllung (Inlay, Onlay, Overlay)',
          fr: 'Incrustation tout céramique / zircone (inlay, onlay, overlay)',
          it: 'Intarsio integralmente in ceramica / zirconia (inlay, onlay, overlay)',
        },
        lei: 1000,
      },
      {
        id: 'composite-inlay',
        name: {
          ro: 'Incrustație compozit',
          en: 'Composite inlay',
          de: 'Komposit-Einlagefüllung',
          fr: 'Incrustation en composite',
          it: 'Intarsio in composito',
        },
        lei: 600,
      },
      {
        id: 'wax-up',
        name: {
          ro: 'Wax-up / dinte',
          en: 'Wax-up / tooth',
          de: 'Wax-up / Zahn',
          fr: 'Wax-up / dent',
          it: 'Wax-up / dente',
        },
        lei: 100,
      },
      {
        id: 'mock-up',
        name: {
          ro: 'Mock-up',
          en: 'Mock-up',
          de: 'Mock-up',
          fr: 'Mock-up',
          it: 'Mock-up',
        },
        lei: 100,
      },
      {
        id: 'denture-reline',
        name: {
          ro: 'Căptușire proteză',
          en: 'Denture reline',
          de: 'Prothesenunterfütterung',
          fr: 'Rebasage de prothèse',
          it: 'Ribasatura di protesi',
        },
        lei: 300,
      },
      {
        id: 'denture-repair',
        name: {
          ro: 'Reparație proteză',
          en: 'Denture repair',
          de: 'Prothesenreparatur',
          fr: 'Réparation de prothèse',
          it: 'Riparazione di protesi',
        },
        lei: 250,
      },
      {
        id: 'denture-tooth-addition',
        name: {
          ro: 'Adăugare dinte / dinți în proteză',
          en: 'Adding a tooth / teeth to a denture',
          de: 'Ergänzung eines Zahns / mehrerer Zähne in der Prothese',
          fr: "Ajout d'une dent / de dents sur une prothèse",
          it: 'Aggiunta di dente / denti alla protesi',
        },
        lei: 200,
      },
      {
        id: 'tray-whitening-fluoride-bruxism',
        name: {
          ro: 'Gutieră pentru albire / fluorizare / bruxism / arcadă',
          en: 'Tray for whitening / fluoridation / bruxism / arch',
          de: 'Schiene für Aufhellung / Fluoridierung / Bruxismus / Kiefer',
          fr: 'Gouttière pour blanchiment / fluoration / bruxisme / arcade',
          it: 'Mascherina per sbiancamento / fluorizzazione / bruxismo / arcata',
        },
        lei: 250,
      },
      // TODO(owner): verify against the printed sheet — board §2c.4 (transcribed from a skewed photo)
      {
        id: 'repositioning-splint',
        name: {
          ro: 'Gutieră de repoziționare',
          en: 'Repositioning splint',
          de: 'Repositionierungsschiene',
          fr: 'Gouttière de repositionnement',
          it: 'Bite di riposizionamento',
        },
        lei: 1100,
      },
      {
        id: 'splint-adjustment',
        name: {
          ro: 'Adaptare gutieră',
          en: 'Splint adjustment',
          de: 'Anpassung der Schiene',
          fr: 'Adaptation de la gouttière',
          it: 'Adattamento della mascherina',
        },
        lei: 100,
      },
    ],
  },
  {
    id: 'implantology',
    name: {
      ro: 'Implantologie',
      en: 'Implantology',
      de: 'Implantologie',
      fr: 'Implantologie',
      it: 'Implantologia',
    },
    eyebrow: {
      ro: 'Implanturi și augmentare osoasă',
      en: 'Implants and bone augmentation',
      de: 'Implantate und Knochenaufbau',
      fr: 'Implants et augmentation osseuse',
      it: 'Impianti e aumento osseo',
    },
    items: [
      {
        id: 'implant-dentium',
        name: {
          ro: 'Implant dentar Dentium',
          en: 'Dentium dental implant',
          de: 'Dentium Zahnimplantat',
          fr: 'Implant dentaire Dentium',
          it: 'Impianto dentale Dentium',
        },
        lei: 3000,
      },
      // TODO(owner): verify against the printed sheet — board §2c.4 (transcribed from a skewed photo)
      {
        id: 'implant-bredent',
        name: {
          ro: 'Implant dentar Bredent',
          en: 'Bredent dental implant',
          de: 'Bredent Zahnimplantat',
          fr: 'Implant dentaire Bredent',
          it: 'Impianto dentale Bredent',
        },
        lei: 3200,
      },
      {
        id: 'sinus-lift-internal',
        name: {
          ro: 'Sinus lift intern',
          en: 'Internal sinus lift',
          de: 'Interner Sinuslift',
          fr: 'Sinus lift interne',
          it: 'Rialzo del seno mascellare interno',
        },
        lei: 1000,
      },
      {
        id: 'sinus-lift-external',
        name: {
          ro: 'Sinus lift extern',
          en: 'External sinus lift',
          de: 'Externer Sinuslift',
          fr: 'Sinus lift externe',
          it: 'Rialzo del seno mascellare esterno',
        },
        lei: 3500,
      },
      {
        id: 'bone-augmentation-small',
        name: {
          ro: 'Augmentare osoasă mică',
          en: 'Small bone augmentation',
          de: 'Kleine Knochenaugmentation',
          fr: 'Petite augmentation osseuse',
          it: 'Piccolo aumento osseo',
        },
        lei: 500,
      },
      {
        id: 'bone-augmentation-large',
        name: {
          ro: 'Augmentare osoasă mare',
          en: 'Large bone augmentation',
          de: 'Große Knochenaugmentation',
          fr: 'Grande augmentation osseuse',
          it: 'Grande aumento osseo',
        },
        lei: 1000,
      },
      {
        id: 'orthodontic-mini-implant',
        name: {
          ro: 'Miniimplant ortodontic',
          en: 'Orthodontic mini-implant',
          de: 'Kieferorthopädisches Mini-Implantat',
          fr: 'Mini-implant orthodontique',
          it: 'Mini-impianto ortodontico',
        },
        lei: 600,
      },
      {
        id: 'khoury-horizontal',
        name: {
          ro: 'Tehnica Khoury – orizontal',
          en: 'Khoury technique – horizontal',
          de: 'Khoury-Technik – horizontal',
          fr: 'Technique de Khoury – horizontale',
          it: 'Tecnica di Khoury – orizzontale',
        },
        lei: 4500,
      },
      {
        id: 'khoury-vertical',
        name: {
          ro: 'Tehnica Khoury – vertical',
          en: 'Khoury technique – vertical',
          de: 'Khoury-Technik – vertikal',
          fr: 'Technique de Khoury – verticale',
          it: 'Tecnica di Khoury – verticale',
        },
        lei: 6000,
      },
      {
        id: 'biomaterials-grade-1',
        name: {
          ro: 'Biomateriale (membrană, os, pini, plasmă) grad 1',
          en: 'Biomaterials (membrane, bone, pins, plasma), grade 1',
          de: 'Biomaterialien (Membran, Knochen, Pins, Plasma), Grad 1',
          fr: 'Biomatériaux (membrane, os, pins, plasma), grade 1',
          it: 'Biomateriali (membrana, osso, pin, plasma), grado 1',
        },
        lei: 500,
      },
      {
        id: 'biomaterials-grade-2',
        name: {
          ro: 'Biomateriale (membrană, os, pini, plasmă) grad 2',
          en: 'Biomaterials (membrane, bone, pins, plasma), grade 2',
          de: 'Biomaterialien (Membran, Knochen, Pins, Plasma), Grad 2',
          fr: 'Biomatériaux (membrane, os, pins, plasma), grade 2',
          it: 'Biomateriali (membrana, osso, pin, plasma), grado 2',
        },
        lei: 1000,
      },
      {
        id: 'titanium-membrane-20-25',
        name: {
          ro: 'Membrană titan 20×25',
          en: 'Titanium membrane 20×25',
          de: 'Titanmembran 20×25',
          fr: 'Membrane en titane 20×25',
          it: 'Membrana in titanio 20×25',
        },
        lei: 1200,
      },
      {
        id: 'titanium-membrane-25-30',
        name: {
          ro: 'Membrană titan 25×30',
          en: 'Titanium membrane 25×30',
          de: 'Titanmembran 25×30',
          fr: 'Membrane en titane 25×30',
          it: 'Membrana in titanio 25×30',
        },
        lei: 1400,
      },
      {
        id: 'gingival-graft',
        name: {
          ro: 'Grefă gingivală',
          en: 'Gingival graft',
          de: 'Gingivatransplantat',
          fr: 'Greffe gingivale',
          it: 'Innesto gengivale',
        },
        lei: 1200,
      },
      {
        id: 'implant-exposure',
        name: {
          ro: 'Descoperire implant',
          en: 'Implant exposure',
          de: 'Implantatfreilegung',
          fr: "Dégagement de l'implant",
          it: "Scopertura dell'impianto",
        },
        lei: 200,
      },
      {
        id: 'implant-removal',
        name: {
          ro: 'Extracție implant',
          en: 'Implant removal',
          de: 'Implantatentfernung',
          fr: "Dépose de l'implant",
          it: "Rimozione dell'impianto",
        },
        lei: 500,
      },
      {
        id: 'membrane-pin-removal',
        name: {
          ro: 'Îndepărtare membrană / pini',
          en: 'Removal of a membrane / pins',
          de: 'Entfernung von Membran / Pins',
          fr: 'Dépose de membrane / pins',
          it: 'Rimozione di membrana / pin',
        },
        lei: 400,
      },
      {
        id: 'apically-repositioned-flap',
        name: {
          ro: 'Lambou repoziționat apical',
          en: 'Apically repositioned flap',
          de: 'Apikaler Verschiebelappen',
          fr: 'Lambeau déplacé apicalement',
          it: 'Lembo riposizionato apicalmente',
        },
        lei: 500,
      },
      {
        id: 'bone-harvesting',
        name: {
          ro: 'Recoltare os',
          en: 'Bone harvesting',
          de: 'Knochenentnahme',
          fr: 'Prélèvement osseux',
          it: 'Prelievo osseo',
        },
        lei: 500,
      },
      {
        id: 'autologous-bone-block-harvesting',
        name: {
          ro: 'Recoltare bloc osos autolog',
          en: 'Harvesting of an autologous bone block',
          de: 'Entnahme eines autologen Knochenblocks',
          fr: "Prélèvement d'un bloc osseux autologue",
          it: 'Prelievo di blocco osseo autologo',
        },
        lei: 1200,
      },
      {
        id: 'alveolar-bone-graft',
        name: {
          ro: 'Adiție osoasă alveolară postextracțională',
          en: 'Post-extraction alveolar bone grafting',
          de: 'Alveoläre Knochenauflagerung nach Extraktion',
          fr: 'Addition osseuse alvéolaire post-extractionnelle',
          it: 'Addizione ossea alveolare post-estrattiva',
        },
        lei: 1000,
      },
    ],
  },
  {
    id: 'orthodontics',
    name: {
      ro: 'Ortodonție',
      en: 'Orthodontics',
      de: 'Kieferorthopädie',
      fr: 'Orthodontie',
      it: 'Ortodonzia',
    },
    eyebrow: {
      ro: 'Aparate ortodontice fixe',
      en: 'Fixed appliances',
      de: 'Festsitzende Zahnspangen',
      fr: 'Appareils fixes',
      it: 'Apparecchi fissi',
    },
    items: [
      {
        id: 'study-model',
        name: {
          ro: 'Model de studiu',
          en: 'Study model',
          de: 'Studienmodell',
          fr: "Modèle d'étude",
          it: 'Modello di studio',
        },
        lei: 200,
      },
      {
        id: 'fixed-appliance-metal',
        name: {
          ro: 'Aparat ortodontic fix, metalic, per arcadă',
          en: 'Fixed orthodontic appliance, metal, per arch',
          de: 'Festsitzende Zahnspange, Metall, pro Kiefer',
          fr: 'Appareil orthodontique fixe, métallique, par arcade',
          it: 'Apparecchio ortodontico fisso, metallico, per arcata',
        },
        lei: 2100,
      },
      {
        id: 'fixed-appliance-ceramic',
        name: {
          ro: 'Aparat ortodontic fix, ceramic / safir, per arcadă',
          en: 'Fixed orthodontic appliance, ceramic / sapphire, per arch',
          de: 'Festsitzende Zahnspange, Keramik / Saphir, pro Kiefer',
          fr: 'Appareil orthodontique fixe, céramique / saphir, par arcade',
          it: 'Apparecchio ortodontico fisso, ceramico / zaffiro, per arcata',
        },
        lei: 3100,
      },
    ],
  },
];
