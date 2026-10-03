import { describe, expect, it } from 'vitest';
import { heroSlides } from '../../src/lib/hero-slides/hero-slides';
import { reviews } from '../../src/lib/reviews/reviews';
import { auxiliaries, clinicStats, doctors } from '../../src/lib/team/team';
import { locales, type Locale } from '../../src/i18n/locales';
import de from '../../src/messages/de.json';
import en from '../../src/messages/en.json';
import fr from '../../src/messages/fr.json';
import itMessages from '../../src/messages/it.json';
import ro from '../../src/messages/ro.json';

// THE CMSR WORDING SCAN (owner, 2026-09-27, doctor-pages round 2s: "these are
// very sensible. add a step for checking for illegal guarantees or things
// aiming in that direction"). CMSR — Colegiul Medicilor Stomatologi din
// România, the dentists' college — regulates a clinic's advertising: no
// promise of a result, no superlative, no comparison, no "painless" or
// "risk-free", no award or recognition the clinic cannot document. CLAUDE.md
// §12's sibling rule and lib/prices' header state it as an AUTHORING rule;
// this file is the first MACHINE for it. Until now the three demo stat
// sentences that tripped it („Rezultate predictibile și sigure", „Intervenții
// reușite", „Recunoaștere pentru inovație …") and the band's „Excelență
// confirmată în timp" were only flagged in prose (lib/team's TODO block); on
// the owner's word they are rewritten to descriptive copy and this scan keeps
// them that way.
//
// WHAT IT SCANS: every string a language ships for the team — lib/team's
// positions, philosophy, biography paragraphs, course lines and stat words
// (never the NAMES, which are proper nouns), the clinic's OWN stat words among
// them since 2026-10-01 (`clinicStats`, the „în cifre" band of the Home and
// Team pages — the clinic talking about itself in numbers, labelled
// `clinic.stats.<icon>`) — and every value under the `team`
// namespace of the five message files — and, since two lanes a day apart, two
// more lists. The real Google reviews (2026-09-30): their TITLES are written
// by the clinic, and their QUOTES are the patients' words with every banned
// phrase cut on the owner's choice — so both are read like every other clinic
// string. And every slogan and alt lib/hero-slides ships (2026-10-01, the
// hero-photos lane: the scan widened the day the opener's copy was rewritten,
// so the new drafts were gated before they shipped). WHY THAT SCOPE: the
// doctor pages, the reviews and the opener are where a clinic talks about
// itself. Widening it to lib/prices and the other namespaces is one more entry
// in SOURCES below — a deliberate act, because older copy must be read first,
// not machine-red overnight.
//
// WHAT COUNTS: one pattern list per language, HARD — a hit fails the suite.
// The lists are deliberately narrow (a wound-healing course is not a cure
// claim, a "safe" appointment is not a safety promise), so they name the
// CLAIM shapes: a superlative, a guarantee, a pain/risk promise, a percentage,
// "number one" / "leader" / "unique", an "excellent"/"perfect"/"miracle",
// a RESULT qualified as predictable/constant/safe/guaranteed, and a claim of
// recognition or awards. A real award the clinic can document is not
// forbidden by CMSR — it is forbidden HERE until the owner lists the exact
// string in ALLOWED, with the document beside it in the ledger.
//
// The last `it` proves each list has teeth (one sample per language trips).

/** The exact strings the owner has verified and allows through, verbatim. */
const ALLOWED: readonly string[] = [];

const PATTERNS: Readonly<Record<Locale, readonly RegExp[]>> = {
  ro: [
    /\b(cel|cea|cei|cele) mai\b/i,
    /garant/i,
    /f[ăa]r[ăa] durere|nedureros/i,
    /\d+ ?%/,
    /\bsigur/i,
    /risc zero|f[ăa]r[ăa] (niciun )?risc/i,
    /nr\.? ?1\b|num[ăa]rul (1|unu)\b|\blider/i,
    /\bunic[ăa]?\b|perfect|miracol|excelen/i,
    /rezultat\w*\s+(predictibil|constant|sigur|garantat|excelent|optim)/i,
    /(predictibil|constant|sigur|garantat|excelent|optim)\w*\s+rezultat/i,
    /recunoa[șs]t|premi(u|i|ile|at)\b/i,
    /reu[șs]it/i,
  ],
  en: [
    /\bthe (very )?best\b/i,
    /guarantee/i,
    /painless|pain-free|without pain/i,
    /\d+ ?%/,
    /risk-free|no risk|without risk/i,
    /number one|#1\b|\bleading\b|\bleader\b/i,
    /\bunique\b|perfect|miracle|excellen/i,
    /(predictable|consistent|safe|guaranteed|excellent|optimal) results?/i,
    /results? (are |is )?(predictable|consistent|safe|guaranteed)/i,
    /recogni[sz]ed|recognition|award/i,
    /successful/i,
  ],
  de: [
    /\b(der|die|das|am) beste[nrs]?\b/i,
    /garantie|garantiert/i,
    /schmerzfrei|schmerzlos|ohne schmerz/i,
    /\d+ ?%/,
    /risikofrei|ohne risiko/i,
    /nummer (1|eins)\b|führend|marktführer/i,
    /einzigartig|perfekt|wunder\b|exzellen/i,
    /(vorhersehbar|beständig|sicher|garantiert|exzellent|optimal)\w* ergebnis/i,
    /anerkennung|anerkannt|auszeichnung|preis(e|träger)?\b/i,
    /erfolgreich/i,
  ],
  fr: [
    /\b(le|la|les) meilleur/i,
    /garanti/i,
    /sans douleur|indolore/i,
    /\d+ ?%/,
    /sans risque/i,
    /numéro (1|un)\b|\bleader\b/i,
    /\bunique\b|parfait|miracle|excellen/i,
    /résultats? (prévisibles?|constants?|sûrs?|garantis?|excellents?|optimaux?|optimal)/i,
    /reconnaissance|reconnu|distinction|récompense|prix\b/i,
    /réussi/i,
  ],
  it: [
    /\b(il|la|i|le) migliori?\b/i,
    /garanzi|garantit/i,
    /senza dolore|indolore/i,
    /\d+ ?%/,
    /senza rischi/i,
    /numero (1|uno)\b|\bleader\b/i,
    /\bunic[oa]\b|perfett|miracol|eccellen/i,
    /risultat\w+ (prevedibil|costant|sicur|garantit|eccellent|ottim)/i,
    /riconosc|premi[oi]?\b|premiat/i,
    /riusci/i,
  ],
};

type Messages = typeof ro;
const MESSAGES: Readonly<Record<Locale, Messages>> = {
  ro,
  en,
  de,
  fr,
  it: itMessages,
};

/** Every string value under the `team` namespace, with its dotted key. */
function messageStrings(locale: Locale): readonly [string, string][] {
  const out: [string, string][] = [];
  const walk = (node: unknown, path: string): void => {
    if (typeof node === 'string') out.push([path, node]);
    else if (node && typeof node === 'object')
      for (const [key, value] of Object.entries(node))
        walk(value, `${path}.${key}`);
  };
  walk(MESSAGES[locale].team, 'team');
  return out;
}

/** Every string lib/team ships for one language, labelled — names excluded. */
function teamStrings(locale: Locale): readonly [string, string][] {
  const out: [string, string][] = [];
  for (const member of auxiliaries)
    out.push([`${member.id}.position`, member.words[locale].position]);
  for (const doctor of doctors) {
    const words = doctor.words[locale];
    out.push([`${doctor.id}.position`, words.position]);
    out.push([`${doctor.id}.philosophy`, words.philosophy]);
    words.about.forEach((p, i) => out.push([`${doctor.id}.about[${i}]`, p]));
    doctor.courses.forEach((c, i) =>
      out.push([`${doctor.id}.courses[${i}]`, c.words[locale]]),
    );
    for (const stat of doctor.stats) {
      out.push([
        `${doctor.id}.stats.${stat.icon}.label`,
        stat.words[locale].label,
      ]);
      out.push([
        `${doctor.id}.stats.${stat.icon}.description`,
        stat.words[locale].description,
      ]);
    }
  }
  for (const stat of clinicStats) {
    out.push([`clinic.stats.${stat.icon}.label`, stat.words[locale].label]);
    out.push([
      `clinic.stats.${stat.icon}.description`,
      stat.words[locale].description,
    ]);
  }
  return out;
}

/** Every string lib/hero-slides ships for one language: each slide's slogan and its alt. */
function heroStrings(locale: Locale): readonly [string, string][] {
  return heroSlides.flatMap((slide): [string, string][] => [
    [`${slide.id}.alt`, slide.words[locale].alt],
    [`${slide.id}.title`, slide.words[locale].title],
  ]);
}

/**
 * The Google reviews — the TITLE (the clinic's own words: the one
 * characteristic a review is about) AND the quoted TEXT. The CMSR guide
 * (Decizia 4/2CN/2025, in force 2025-07-01) lets a clinic show its patients'
 * testimonials and makes it answerable for their content, and the owner chose
 * to CUT the banned phrases from the quotes, each cut marked „[…]"
 * (2026-09-30), so the quotes are held to the same scan: a superlative left
 * in the next review fails here instead of shipping (lib/reviews' header).
 */
function reviewStrings(locale: Locale): readonly [string, string][] {
  return reviews.flatMap((review): [string, string][] => [
    [`${review.id}.title`, review.words[locale].title],
    [`${review.id}.text`, review.words[locale].text],
  ]);
}

/** The sources the scan walks today; a new lane ADDS a row, never edits one. */
const SOURCES: readonly [
  string,
  (locale: Locale) => readonly [string, string][],
][] = [
  ['lib/team', teamStrings],
  ['messages team.*', messageStrings],
  ['lib/reviews', reviewStrings],
  ['lib/hero-slides', heroStrings],
];

function hits(locale: Locale, text: string): readonly string[] {
  if (ALLOWED.includes(text)) return [];
  return PATTERNS[locale].filter((p) => p.test(text)).map(String);
}

describe('CMSR — no guarantee, superlative, comparison or undocumented award in what the team pages, the reviews and the opener say', () => {
  it.each(locales)('%s: every shipped string passes the scan', (locale) => {
    const offenders: string[] = [];
    for (const [source, read] of SOURCES) {
      for (const [where, text] of read(locale)) {
        const matched = hits(locale, text);
        if (matched.length > 0)
          offenders.push(
            `${source} ${where}: ${matched.join(' ')} → „${text}"`,
          );
      }
    }
    expect(offenders).toEqual([]);
  });

  it('scans something in every language (never vacuous)', () => {
    for (const locale of locales) {
      expect(teamStrings(locale).length).toBeGreaterThan(20);
      // The clinic's own tiles, every one of them: a label and a sentence each.
      expect(
        teamStrings(locale).filter(([where]) =>
          where.startsWith('clinic.stats.'),
        ),
      ).toHaveLength(clinicStats.length * 2);
      expect(messageStrings(locale).length).toBeGreaterThan(10);
      expect(reviewStrings(locale).length).toBe(reviews.length * 2);
      expect(heroStrings(locale).length).toBe(heroSlides.length * 2);
    }
  });

  it.each([
    ['ro', 'Cea mai bună clinică, rezultate garantate și fără durere.'],
    ['ro', 'Rezultate predictibile și sigure pentru fiecare pacient.'],
    ['ro', 'Recunoaștere pentru inovație și 100% satisfacție.'],
    ['en', 'The best clinic in town, painless and guaranteed results.'],
    ['en', 'Award-winning care with consistent results.'],
    ['de', 'Die beste Praxis, schmerzfrei und garantiert.'],
    ['fr', 'La meilleure clinique, sans douleur, résultats garantis.'],
    ['it', 'La migliore clinica, senza dolore, risultati garantiti.'],
  ] as const)('has teeth in %s: „%s" is refused', (locale, text) => {
    expect(hits(locale, text).length).toBeGreaterThan(0);
  });

  it('lets descriptive copy through (no false positive on the shapes it must allow)', () => {
    expect(
      hits('ro', 'Workshop de suturi și vindecare a plăgilor orale, Milano.'),
    ).toEqual([]);
    expect(
      hits(
        'ro',
        'Lucrez în ortodonție de peste zece ani și explic fiecare etapă.',
      ),
    ).toEqual([]);
    expect(
      hits('en', 'A first visit starts with listening and a full examination.'),
    ).toEqual([]);
    expect(
      hits('de', 'Workshop zu Nahttechniken und oraler Wundheilung, Mailand.'),
    ).toEqual([]);
  });

  it('keeps the allowlist honest: an allowed string is exact, verbatim, and documented', () => {
    for (const text of ALLOWED) {
      expect(text.trim()).toBe(text);
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
