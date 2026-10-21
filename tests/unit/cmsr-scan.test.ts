import { describe, expect, it } from 'vitest';
import { postsIn as blogPostsIn } from '../../src/lib/blog/blog';
import {
  articles as blogArticles,
  type ArticleBlock,
} from '../../src/lib/blog-article/blog-article';
import { heroSlides } from '../../src/lib/hero-slides/hero-slides';
import { reviews } from '../../src/lib/reviews/reviews';
import { auxiliaries, clinicStats, doctors } from '../../src/lib/team/team';
import { withoutInvisible } from '../../src/lib/visible-text/visible-text';
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
// so the new drafts were gated before they shipped). And the blog's posts
// (2026-10-11, the blog branch's first lane, CLAUDE.md §15.39): every title,
// summary and tag src/content/blog/posts.json holds — a clinic's articles about
// teeth are the clinic talking, and the scan widened in the lane that wrote
// the first drafts; in Romanian until round 3 (2026-10-14), in all five
// languages since, read in the lane that drafted the other four. And the
// `blog` namespace of the five message files (2026-10-14, CLAUDE.md §15.39
// round 2): the list page's hero — its heading and its lead, the clinic
// describing what it writes — drafted in that lane, and, since round 4, the
// article page's own words beside them (`blog.article.*`). And the articles
// themselves (2026-10-14, the article page's lane, CLAUDE.md §15.39 round 4):
// every paragraph, subheading, caption, heading and note (a gallery card's
// caption; a photo's and each half of a before/after's heading and note,
// wherever the block has them, since 2026-10-15) and picture description,
// and the doctor's conclusion, of every file in src/content/blog/articles —
// in Romanian until 2026-10-15, in all five languages since, read in the lane
// that drafted the other four (every article is written in every language,
// lib/blog-article's EVERY LANGUAGE, IN ONE FILE).
// WHY THAT SCOPE: the
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

/** The exact strings the owner has verified and allows through, verbatim —
 *  as a visitor READS them, which is how `visible` (below) reads every string
 *  before it is compared: no `<k>` key-word marks, no invisible character,
 *  every diacritic composed (NFC), and every run of whitespace ONE plain
 *  space, U+0020. So an exception copied out of a message file is written
 *  with a plain space where the copy has a line break, a no-break space or two
 *  spaces in a row, or it never matches; the honesty test at the end holds
 *  every entry to it. */
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

/** Every string value under one namespace of a message file, with its dotted key. */
function namespaceStrings(
  locale: Locale,
  namespace: 'team' | 'blog',
): readonly [string, string][] {
  const out: [string, string][] = [];
  const walk = (node: unknown, path: string): void => {
    if (typeof node === 'string') out.push([path, node]);
    else if (node && typeof node === 'object')
      for (const [key, value] of Object.entries(node))
        walk(value, `${path}.${key}`);
  };
  walk(MESSAGES[locale][namespace], namespace);
  return out;
}

/** Every string value under the `team` namespace, with its dotted key. */
function messageStrings(locale: Locale): readonly [string, string][] {
  return namespaceStrings(locale, 'team');
}

/**
 * Every string value under the `blog` namespace — the list page's own words
 * since 2026-10-14 (CLAUDE.md §15.39 round 2): its hero heading and lead are
 * the clinic talking about what it writes, so the scan reads them in the lane
 * that drafted them, in all five languages — the list pages' own since round
 * 3 — and with them the article page's words (`blog.article.*`, round 4: its
 * by-line, its gallery's and its share controls' labels) and the reading
 * time the list's cards and the article page share (`blog.readingTime`), in
 * all five languages, every one of which has its article pages.
 */
function blogMessageStrings(locale: Locale): readonly [string, string][] {
  return namespaceStrings(locale, 'blog');
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

/**
 * The blog's posts (CLAUDE.md §15.39) — every title, summary, tag and picture
 * description in the language scanned (an empty alt, a decorative picture,
 * has nothing to read): each post's words in that language, as its list page
 * prints them (lib/blog's `postsIn`). Every language since round 3
 * (2026-10-14); Romanian alone until then.
 */
function blogStrings(locale: Locale): readonly [string, string][] {
  return blogPostsIn(locale).flatMap((post): [string, string][] => [
    [`${post.slug}.title`, post.title],
    [`${post.slug}.summary`, post.summary],
    ...post.tags.map((tag): [string, string] => [`${post.slug}.tag`, tag]),
    ...(post.image.alt === ''
      ? []
      : [[`${post.slug}.alt`, post.image.alt] satisfies [string, string]]),
  ]);
}

/**
 * The blog's articles (CLAUDE.md §15.39 round 4) — every paragraph,
 * subheading, caption (a gallery card's), heading and note (a photo's, each
 * half of a before/after's) and picture description, and the conclusion, the
 * doctor's own closing words, in the language scanned: each article's body in
 * that language, as its page prints it (lib/blog-article's
 * `languages[locale]`). Every alt is read: lib/blog-article's `parseArticle`
 * refuses an empty one, in every language, because a photo's, a
 * before/after's and a gallery's pictures are information. A heading or a
 * note is read wherever the block has one — the photo's and the pair's are
 * optional since 2026-10-15 (lib/blog-article's THE PHOTO and THE PAIR IS
 * ONE SHAPE) — and a note is read WITHOUT its lead-in („Notă: "), which is
 * the page's word (`blog.article.note`) and is read with the `blog`
 * namespace. Every language since 2026-10-15; Romanian alone until then.
 */
function articleStrings(locale: Locale): readonly [string, string][] {
  return blogArticles.flatMap((entry): [string, string][] => {
    const article = entry.languages[locale];
    return [
      ...article.blocks.flatMap((block, index): [string, string][] => {
        const where = `${article.slug}.blocks[${index}]`;
        switch (block.type) {
          case 'paragraph':
          case 'heading':
            return [[`${where}.${block.type}`, block.text]];
          case 'gallery':
            return block.cards.flatMap((card, n): [string, string][] => [
              [`${where}.cards[${n}].caption`, card.caption],
              [`${where}.cards[${n}].alt`, card.image.alt],
            ]);
          case 'photo': {
            const out: [string, string][] = [];
            if (block.heading !== undefined) {
              out.push([`${where}.heading`, block.heading]);
            }
            out.push([`${where}.alt`, block.image.alt]);
            if (block.note !== undefined) {
              out.push([`${where}.note`, block.note]);
            }
            return out;
          }
          case 'beforeAfter':
            return (['before', 'after'] as const).flatMap(
              (half): [string, string][] => {
                const out: [string, string][] = [];
                if (block.headings !== undefined) {
                  out.push([`${where}.${half}.heading`, block.headings[half]]);
                }
                out.push([`${where}.${half}.alt`, block.images[half].alt]);
                if (block.notes !== undefined) {
                  out.push([`${where}.${half}.note`, block.notes[half]]);
                }
                return out;
              },
            );
        }
      }),
      [`${article.slug}.conclusion`, article.conclusion],
    ];
  });
}

/**
 * How many strings `articleStrings` reads from one block — the exact count
 * below, spelled a second way. A switch over every type rather than a Record
 * of numbers, because a gallery's count depends on its cards and a photo's
 * and a pair's on the words they have; a block type it forgets still fails to
 * compile (the function would fall off its end).
 */
function articleStringsIn(block: ArticleBlock): number {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return 1;
    case 'gallery':
      return 2 * block.cards.length; // a caption and an alt per card
    case 'photo':
      // its alt, and its heading and its note when it has them
      return (
        1 +
        (block.heading === undefined ? 0 : 1) +
        (block.note === undefined ? 0 : 1)
      );
    case 'beforeAfter':
      // two alts, and two headings and two notes when the pair has them
      return (
        2 +
        (block.headings === undefined ? 0 : 2) +
        (block.notes === undefined ? 0 : 2)
      );
  }
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
  ['content/blog', blogStrings],
  ['messages blog.*', blogMessageStrings],
  ['content/blog/articles', articleStrings],
];

/**
 * The words a visitor READS: lib/team's `<k>…</k>` key-word marks removed
 * before any pattern runs. A doctor's philosophy carries them and, since
 * 2026-10-13, every biography paragraph too (CLAUDE.md §15.23 round 7) — and
 * a mark inside a banned phrase („fără <k>durere</k>") would otherwise split
 * it out of every pattern's reach while the page still prints it whole. Then
 * every INVISIBLE character removed — lib/visible-text's `withoutInvisible`,
 * the site's one set of characters that show nothing (its THE UNSEEN SET),
 * less the white space: the soft hyphen U+00AD, the zero-width space U+200B,
 * the word joiner U+2060, the combining grapheme joiner U+034F, the
 * variation selectors, the Mongolian ones, the control characters (NEL
 * U+0085 among them) and their kin. None prints (a soft hyphen only where a
 * line ends on it), yet each splits a word or a phrase in the source out of
 * every pattern's reach; and none is whitespace to `\s`, so the last step
 * would never see them. Until round 1 of lib/visible-text's review
 * (2026-10-21) this step removed the FORMAT characters alone (`\p{Cf}`), and
 * a banned word split by U+034F, U+FE0F, U+FE00 or U+180B — no format
 * characters, all four drawn as nothing — was read in pieces: 0 of 3 hits
 * then, 3 of 3 with the default-ignorable set (the reviewers measured it; the
 * cases below hold it). A BLANK GAP — the braille blank, a Hangul filler, an
 * interlinear annotation character, which an engine draws as a blank width
 * — is read as the SPACE the eye sees, never removed (round 2 of that review:
 * „Cea", the braille blank, „mai" read „Ceamai" until then, out of the
 * superlative's reach). Then every diacritic COMPOSED (NFC): „ă" written as
 * „a" and a combining breve is one letter to the eye and two to a pattern
 * that spells „ă" — the round-2 typescript review measured five banned
 * phrases decomposed („fără durere", „recunoaștere", „reușite", „führend",
 * « résultats garantis ») and all five missed, all five caught composed.
 * Removed FIRST and composed after, so a combining grapheme joiner between
 * a letter and its mark, which blocks composition, is gone before the two
 * are composed. Last, every run of whitespace read as ONE plain space, the
 * space the patterns spell: the blog hero's line breaks (set as lines on a
 * laptop since 2026-10-15, CLAUDE.md §15.39 round 3) and the copy's no-break
 * spaces (U+00A0, French's U+202F) would otherwise split a phrase the same
 * way — and a RUN of them, a space beside a no-break space or a gap, as much
 * as one.
 */
const visible = (text: string): string =>
  withoutInvisible(text.replace(/<\/?k>/g, ''))
    .normalize('NFC')
    .replace(/\s+/g, ' ');

function hits(locale: Locale, text: string): readonly string[] {
  // The ALLOWED list holds what a visitor reads too — written without marks,
  // compared without them — so moving a key word never voids an exception
  // the owner documented (G2 typescript NIT, 2026-10-13).
  const read = visible(text);
  if (ALLOWED.includes(read)) return [];
  return PATTERNS[locale].filter((p) => p.test(read)).map(String);
}

describe('CMSR — no guarantee, superlative, comparison or undocumented award in what the team pages, the reviews, the opener and the blog say', () => {
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
      // The blog's own words: the hero's heading and lead among them.
      expect(blogMessageStrings(locale).map(([where]) => where)).toEqual(
        expect.arrayContaining(['blog.hero.title', 'blog.hero.lead']),
      );
      expect(reviewStrings(locale).length).toBe(reviews.length * 2);
      expect(heroStrings(locale).length).toBe(heroSlides.length * 2);
      // The blog, in this language: every post's title, summary, tags and
      // non-empty picture description, exactly.
      const posts = blogPostsIn(locale);
      expect(posts.length).toBeGreaterThan(0);
      expect(blogStrings(locale)).toHaveLength(
        posts.reduce(
          (sum, post) =>
            sum + 2 + post.tags.length + (post.image.alt === '' ? 0 : 1),
          0,
        ),
      );
    }
    // The articles, in every language: every paragraph, subheading, caption,
    // alt and conclusion of each article's body in that language, exactly.
    expect(blogArticles.length).toBeGreaterThan(0);
    for (const locale of locales) {
      expect(articleStrings(locale), locale).toHaveLength(
        blogArticles.reduce(
          (sum, entry) =>
            sum +
            1 +
            entry.languages[locale].blocks.reduce(
              (count, block) => count + articleStringsIn(block),
              0,
            ),
          0,
        ),
      );
    }
    // …each language its OWN words: five languages, five different readings
    // — a reader that read one language's body under every label would scan
    // the four others' words never.
    const readings = locales.map((locale) =>
      articleStrings(locale)
        .map(([, text]) => text)
        .join('\n'),
    );
    expect(new Set(readings).size).toBe(locales.length);
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

  it.each([
    ['ro', 'Tratăm totul fără <k>durere</k>, cu grijă.'],
    ['ro', 'Oferim rezultate <k>predictibile</k> fiecărui pacient.'],
    ['de', 'Wir versprechen sichere <k>Ergebnisse</k> für jeden Patienten.'],
  ] as const)(
    'reads past the key-word marks in %s: „%s" is refused',
    (locale, text) => {
      // Each case is a MULTI-WORD pattern the mark splits in the SOURCE — red
      // without `visible`, never on the page, where the phrase prints whole.
      // The scan reads what a visitor reads, so the mark hides nothing.
      expect(hits(locale, text).length).toBeGreaterThan(0);
      expect(
        PATTERNS[locale].some((p) => p.test(text)),
        'the raw source escapes every pattern — the case proves the stripping',
      ).toBe(false);
    },
  );

  // WHAT THE SOURCE SPLITS AND A VISITOR READS WHOLE: a banned MULTI-WORD
  // phrase whose words the source parts with something other than one plain
  // space. Every invisible character is built from its code point, so none
  // hides in this file; and each table names its cases in a label column, so
  // no case's text reaches a test's title, where a line break would split the
  // reporter's line and break a `-t` filter.
  const NBSP = String.fromCodePoint(0x00a0);
  const NARROW_NBSP = String.fromCodePoint(0x202f);
  it.each([
    ['ro', 'a line break', 'Ne pasă de tine: cea\nmai bună grijă.'],
    ['de', 'a line break', 'Wir zeigen Ihnen den Weg ohne\nSchmerz.'],
    ['fr', 'a no-break space', `Un soin sans${NBSP}douleur pour vous.`],
    ['it', 'a narrow no-break space', `Una cura senza${NARROW_NBSP}dolore.`],
    [
      'ro',
      'a space and a no-break space in a row',
      `Ne pasă de tine: cea ${NBSP}mai bună grijă.`,
    ],
  ] as const)(
    '%s: reads past %s between the words of a banned phrase',
    (locale, what, text) => {
      // On a laptop the blog hero's line break SHOWS — the phrase runs over
      // two lines — and a no-break space is a space to the eye: either way it
      // is the visitor who reads ONE phrase, and the scan reads it as they
      // do. The last case is a RUN of whitespace: one space to `visible`
      // however many characters make it, never two (the patterns spell one).
      expect(
        hits(locale, text).length,
        `${what} read as one plain space`,
      ).toBeGreaterThan(0);
      expect(
        PATTERNS[locale].some((p) => p.test(text)),
        'the raw source escapes every pattern — the case proves the reading',
      ).toBe(false);
    },
  );

  const SOFT_HYPHEN = String.fromCodePoint(0x00ad);
  const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);
  const WORD_JOINER = String.fromCodePoint(0x2060);
  it.each([
    ['ro', 'a soft hyphen in a word', `Tratament fără du${SOFT_HYPHEN}rere.`],
    ['en', 'a word joiner in a word', `A pain${WORD_JOINER}less visit.`],
    [
      'fr',
      'a zero-width space between two spaces',
      `Un soin sans ${ZERO_WIDTH_SPACE} douleur pour vous.`,
    ],
  ] as const)(
    '%s: reads past %s — an invisible format character',
    (locale, what, text) => {
      // None of the three prints — a soft hyphen only where a line ends on it
      // — yet each splits a banned word or phrase in the SOURCE, and none is
      // whitespace to `\s`. The scan removes every invisible character
      // (lib/visible-text's `withoutInvisible`, these three format characters
      // among them), and removes it BEFORE it reads the whitespace: the last
      // case is red if the two steps swap, for its two spaces would then stay
      // two.
      expect(
        hits(locale, text).length,
        `${what} removed before the words are read`,
      ).toBeGreaterThan(0);
      expect(
        PATTERNS[locale].some((p) => p.test(text)),
        'the raw source escapes every pattern — the case proves the removal',
      ).toBe(false);
    },
  );

  const COMBINING_GRAPHEME_JOINER = String.fromCodePoint(0x034f);
  const PRESENTATION_SELECTOR = String.fromCodePoint(0xfe0f);
  const VARIATION_SELECTOR_1 = String.fromCodePoint(0xfe00);
  const MONGOLIAN_SELECTOR = String.fromCodePoint(0x180b);
  const NEXT_LINE = String.fromCodePoint(0x0085);
  it.each([
    [
      'ro',
      'a combining grapheme joiner (U+034F)',
      `Tratament fără du${COMBINING_GRAPHEME_JOINER}rere.`,
    ],
    [
      'en',
      'the emoji presentation selector (U+FE0F)',
      `A pain${PRESENTATION_SELECTOR}less visit.`,
    ],
    [
      'de',
      'a variation selector (U+FE00)',
      `Eine schmerz${VARIATION_SELECTOR_1}freie Behandlung.`,
    ],
    [
      'fr',
      'a Mongolian free variation selector (U+180B)',
      `Un soin sans dou${MONGOLIAN_SELECTOR}leur.`,
    ],
    [
      'it',
      'NEL (U+0085), a control character',
      `Una cura senza do${NEXT_LINE}lore.`,
    ],
  ] as const)(
    '%s: reads past %s inside a banned word — drawn as nothing, and no format character',
    (locale, what, text) => {
      // Each splits a banned word in the SOURCE, and none is a format
      // character (Cf) or white space to `\s`: the retired reading — the
      // format characters alone removed — left every one in place, and the
      // word in pieces. `visible` removes lib/visible-text's whole set.
      const retired = text
        .replace(/<\/?k>/g, '')
        .replace(/\p{Cf}/gu, '')
        .replace(/\s+/g, ' ');
      expect(
        PATTERNS[locale].some((p) => p.test(retired)),
        `the retired \\p{Cf} reading misses ${what} — the case proves the new set`,
      ).toBe(false);
      expect(
        hits(locale, text).length,
        `${what} removed before the words are read`,
      ).toBeGreaterThan(0);
    },
  );

  // ROUND 2 OF lib/visible-text's REVIEW (2026-10-21): a banned phrase whose
  // diacritics the source writes DECOMPOSED — a letter and its combining
  // mark, which every engine draws as the one letter — and one whose words a
  // BLANK GAP parts. Each built from code points; each escapes every pattern
  // raw, and `visible` reads it whole.
  it.each([
    ['ro', '„fără durere"', 'Tratament fără durere.'],
    ['ro', '„recunoaștere"', 'Recunoaștere pentru grija noastră.'],
    ['ro', '„reușite"', 'Intervenții reușite, zi de zi.'],
    ['de', '„führend"', 'Eine führende Praxis.'],
    ['fr', '« résultats prévisibles »', 'Des résultats prévisibles.'],
  ] as const)(
    '%s: reads %s written DECOMPOSED — composed (NFC) before the patterns run',
    (locale, _what, composed) => {
      const text = composed.normalize('NFD');
      expect(text, 'the premise: the source decomposes it').not.toBe(composed);
      expect(
        PATTERNS[locale].some((p) => p.test(text)),
        'the raw source escapes every pattern — the case proves the composing',
      ).toBe(false);
      expect(hits(locale, text).length).toBeGreaterThan(0);
    },
  );

  it('removes BEFORE it composes — a combining grapheme joiner between „a" and its breve blocks composition, so composed first „fără" stayed in pieces', () => {
    const text = `Tratament fa${String.fromCodePoint(0x034f, 0x0306)}ră durere.`;
    expect(
      PATTERNS.ro.some((p) => p.test(text)),
      'the raw source escapes every pattern',
    ).toBe(false);
    // The order matters: composed first, the joiner is dropped too late.
    const composedFirst = withoutInvisible(text.normalize('NFC'));
    expect(PATTERNS.ro.some((p) => p.test(composedFirst))).toBe(false);
    expect(hits('ro', text).length).toBeGreaterThan(0);
  });

  it.each([
    ['the braille blank (U+2800)', 0x2800],
    ['a Hangul filler (U+3164)', 0x3164],
    ['an interlinear annotation anchor (U+FFF9)', 0xfff9],
  ] as const)(
    'reads %s between the words of a banned phrase as the SPACE the eye sees — never „Ceamai"',
    (_what, gap) => {
      const blank = String.fromCodePoint(gap);
      const text = `Cea${blank}mai${blank}bună clinică.`;
      expect(
        PATTERNS.ro.some((p) => p.test(text)),
        'the raw source escapes every pattern — the case proves the reading',
      ).toBe(false);
      expect(visible(text)).toBe('Cea mai bună clinică.');
      expect(hits('ro', text).length).toBeGreaterThan(0);
    },
  );

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
      // Written as it reads: `hits` compares an exception with what `visible`
      // makes of a string, so an entry carrying a mark, an invisible
      // character, a line break, a no-break space or two spaces in a row
      // would never match anything.
      expect(
        visible(text),
        'write it as visible() reads it: no <k> marks, no invisible characters, every run of whitespace one U+0020',
      ).toBe(text);
    }
  });
});
