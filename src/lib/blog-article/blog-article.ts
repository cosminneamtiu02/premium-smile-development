import cumItiAlegiPeriutaDeDinti from '../../content/blog/articles/cum-iti-alegi-periuta-de-dinti.json';
import { locales, type Locale } from '../../i18n/locales';
import { posts, type BlogPostEntry } from '../blog/blog';
import type { ImagePath } from '../image-path/image-path';
import { isImagePath, isRecord, keyProblems } from '../json-shape/json-shape';
import { doctors, type Doctor } from '../team/team';
import {
  hasVisibleLetter,
  hasVisibleWord,
  isFinishedText,
  spelled,
  whyUnfinished,
} from '../visible-text/visible-text';

// lib/blog-article — THE BLOG'S ARTICLES: the body of a post, one JSON file
// per article, read and checked once, at build, in each of the site's five
// languages. React-free DATA (CLAUDE.md §4's foundation ring, fenced by
// tests/unit/lib-react-free.test.ts), and nothing in ui/ may import it. Its
// readers, every one at build: the article route (app/[locale]/blog/[slug]/),
// which populates sections/PostPage from it; the blog list's populator
// (app/[locale]/blog/populate.ts), which asks it the article each card opens
// (`articleSlugFor`) and the doctor each card names (`articleAuthor`); and,
// through that populator's `postCard`, the Home page's articles band
// (app/[locale]/(home)/populate.ts). So a malformed article fails the build
// of the Home page as well as the blog's, on purpose: every card that links
// to an article is built from this module, whose checks run the first time
// it is imported (THE CHECKS AT LOAD). Built on the article page's lane
// (CLAUDE.md §15.39 round 4), 2026-10-14, on lib/blog's model, idiom for
// idiom; in every language since 2026-10-15, the way the list came to every
// language the day before (CLAUDE.md §15.39 round 3 — the owner, of the
// blog: "internationalise and add that blog on every language").
//
// ── WHY JSON, ONE FILE PER ARTICLE (the owner's answer to the planner's
// question, 2026-10-14: "JSON per article"; the three MDX packages §3 had
// reserved for the blog left the project the same day, never used). An
// article is written by hand, like posts.json, so a plain file the owner
// edits is the right tool — and an article is long, so each one has a file
// of its own: an edit to one article is a diff of one file, and the folder's
// listing is the list of articles. What a .ts module
// would have checked while compiling, `parseArticle` checks while BUILDING:
// every file is handed over as `unknown` (REGISTRY's own type, below — lib/
// blog's `raw as unknown`), so nothing reaches a page unless it passed, and a
// malformed file fails `next build` naming the file, the block, the language
// and the field — never a page that renders "undefined", never a German page
// that quietly shows another language's paragraph.
//
// ── AN ARTICLE IS THE BODY OF A POST. Its title, cover picture, date,
// author, tags and reading time live in src/content/blog/posts.json (lib/
// blog), ONCE; an article file holds only what the list's card does not show.
// The FILE NAME IS THE SLUG — the post's slug, and the page's address in
// every language, /{locale}/blog/<slug>/ — so the two files meet by name.
//
// ── EVERY LANGUAGE, IN ONE FILE (posts.json's idiom, applied to every
// block): a block's FACTS are written once — its type, a gallery's mode and
// cards, every picture's file — and its WORDS beside them in each of the
// five languages, the locale manifest's (src/i18n/locales.ts). So the five
// languages cannot disagree about what the article IS: the same blocks, in
// the same order, around the same pictures, by construction — and the same
// headings and notes above and under them, since a photo's optional words
// are written in all five languages or in none (THE PHOTO); only the words
// differ. `parseArticle` refuses a language missing, a sixth one the site
// does not route, a field missing or misspelt in any one of them — and hands
// back the article in EACH language with the one shape a page reads
// (`Article`, one language's blocks and conclusion — the shape it had while
// the bodies were Romanian alone), so sections/PostPage and the route's block
// mapping never learn how many languages there are. The route picks the
// page's own (`languages[locale]`); every language has its page, its words
// and its post's words (lib/blog's `postsIn`). And the words must DIFFER:
// tests/unit/blog-article-data.test.ts refuses a paragraph, a note, a
// picture's alt or the conclusion that reads the same in two languages —
// what a copy-paste left untranslated looks like. The alt is held to it
// since 2026-10-20: a Romanian alt on the German page is spoken under the
// page's lang="de" (SC 3.1.2), and it is the one text a sighted proofreader
// never sees. A label — a subheading, a caption, a photo's heading — is not:
// it may honestly read alike in two languages (a name, „Implant").
//
// ── THE REGISTRY: one static `import` per article and one line in REGISTRY,
// keyed by its slug. Static, because lib is imported where no file system
// exists (the article's story twin renders in a browser, and the export has
// no server, §16), and because a static import is what carries the words into
// the page at build. An article ships when its line is added:
// tests/unit/blog-article-data.test.ts holds the folder and the registry equal
// both ways and reads every file again under its own name, so a line whose
// key imports another article's file fails CI too.
//
// ── THE FILE'S SHAPE: { "blocks": [ … ], "conclusion": { … } }, exactly
// these two keys. `blocks` is the article from top to bottom, never empty,
// each block exactly its type's keys; every `words` holds exactly the five
// languages, "ro", "en", "de", "fr" and "it":
//   { "type": "paragraph",                 one paragraph of reading text
//     "words": { "ro": "…", "en": "…", … } }
//   { "type": "heading",                   a subheading, the owner's „smaller
//     "words": { "ro": "…", … } }          headings"
//   { "type": "gallery",                   a carousel of picture cards
//     "mode": "loop" | "bounded",          (sections/CardCarousel, below)
//     "cards": [ { "image": { "src": "/images/…" },
//                  "words": { "ro": { "caption": "…", "alt": "…" },
//                             … } }, … ] }
//   { "type": "photo",                     one picture as wide as the
//     "image": { "src": "/images/…" },     article — a heading above it and
//     "words": {                           a note under it, both optional
//       "ro": { "heading": "…",            (THE PHOTO, below)
//               "alt": "…",
//               "note": "…" },
//       … } }
//   { "type": "beforeAfter",               two photos side by side and
//     "before": {                          separated by the line the
//       "image": { "src": "/images/…" },   conclusion wears (the owner: "a
//       "words": {                         before and after separated by the
//         "ro": { "heading": "…",          same line") — each half a photo,
//                 "alt": "…",              the two halves ONE shape (THE
//                 "note": "…" },           PAIR IS ONE SHAPE, below)
//         … } },
//     "after": { …the same… } }
// `conclusion` is the author's closing words in each language, printed last
// under the quote mark beside the doctor's photo, name and specialty
// (sections/PostConclusion). It is not a block because it is always there and
// always last. Every text is FINISHED, in every language: it is well-formed
// (no lone surrogate, since round 2 of lib/visible-text's review), it SHOWS
// something — at least one character outside lib/visible-text's THE UNSEEN
// SET, so not white space, a control or a character drawn invisibly — and is
// trimmed (lib/visible-text's `isFinishedText`, since 2026-10-20 — a
// zero-width space, a soft hyphen or a Hangul filler alone shows nothing, and
// trimming keeps every one of them, so until then such a paragraph passed the
// build and drew a blank line). A picture lives under /images/ (§11's
// folder), and its alt is NEVER empty in any language — a photo is what its
// place in the text is about, a before/after picture shows what a treatment
// changed, and a gallery's picture is what its card is about: information,
// not decoration (a cover in posts.json may leave its alt empty: lib/blog's
// THE TEXTS). Nor is an alt ever WORDLESS (2026-10-20): it holds at least
// one letter, of any script, that is DRAWN (lib/visible-text's
// `hasVisibleLetter` — a Hangul filler is a letter drawn as nothing), since a
// dot, a dash or a number alone describes nothing — `parseAlt`. A LABEL — a
// subheading, a gallery card's caption, a photo's heading and each half of a
// pair's — holds a letter OR A DIGIT that shows (`hasVisibleWord`, round 1
// of lib/visible-text's review, 2026-10-21): it may honestly be a number
// alone, a pair headed „2019" and „2024", but a label of marks alone („.",
// „…", „🦷") is a heading or a caption with no name (SC 2.4.6). Every
// refusal says which condition failed and quotes the value, each invisible
// character by its code point (`whyUnfinished`, `spelled`) — since round 2 of
// lib/visible-text's review (2026-10-21) a block's type, a gallery's mode, a
// picture's path and a registered slug too. A key the reader does not know is
// refused, quoted the same way (lib/json-shape's `keyProblems`), so a typo
// („tetx", „noet") is a build error rather than a paragraph, or a note, that
// silently vanished.
//
// ── THE PHOTO — the owner, verbatim (2026-10-15): "the blog image section
// has to have optionally a heading or not the image as it is now on inaite
// dupa as shape but wide as the article as it is a single standing blog
// section and the text with note beneath also optionall". One picture on its
// own, as wide as the article, a heading above it and a NOTE under it, each
// OPTIONAL — and each written in all five languages or in none: a heading in
// four of them is a translation forgotten, never a German page quietly
// without the heading the others print, so `parseArticle` refuses it naming
// the block, the first language without it and the field. Whether a photo
// has a heading or a note is therefore one answer for every language, like
// its file. A field the file holds is visible text, trimmed, like any other
// — a photo with no note LEAVES THE KEY OUT — and the parsed block has no key
// for it either: an absent field is an ABSENT key, never a `note` whose value
// is `undefined` (blog-article.test.ts holds it with strict equality).
// THE NOTE is the owner's grey line under a picture (the same message: "each
// photo has to have a max 2 row grays text … starting with "Note: ". i want
// abosultley no emphasis here, jsut the gray text on a maximum of 2 rows").
// The file holds its TEXT alone; the lead-in is the PAGE's word,
// `blog.article.note` („Notă: {note}" — „Hinweis", « Note », «Nota» in the
// others), so no article spells it differently from the next. A note's text
// therefore starts after a colon: in lower case in ro, en, fr and it unless
// it opens on a proper noun; German starts it with a capital, as German
// starts a whole sentence after a colon and writes every noun. Its TWO LINES
// at most are a promise about drawn text, so they are measured where the
// text is drawn — in the real face, the lead-in included — never counted
// here.
//
// ── THE PAIR IS ONE SHAPE — the owner, verbatim (2026-10-15): "now this
// section with before and after is to be derived from another section which
// is just like a "blog image section" … now i want you t refactor it as 2
// section as the blog photo and then blog photo turns into a before and after
// section", and minutes later: "every instantiation possible of a inainte and
// dupa wher eboth left and right must be same instance of blog image, so no
// inaitnte with note and dupa without note and here headings sould be
// replaceble, not mandatory before and after and here headings should also be
// optional". So each half of a before/after IS a photo — its words a photo's,
// read by the same function, `parsePhoto` — and the two halves are ONE
// shape: a heading on both or on neither, a note on both or on neither (and
// each, inside its half, in all five languages or in none). Halves that
// differ are refused, naming the block and what differs. The parsed block
// GROUPS what its halves hold — `images`, and `headings` and `notes` only
// when the pair has them, each an `ArticlePair`, the before first — so past
// the parser a pair with one note cannot even be written down, and sections/
// BeforeAfter takes exactly those three. The headings are the file's own
// words ("not mandatory before and after"): „Înainte" and „După" are what one
// pair of the demo says, not a rule. WITHOUT headings, the ALTS say which
// half is which — sections/BeforeAfter's line between the two is decoration,
// and a screen reader meets the before first: the demo's two pairs with no
// heading open the before's alt on „Înainte:" and the after's on „După:" in
// Romanian, and on each language's own two words in the others (2026-10-20),
// held for every pair without headings by tests/unit/blog-article-data.test.ts.
//
// ── THE GALLERY is the owner's carousel (2026-10-14: "for: Galeria foto vine
// în curând — place that caroussell"; before it: "2 modes, one rotating
// carousell, one with iamges left and right with full stop"), drawn by
// sections/CardCarousel in the place the „Galerie foto · în curând"
// placeholder held. `mode` is the carousel's: "loop" rotates by itself and
// goes round, "bounded" runs end to end and never wraps — since 2026-10-16
// it turns round at each end (the owner: "have simple list with cange
// direction onc eend reached"); how either moves is sections/CardCarousel's,
// and this file only names the mode. An article's gallery shows THREE cards:
// the five-card window is the Home page's since 2026-10-17 (the owner: "the
// fiver option … do not represent it in the article, represent it on home
// page"), so the file names no window — a `visible` key is refused as
// unknown. A gallery holds at least two cards, since one card is a picture,
// not a carousel. The mode's union is sections/CardCarousel's own
// `CardCarouselMode`, spelled again here because lib never imports a section
// (§4): the route that hands one to the other, the one tier that may import
// both, holds them equal. THE CARD IS PROVISIONAL (the owner: "alwas hold a card and i'll
// decide later on card"): a picture and a caption for now, and the shape
// changes the day he decides what a card is — this type, `parseCard` and the
// demo's cards together.
//
// ── THE AUTHOR is the post's `author` („Dr. Nicu Elena Alina" — ONE string
// for every language, lib/blog's header), and it must be EXACTLY ONE lib/team
// doctor's name, honorific included (`articleAuthor`). The conclusion prints
// that doctor's face, name and specialty from lib/team (the owner: "the circle
// with photo of doctor like in phone mode at the docotr cards in main page and
// next to it the dr name as headinf with eyebrow specailization of the
// doctor"), so an author who is nobody would be a signature with no face —
// refused at load. The match does not depend on the page's language: the
// doctor is found ONCE per post. It reads the doctor's name as lib/team spells
// it in ROMANIAN (`AUTHOR_SPELLING`) — the one spelling the field is written
// in, which tests/unit/blog-data.test.ts holds every post's author to —
// because lib/team does NOT spell a doctor's name the same in all five: its
// French drops the honorific's point („Dr Nicu Elena Alina"), so a match in
// "whichever language" would either fail in French or accept a spelling no
// post may carry. The page then prints the doctor's name and specialty as
// lib/team spells them in ITS language — and so does the post's card on the
// list since 2026-10-15, which printed the post's own string until then, „Dr."
// on a French list above a French article signed „Dr". French typesetting
// writes the abbreviation with no point because it ends on the word's last
// letter (Docteur → Dr, as Madame → Mme; Monsieur → M. keeps one), the rule
// the owner asked to be settled ("idk what the standard is in french if they
// use dr or dr., so decide for me"), so the whole French site reads „Dr".
//
// ── THE STAND-IN — the owner, verbatim (2026-10-15): "on click of card
// anywhere it should take you to article. but for now it should be a dummy
// article and all should point to same article". A post's card on the list
// opens its post's OWN article — the page at the post's slug — and a post
// that has none yet opens THE STAND-IN, `STAND_IN_ARTICLE`, the one article
// the blog has (`articleSlugFor`, which the list's populator asks for every
// card). So today every card opens the same page, the owner's "dummy"; the
// day an article is registered, its post's card opens it with no edit
// anywhere else, and the posts still without one go on opening the stand-in.
// The stand-in is a registered article like any other, read and checked at
// load; a list that asks while it is gone is refused by name, so the build
// fails rather than linking every card to a page that does not exist.
// Once every post has its article the stand-in has no reader and leaves with
// this paragraph (the owner's "no dead code").
//
// ── THE CHECKS AT LOAD (`loadArticles`, which builds `articles`): every
// registered slug is a post in lib/blog's `posts` (an article with no post
// would be a page with no title, no picture and no author), every article
// parses in every language, and every article's author resolves. They run
// the first time this module is imported, so `next build` fails naming the
// article.
//
// ── READING TIME: the page prints its POST's `readingMinutes` — lib/blog's
// fact, the very number the post's card on the list prints — through the
// blog's ONE reading-time sentence, `blog.readingTime` („{minutes} min de
// citit", shared by the card and the page), so a post's card and the page of
// ITS OWN article can never print two times. THE STAND-IN breaks that for as
// long as it stands in: a card whose post has no article yet opens the
// stand-in's page, which prints the stand-in's post's 4 minutes, and today 9
// of the 11 such cards announce 3, 5, 6, 7 or 8 (src/content/blog/posts.json)
// — an interim the owner's "dummy" brings with it, like the card's link to
// another post's page (SC 2.4.4), gone post by post as each gets its own
// article (BACKLOG.md entry 7). What this module counts is the MEASURE the
// field is held to: `readingMinutes` is an article's words ÷ WORDS_PER_MINUTE,
// rounded UP and never less than one minute. 200 a minute is a common
// estimate for adults reading silently, and older readers are slower: the
// site's own records time its rotators' words at ~150 a minute (CLAUDE.md
// §15.18's reading-time rider) and at ~120 for an older reader (§15.21). At
// 150 the Romanian demo takes 5 minutes and at 120 it takes 7, where its
// card says 4. WORDS_PER_MINUTE is the owner's lever — the minutes the site
// shows are his call; a new rate moves the measure, and the data test turns
// red until each article's post follows it. The words are what the eye reads
// on the page: every paragraph and subheading, every gallery card's caption,
// every heading and note of a photo or of a pair's two halves, and the
// conclusion — a word being a run of non-space characters that holds a
// letter or a digit that shows (lib/visible-text's `hasVisibleWord`, the
// rule a label is held to), so a mark standing alone is none (French sets „:"
// and „?" apart with a narrow no-break space: read as words, they added 6 to
// the demo's French count until 2026-10-20); NOT the alts, which a sighted reader
// never sees, and NOT a note's lead-in („Notă: "), which is the page's word
// and no article's. tests/unit/blog-article-data.test.ts holds every post's
// field EQUAL to its Romanian article's count — the language the article is
// written in first — and every other language's count within ONE minute of
// it: a translation runs longer or shorter than its source (the demo counts
// 728 words in Romanian, 791 in English, 767 in German, 838 in French and 787
// in Italian — 4 minutes in each language but French, whose 838 make 5,
// pinned in blog-article.test.ts), and one number on the card cannot be every
// language's to the word.
//
// ── PLACEHOLDER — TODO(owner), BACKLOG.md entry 7. The one article, „Cum îți
// alegi periuța de dinți", is Claude's draft (2026-10-14), written so the page
// can be seen: ordinary advice, CMSR-clean in all five languages (tests/unit/
// cmsr-scan.test.ts reads every paragraph, subheading, caption, heading,
// note, alt and conclusion in each) and D-DASH-clean, signed by its post's
// author, a real doctor who has neither written nor confirmed it. Its
// ENGLISH, GERMAN, FRENCH AND ITALIAN words are Claude's DRAFTS too
// (2026-10-15), translations of the Romanian for the owner to confirm
// (CLAUDE.md §15.17 — the owner authors content; these were drafted on his
// word), each in the register its message file speaks (en "you", de „Sie",
// fr « vous », it «tu», like ro „tu"), and, like lib/blog's drafts, no draft
// genders the doctor. Its GALLERIES are TWO since 2026-10-17: four from
// 2026-10-16 (the owner: "create instance on 3 and instance of 5 cards on
// ciruclar one both having a total of 8 fake photos in them and i want for
// each also to. have simple list with cange direction onc eend reached. all
// must be instantiated. both with 3 and 5 iteration *and must also have 8
// instances*"), each mode with three cards in its window and with five,
// until the five-card window left the article for the Home page (THE
// GALLERY). Down the page, the rotating carousel („loop") stands in the place
// of the one gallery it had before them, after the two paragraphs on a manual
// or an electric brush, and the end-to-end list („bounded") between the
// subheading „Pentru copii" and its paragraph. Both hold the SAME EIGHT
// CARDS, public/images/demo/gallery-1.jpg … gallery-8.jpg: portrait crops,
// 1080 pixels wide, two of each of the clinic's three photographs (the
// hallway with a treatment room's open door and the waiting room; the work
// counter and the chair under its lamp; two close-ups of the handpieces) and
// two of the Image atom's demo photograph, a close-up of a check-up — gloved
// hands holding a mirror and a probe at an open mouth, which the repository
// records no source for, and which a gallery card captioned and described as
// a bright treatment room until 2026-10-15. Their
// Romanian captions and descriptions were written for them on 2026-10-16,
// and the four other languages' are Claude's drafts, like every other word
// here; the drafts describe a patient in a picture without a gender wherever
// the language allows (a „Person", une « personne », una «persona»). Its PHOTOS
// AND BEFORE/AFTER PAIRS are STAND-INS too (2026-10-15), the clinic's three
// photographs — the waiting room, a treatment room, the handpieces — no
// patient, under Claude's headings and notes, which say what a picture shows
// or that it is an illustration, and claim no result: a real before/after
// needs that patient's written consent (a photograph of someone's teeth is
// health data, GDPR art. 9) and a CMSR check (the advertising guide bans
// unrealistic result imagery). The demo shows EVERY INSTANCE the owner asked
// for, once (the same day: "also add an instance of the single blog image
// with note, with heading and no not and without no heading nor not and with
// note no heading. also add every instantiation possible of a inainte and
// dupa"): four photos — a heading and a note, a heading only, a note only,
// neither — and four pairs — headings and notes (the one still headed
// „Înainte" / „După", whose notes say it is an illustration, not a case),
// headings only (named by the places of a visit, „La sosire" / „În
// cabinet"), notes only, neither — and, with the two galleries, ten picture
// blocks spread through the text, never two in a row. The doctor confirms
// or rewrites it — in every language — before the blog is shown.

/** A picture of an article, with the words that describe it — never empty. */
export type ArticleImage = Readonly<{ src: ImagePath; alt: string }>;

/** Two of a kind — the before first (the header's THE PAIR IS ONE SHAPE). */
export type ArticlePair<T> = Readonly<{ before: T; after: T }>;

/** One card of a gallery: a picture and its caption — PROVISIONAL (the header's THE GALLERY). */
export type ArticleCard = Readonly<{ image: ArticleImage; caption: string }>;

/** One block of an article's body in one language, in the file's order (the header's THE FILE'S SHAPE). */
export type ArticleBlock =
  | Readonly<{ type: 'paragraph'; text: string }>
  | Readonly<{ type: 'heading'; text: string }>
  | Readonly<{
      type: 'gallery';
      mode: 'loop' | 'bounded';
      cards: readonly ArticleCard[];
    }>
  | Readonly<{
      type: 'photo';
      image: ArticleImage;
      /** Above the picture — an ABSENT key when the photo has none (the header's THE PHOTO). */
      heading?: string;
      /** Under it, after the page's lead-in („Notă: ") — an ABSENT key when it has none. */
      note?: string;
    }>
  | Readonly<{
      type: 'beforeAfter';
      images: ArticlePair<ArticleImage>;
      /** Both halves' headings, or an ABSENT key — never one (the header's THE PAIR IS ONE SHAPE). */
      headings?: ArticlePair<string>;
      /** Both halves' notes, or an ABSENT key — never one. */
      notes?: ArticlePair<string>;
    }>;

/** One article in ONE language — what a page shows (the header's EVERY LANGUAGE, IN ONE FILE). */
export type Article = Readonly<{
  /** The file's name and its post's slug — the page's address. */
  slug: string;
  blocks: readonly ArticleBlock[];
  /** The author's closing words, always printed last. */
  conclusion: string;
}>;

/**
 * One article as its file holds it once `parseArticle` has checked it: the
 * same body in every language — the same blocks in the same order around the
 * same pictures, each language's own words.
 */
export type ArticleEntry = Readonly<{
  /** The file's name and its post's slug — the page's address in every language. */
  slug: string;
  /** The article in each of the five languages, every one the shape a page reads. */
  languages: Readonly<Record<Locale, Article>>;
}>;

/** A post as the author lookup reads it — lib/blog's entry or one language's post alike. */
export type ArticlePostRef = Pick<BlogPostEntry, 'slug' | 'author'>;

/** The reading rate the reading-time MEASURE assumes — a common adult estimate, and the owner's lever (the header's READING TIME). */
export const WORDS_PER_MINUTE = 200;

/**
 * The language a post's `author` is spelled in: Romanian, lib/team's spelling
 * of the doctor's name there, honorific included (the header's THE AUTHOR —
 * lib/team's French writes „Dr" with no point, so no one language stands for
 * all five).
 */
const AUTHOR_SPELLING = 'ro' as const satisfies Locale;

/** Where the article files live, for the messages. */
const ARTICLES_FOLDER = 'src/content/blog/articles';

/** Where the posts live, for the messages. */
const POSTS_SOURCE = 'src/content/blog/posts.json';

/** An article's file, as a message names it. */
const articleSource = (slug: string): string =>
  `${ARTICLES_FOLDER}/${slug}.json`;

/**
 * Every article the site ships, by its slug — one static import each (the
 * header's THE REGISTRY). The value's type is `unknown` on purpose: the JSON's
 * inferred type never reaches a page, `parseArticle` decides what does.
 */
const REGISTRY: Readonly<Record<string, unknown>> = {
  'cum-iti-alegi-periuta-de-dinti': cumItiAlegiPeriutaDeDinti,
};

const ARTICLE_KEYS = ['blocks', 'conclusion'] as const;
/** A gallery card and a half of a pair alike: the picture once, the words per language. */
const PICTURE_KEYS = ['image', 'words'] as const;
const IMAGE_KEYS = ['src'] as const;
/** A gallery card's words in one language, exactly. */
const CARD_WORD_KEYS = ['caption', 'alt'] as const;
/** A photo's words in one language: the alt, always … */
const PHOTO_WORD_KEYS = ['alt'] as const;
/** … and these two when the photo has them — in all five languages or in none (the header's THE PHOTO). */
const PHOTO_OPTIONAL_KEYS = ['heading', 'note'] as const;

/** Each block type and the keys its block has, exactly — one row per type, or it does not compile. */
const BLOCK_KEYS = {
  paragraph: ['type', 'words'],
  heading: ['type', 'words'],
  gallery: ['type', 'mode', 'cards'],
  photo: ['type', 'image', 'words'],
  beforeAfter: ['type', 'before', 'after'],
} as const satisfies Readonly<Record<ArticleBlock['type'], readonly string[]>>;

/** The one block with settings of its own (the header's THE GALLERY). */
type GalleryBlock = Extract<ArticleBlock, { type: 'gallery' }>;

/** The gallery's modes — every value of its union, or it does not compile. */
const GALLERY_MODES = {
  loop: true,
  bounded: true,
} as const satisfies Readonly<Record<GalleryBlock['mode'], true>>;

/** The fewest cards a gallery holds: one card is a picture, not a carousel. */
const MIN_GALLERY_CARDS = 2;

/** Something in each of the five languages. */
type InEvery<T> = Readonly<Record<Locale, T>>;

/** A message's way out: a const with a DECLARED type, so a call narrows (lib/blog's `fail` note). */
type Fail = (message: string) => never;

/** A photo's two optional fields: a heading above it, a note under it (the header's THE PHOTO). */
type PhotoField = (typeof PHOTO_OPTIONAL_KEYS)[number];

/** A photo's words in ONE language as they are read: its alt, and each optional field or `undefined`. */
type PhotoWords = Readonly<{
  heading: string | undefined;
  alt: string;
  note: string | undefined;
}>;

/**
 * A photo — a photo block, or one half of a pair — once checked in every
 * language: its file once, its alt in each language, and each optional field
 * in all five languages or in none. Internal: a page reads `ArticleBlock`,
 * where a field the photo lacks is an absent key, never this `undefined`.
 */
type PhotoEntry = Readonly<{
  src: ImagePath;
  alt: InEvery<string>;
  heading: InEvery<string> | undefined;
  note: InEvery<string> | undefined;
}>;

/** What each kind of picture is, for its alt's message (the header's THE FILE'S SHAPE). */
const PICTURE = {
  card: 'a gallery picture',
  photo: 'a photo of the article',
  half: 'a before/after picture',
} as const;

/** One of the five block types the header lists. */
function isBlockType(value: unknown): value is ArticleBlock['type'] {
  return typeof value === 'string' && Object.hasOwn(BLOCK_KEYS, value);
}

/** One of the gallery's two modes. */
function isGalleryMode(value: unknown): value is GalleryBlock['mode'] {
  return typeof value === 'string' && Object.hasOwn(GALLERY_MODES, value);
}

/**
 * `make` for each of the five languages, spelled one by one in the manifest's
 * order — lib/blog's idiom: a sixth locale added to the manifest does not
 * compile until it is read here too, and no cast builds the record.
 */
function inEvery<T>(make: (locale: Locale) => T): InEvery<T> {
  return {
    ro: make('ro'),
    en: make('en'),
    de: make('de'),
    fr: make('fr'),
    it: make('it'),
  };
}

/**
 * Checks a record of the five languages — exactly the manifest's, no more and
 * no fewer — and each language's value with `read`, which is handed that
 * language's PATH (`words.de`) to name in its message. Throws through
 * `fail`, naming `field` and the language.
 */
function parseLanguages<T>(
  value: unknown,
  field: string,
  fail: Fail,
  read: (entry: unknown, path: string) => T,
): InEvery<T> {
  if (!isRecord(value)) {
    return fail(`"${field}" must be an object { ${locales.join(', ')} }`);
  }
  const languages = keyProblems(value, locales, 'language');
  if (languages.length > 0) {
    fail(
      `"${field}": ${languages.join('; ')} — an article is written in exactly ${locales.join(', ')}`,
    );
  }
  return inEvery((locale) => read(value[locale], `${field}.${locale}`));
}

/**
 * A text in each of the five languages — `field`'s every value FINISHED text
 * (`isFinishedText`): visible text, trimmed. A LABEL — `label` names it for
 * the message, „a subheading" — also holds a letter or a digit that shows
 * (`hasVisibleWord`, the header's THE FILE'S SHAPE).
 */
function parseTexts(
  value: unknown,
  field: string,
  fail: Fail,
  label?: string,
): InEvery<string> {
  return parseLanguages(value, field, fail, (text, path): string => {
    if (!isFinishedText(text)) {
      return fail(
        `"${path}" must be visible text, trimmed: ${whyUnfinished(text)}`,
      );
    }
    if (label !== undefined && !hasVisibleWord(text)) {
      return fail(namesNothing(path, text, label));
    }
    return text;
  });
}

/** The refusal of a LABEL that shows only marks: it names nothing (the
 *  header's THE FILE'S SHAPE — `hasVisibleWord`). */
function namesNothing(path: string, text: string, label: string): string {
  return `"${path}" names nothing: it holds no letter or digit that shows, got ${spelled(text)} — ${label} of marks alone has no name`;
}

/**
 * keyProblems for words with OPTIONAL keys too: each of `optional` is allowed
 * when the record has it and never missing when it has not; every other key
 * reads as keyProblems reads it. This file's own — lib/blog has no optional
 * key — and built on lib/json-shape's `keyProblems`, so its messages are that
 * one's, every key quoted `spelled`.
 */
function shapeProblems(
  record: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
): string[] {
  return keyProblems(record, [
    ...required,
    ...optional.filter((key) => Object.hasOwn(record, key)),
  ]);
}

/**
 * Checks a picture's `image` — exactly { src }, a path under /images/, the
 * picture written ONCE for every language — and returns its path. Throws
 * through `fail`.
 */
function parseSrc(image: unknown, fail: Fail): ImagePath {
  if (!isRecord(image)) return fail('"image" must be an object { src }');
  const imageKeys = keyProblems(image, IMAGE_KEYS);
  if (imageKeys.length > 0) fail(`"image": ${imageKeys.join('; ')}`);
  const { src } = image;
  if (typeof src !== 'string' || !isImagePath(src)) {
    return fail(
      `"image.src" must be a path under /images/, got ${spelled(src)}`,
    );
  }
  return src;
}

/**
 * A picture's alt in one language: finished text (`isFinishedText`),
 * describing the picture — `what` it is, for the message, is information —
 * in WORDS, so at least one letter, of any script, that is drawn:
 * lib/visible-text's `hasVisibleLetter` (its THE LETTER RULE). Finished text
 * alone lets a dot or a number through, and `\p{L}` alone a Hangul filler —
 * a letter drawn as nothing — beside a dot, which passed until PostPhoto's
 * round-3 reviews (2026-10-20) (the header's THE FILE'S SHAPE). Throws
 * through `fail`, naming `path`, the condition and the value.
 */
function parseAlt(
  words: Record<string, unknown>,
  path: string,
  what: string,
  fail: Fail,
): string {
  const { alt } = words;
  if (!isFinishedText(alt)) {
    return fail(
      `"${path}.alt" must describe the picture, visible text, trimmed: ${whyUnfinished(alt)} — ${what} is information, never decoration`,
    );
  }
  if (!hasVisibleLetter(alt)) {
    return fail(
      `"${path}.alt" must describe the picture in words, and it holds no visible letter, got ${spelled(alt)} — a mark or a number alone describes nothing: ${what} is information, never decoration`,
    );
  }
  return alt;
}

/**
 * Checks one card of a gallery: exactly { image, words }, the picture once
 * (`parseSrc`), and in each of the five languages exactly { caption, alt },
 * both finished text — the caption a LABEL, holding a letter or a digit that
 * shows, and the alt words (`parseAlt`) — (the header's THE GALLERY — THE
 * CARD IS PROVISIONAL). Throws a TypeError naming `where`, the language and
 * the field.
 */
function parseCard(value: unknown, where: string): InEvery<ArticleCard> {
  // Load-bearing annotation — lib/blog's `fail` note: only a const with a
  // DECLARED type narrows after a call that never returns, so every check
  // below narrows its field and the card is built with no cast.
  const fail: Fail = (message) => {
    throw new TypeError(`${where}: ${message}`);
  };

  if (!isRecord(value)) {
    return fail(`expected an object { ${PICTURE_KEYS.join(', ')} }`);
  }
  const keys = keyProblems(value, PICTURE_KEYS);
  if (keys.length > 0) {
    fail(`${keys.join('; ')} — a card has exactly ${PICTURE_KEYS.join(', ')}`);
  }
  const src = parseSrc(value.image, fail);

  return parseLanguages(
    value.words,
    'words',
    fail,
    (words, path): ArticleCard => {
      if (!isRecord(words)) {
        return fail(
          `"${path}" must be an object { ${CARD_WORD_KEYS.join(', ')} }`,
        );
      }
      const problems = keyProblems(words, CARD_WORD_KEYS);
      if (problems.length > 0) {
        fail(
          `"${path}": ${problems.join('; ')} — a card's words are exactly ${CARD_WORD_KEYS.join(', ')}`,
        );
      }
      const { caption } = words;
      if (!isFinishedText(caption)) {
        return fail(
          `"${path}.caption" must be visible text, trimmed: ${whyUnfinished(caption)}`,
        );
      }
      if (!hasVisibleWord(caption)) {
        return fail(namesNothing(`${path}.caption`, caption, 'a caption'));
      }
      return {
        image: { src, alt: parseAlt(words, path, PICTURE.card, fail) },
        caption,
      };
    },
  );
}

/**
 * A photo's optional field in ONE language: `undefined` when the key is
 * absent, else finished text — a field written empty is refused, since a
 * photo without one leaves the key out (the header's THE PHOTO) — and a
 * heading, a LABEL, holds a letter or a digit that shows (THE FILE'S SHAPE).
 * Throws through `fail`, naming `path`, the field, the condition and the
 * value.
 */
function optionalText(
  words: Record<string, unknown>,
  field: PhotoField,
  path: string,
  fail: Fail,
): string | undefined {
  if (!Object.hasOwn(words, field)) return undefined;
  const text = words[field];
  if (!isFinishedText(text)) {
    return fail(
      `"${path}.${field}" must be visible text, trimmed: ${whyUnfinished(text)} — a photo with no ${field} leaves the key out, in every language`,
    );
  }
  if (field === 'heading' && !hasVisibleWord(text)) {
    return fail(namesNothing(`${path}.heading`, text, 'a heading'));
  }
  return text;
}

/**
 * One optional field across the five languages: `undefined` when no language
 * has it, the five texts when every one has it — and, when only some have it,
 * a refusal naming the first language without it, the field and the
 * languages that have one (the header's THE PHOTO: a translation forgotten).
 */
function allOrNone(
  texts: InEvery<string | undefined>,
  field: PhotoField,
  fail: Fail,
): InEvery<string> | undefined {
  const having = locales.filter((locale) => texts[locale] !== undefined);
  if (having.length === 0) return undefined;
  return inEvery((locale): string => {
    const text = texts[locale];
    if (text === undefined) {
      return fail(
        `"words.${locale}" has no ${field}, while ${having.join(', ')} ${having.length === 1 ? 'has' : 'have'} one — a photo's ${field} is written in all five languages or in none`,
      );
    }
    return text;
  });
}

/**
 * Checks a photo — a photo block's, or one half of a pair's — from its
 * `image` and its `words` (the caller checks the keys around them): the
 * picture once (`parseSrc`); in each of the five languages an object holding
 * the alt and, when the photo has them, a heading and a note, nothing else;
 * every alt describing the picture (`what`, for the message); and each
 * optional field in all five languages or in none (the header's THE PHOTO).
 * Throws through `fail`, naming the language and the field.
 */
function parsePhoto(
  image: unknown,
  words: unknown,
  what: string,
  fail: Fail,
): PhotoEntry {
  const src = parseSrc(image, fail);
  const each = parseLanguages(
    words,
    'words',
    fail,
    (entry, path): PhotoWords => {
      if (!isRecord(entry)) {
        return fail(`"${path}" must be an object { heading?, alt, note? }`);
      }
      const problems = shapeProblems(
        entry,
        PHOTO_WORD_KEYS,
        PHOTO_OPTIONAL_KEYS,
      );
      if (problems.length > 0) {
        fail(
          `"${path}": ${problems.join('; ')} — a photo's words are ${PHOTO_WORD_KEYS.join(', ')} and, when it has them, ${PHOTO_OPTIONAL_KEYS.join(' and ')}`,
        );
      }
      return {
        heading: optionalText(entry, 'heading', path, fail),
        alt: parseAlt(entry, path, what, fail),
        note: optionalText(entry, 'note', path, fail),
      };
    },
  );
  return {
    src,
    alt: inEvery((locale) => each[locale].alt),
    heading: allOrNone(
      inEvery((locale) => each[locale].heading),
      'heading',
      fail,
    ),
    note: allOrNone(
      inEvery((locale) => each[locale].note),
      'note',
      fail,
    ),
  };
}

/**
 * Checks one half of a before/after — a photo (the header's THE PAIR IS ONE
 * SHAPE): exactly { image, words }, read by `parsePhoto`. Throws a TypeError
 * naming `where` (the block and the half), the language and the field.
 */
function parseHalf(value: unknown, where: string): PhotoEntry {
  const fail: Fail = (message) => {
    throw new TypeError(`${where}: ${message}`);
  };

  if (!isRecord(value)) {
    return fail(`expected an object { ${PICTURE_KEYS.join(', ')} }`);
  }
  const keys = keyProblems(value, PICTURE_KEYS);
  if (keys.length > 0) {
    fail(
      `${keys.join('; ')} — each half of a pair is a photo, exactly ${PICTURE_KEYS.join(', ')}`,
    );
  }
  return parsePhoto(value.image, value.words, PICTURE.half, fail);
}

/**
 * One optional field across a pair's two halves (the header's THE PAIR IS
 * ONE SHAPE): `undefined` when neither half has it, both when both have it —
 * and, when they differ, a refusal naming which half has it and which has
 * none.
 */
function pairOf<T>(
  before: T | undefined,
  after: T | undefined,
  field: PhotoField,
  fail: Fail,
): ArticlePair<T> | undefined {
  if (before === undefined && after === undefined) return undefined;
  const rule = `a pair is one shape: a ${field} on both halves or on neither`;
  if (before === undefined) {
    return fail(`"after" has a ${field} and "before" has none — ${rule}`);
  }
  if (after === undefined) {
    return fail(`"before" has a ${field} and "after" has none — ${rule}`);
  }
  return { before, after };
}

/** A photo's picture in ONE language: its file and that language's alt. */
function imageIn(photo: PhotoEntry, locale: Locale): ArticleImage {
  return { src: photo.src, alt: photo.alt[locale] };
}

/** A pair of texts in ONE language — both halves' headings, or both halves' notes. */
function pairIn(
  pair: ArticlePair<InEvery<string>>,
  locale: Locale,
): ArticlePair<string> {
  return { before: pair.before[locale], after: pair.after[locale] };
}

/**
 * Checks one block and returns it in each of the five languages. Throws a
 * TypeError naming `base` (the file and the block's number), its type once
 * known, the language and the field.
 */
function parseBlock(entry: unknown, base: string): InEvery<ArticleBlock> {
  let where = base;
  const fail: Fail = (message) => {
    throw new TypeError(`${where}: ${message}`);
  };

  if (!isRecord(entry)) return fail('expected an object with a "type"');
  const { type } = entry;
  if (!isBlockType(type)) {
    return fail(
      `"type" must be one of ${Object.keys(BLOCK_KEYS).join(', ')}, got ${spelled(type)}`,
    );
  }
  where = `${base} (${type})`;
  const keys = keyProblems(entry, BLOCK_KEYS[type]);
  if (keys.length > 0) {
    fail(
      `${keys.join('; ')} — a ${type} block has exactly ${BLOCK_KEYS[type].join(', ')}`,
    );
  }

  switch (type) {
    case 'paragraph':
    case 'heading': {
      // A subheading is a LABEL: a letter or a digit that shows (the
      // header's THE FILE'S SHAPE); a paragraph is prose.
      const texts = parseTexts(
        entry.words,
        'words',
        fail,
        type === 'heading' ? 'a subheading' : undefined,
      );
      return inEvery((locale): ArticleBlock => ({ type, text: texts[locale] }));
    }
    case 'gallery': {
      const { mode, cards } = entry;
      if (!isGalleryMode(mode)) {
        return fail(
          `"mode" must be one of ${Object.keys(GALLERY_MODES).join(', ')}, got ${spelled(mode)}`,
        );
      }
      if (!Array.isArray(cards)) {
        return fail('"cards" must be an array of cards');
      }
      if (cards.length < MIN_GALLERY_CARDS) {
        fail(
          `"cards" holds ${cards.length}, a gallery holds at least ${MIN_GALLERY_CARDS}: one card is a picture, not a carousel`,
        );
      }
      const parsed = cards.map((card: unknown, index): InEvery<ArticleCard> =>
        parseCard(card, `${where}, card ${index + 1}`),
      );
      return inEvery((locale): ArticleBlock => ({
        type,
        mode,
        cards: parsed.map((card) => card[locale]),
      }));
    }
    case 'photo': {
      const photo = parsePhoto(entry.image, entry.words, PICTURE.photo, fail);
      const { heading, note } = photo;
      // A field the photo lacks stays an ABSENT key in every language — never
      // a key holding `undefined` (the header's THE PHOTO).
      return inEvery((locale): ArticleBlock => ({
        type,
        image: imageIn(photo, locale),
        ...(heading === undefined ? {} : { heading: heading[locale] }),
        ...(note === undefined ? {} : { note: note[locale] }),
      }));
    }
    case 'beforeAfter': {
      const before = parseHalf(entry.before, `${where}, "before"`);
      const after = parseHalf(entry.after, `${where}, "after"`);
      // THE PAIR IS ONE SHAPE: refused here, naming the block and what
      // differs, unless both halves have the field or neither does.
      const headings = pairOf(before.heading, after.heading, 'heading', fail);
      const notes = pairOf(before.note, after.note, 'note', fail);
      return inEvery((locale): ArticleBlock => ({
        type,
        images: {
          before: imageIn(before, locale),
          after: imageIn(after, locale),
        },
        ...(headings === undefined
          ? {}
          : { headings: pairIn(headings, locale) }),
        ...(notes === undefined ? {} : { notes: pairIn(notes, locale) }),
      }));
    }
  }
}

/**
 * Checks one article file's JSON and returns the article in each of the five
 * languages, typed. Throws a TypeError naming the file (`source`, by default
 * the article's own path), the block's number and type once known, the
 * language and the field.
 */
export function parseArticle(
  input: unknown,
  slug: string,
  source: string = articleSource(slug),
): ArticleEntry {
  const fail: Fail = (message) => {
    throw new TypeError(`${source}: ${message}`);
  };

  if (!isRecord(input)) {
    return fail(
      `expected an object { "blocks": […], "conclusion": { ${locales.join(', ')} } }`,
    );
  }
  const keys = keyProblems(input, ARTICLE_KEYS);
  if (keys.length > 0) {
    fail(
      `${keys.join('; ')} — an article has exactly ${ARTICLE_KEYS.join(', ')}`,
    );
  }

  const { blocks, conclusion } = input;
  if (!Array.isArray(blocks)) {
    return fail('"blocks" must be an array of blocks');
  }
  if (blocks.length === 0) {
    fail('"blocks" is empty — an article has at least one block');
  }
  const parsed = blocks.map((block: unknown, index): InEvery<ArticleBlock> =>
    parseBlock(block, `${source}, block ${index + 1}`),
  );
  const closing = parseTexts(conclusion, 'conclusion', fail);

  // Every field is narrowed by its check above — no cast (lib/blog's `fail` note).
  return {
    slug,
    languages: inEvery((locale): Article => ({
      slug,
      blocks: parsed.map((block) => block[locale]),
      conclusion: closing[locale],
    })),
  };
}

/**
 * The lib/team doctor who signs a post: the one whose name as lib/team spells
 * it in Romanian (`AUTHOR_SPELLING`, honorific included) is the post's
 * `author` exactly — whatever language the page is in (the header's THE
 * AUTHOR). The post may be lib/blog's entry or one language's post — both
 * carry the slug and the one author string. Throws a TypeError naming the
 * post when no doctor — or more than one — wears that name. `list` is the
 * test seam; the site passes nothing and reads lib/team's `doctors`.
 */
export function articleAuthor(
  post: ArticlePostRef,
  list: readonly Doctor[] = doctors,
): Doctor {
  const found = list.filter(
    (doctor) => doctor.words[AUTHOR_SPELLING].name === post.author,
  );
  if (found.length === 1) return found[0];
  // The author is quoted `spelled` — every invisible character by its code
  // point — so a name that differs from a doctor's by a no-break space or a
  // zero-width one shows HOW it differs, never as the very name it misses.
  if (found.length === 0) {
    throw new TypeError(
      `post „${post.slug}": "author" ${spelled(post.author)} is no doctor of lib/team — an article's author is exactly one doctor's name as lib/team spells it in "${AUTHOR_SPELLING}" (a post's author is one string for every language, spelled as in Romanian), honorific included: ${list.map((doctor) => `„${doctor.words[AUTHOR_SPELLING].name}"`).join(', ')}`,
    );
  }
  throw new TypeError(
    `post „${post.slug}": "author" ${spelled(post.author)} names ${found.length} doctors of lib/team (${found.map((doctor) => doctor.id).join(', ')}) — an article's author must name exactly one`,
  );
}

/**
 * THE CHECKS AT LOAD (the header's paragraph of that name): the articles of
 * `registry`, checked in every language, in the order of `list` — lib/blog's
 * `posts` (its entries, every language's words beside the facts), newest
 * first, for the site. Throws a TypeError naming the article when its slug is
 * no post's, when its file is malformed, or when its author is no doctor. A
 * post with no article is simply not in the result. `articles` below is this
 * function applied to REGISTRY; it is exported as the test seam for the three
 * refusals.
 */
export function loadArticles(
  registry: Readonly<Record<string, unknown>>,
  list: readonly BlogPostEntry[] = posts,
): readonly ArticleEntry[] {
  for (const slug of Object.keys(registry)) {
    if (!list.some((post) => post.slug === slug)) {
      throw new TypeError(
        `${articleSource(slug)}: ${spelled(slug)} is no post's slug — an article is the body of a post in ${POSTS_SOURCE}, which holds its title, picture, date, author and tags: add the post first`,
      );
    }
  }

  return list.flatMap((post): readonly ArticleEntry[] => {
    if (!Object.hasOwn(registry, post.slug)) return [];
    const entry = parseArticle(registry[post.slug], post.slug);
    articleAuthor(post); // throws naming the post, whose slug is the article's
    return [entry];
  });
}

/** Every article the site ships, checked in every language, in lib/blog's `posts` order (newest first). */
export const articles: readonly ArticleEntry[] = loadArticles(REGISTRY);

/**
 * THE STAND-IN (the header's paragraph of that name): the article a post's
 * card opens while its post has none of its own — „Cum îți alegi periuța de
 * dinți", the blog's one article, the owner's "dummy" (2026-10-15).
 */
export const STAND_IN_ARTICLE = 'cum-iti-alegi-periuta-de-dinti';

/**
 * The slug of the article a post's card opens (the header's THE STAND-IN):
 * the post's own when `store` holds an article at its slug, else
 * `STAND_IN_ARTICLE`. `store` is the test seam; the site passes nothing and
 * searches `articles`.
 * @throws TypeError naming the post when it has no article and the stand-in
 *   is not in `store` either — a card that would link to a page the export
 *   never writes.
 */
export function articleSlugFor(
  postSlug: string,
  store: readonly ArticleEntry[] = articles,
): string {
  if (store.some((entry) => entry.slug === postSlug)) return postSlug;
  if (store.some((entry) => entry.slug === STAND_IN_ARTICLE)) {
    return STAND_IN_ARTICLE;
  }
  throw new TypeError(
    `post „${postSlug}" has no article, and the stand-in „${STAND_IN_ARTICLE}" its card would open is not registered either — register ${articleSource(STAND_IN_ARTICLE)} in lib/blog-article, or point STAND_IN_ARTICLE at an article that is`,
  );
}

/**
 * The words of one text: its runs of non-space characters that hold a letter
 * or a digit that shows — lib/visible-text's `hasVisibleWord`, the very rule
 * a label is held to — so a mark standing alone, French's „:" or „?" after
 * its narrow no-break space, is none, and nor is a Hangul filler (the
 * header's READING TIME).
 */
function wordsIn(text: string): number {
  return text.split(/\s+/u).filter(hasVisibleWord).length;
}

/**
 * How many words the eye reads on the page in the article's language: every
 * paragraph and subheading, every gallery card's caption, every heading and
 * note of a photo or of a pair's halves, and the conclusion — never the alts,
 * never a note's lead-in, which is the page's word, and never a mark that
 * stands alone (the header's READING TIME).
 */
export function articleWordCount(article: Article): number {
  const texts = article.blocks.flatMap((block): readonly string[] => {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        return [block.text];
      case 'gallery':
        return block.cards.map((card) => card.caption);
      case 'photo':
        return [block.heading, block.note].flatMap((text) =>
          text === undefined ? [] : [text],
        );
      case 'beforeAfter':
        return [block.headings, block.notes].flatMap((pair) =>
          pair === undefined ? [] : [pair.before, pair.after],
        );
    }
  });
  return [...texts, article.conclusion].reduce(
    (sum, text) => sum + wordsIn(text),
    0,
  );
}

/**
 * The minutes an article takes to read in its language — the words ÷
 * WORDS_PER_MINUTE, rounded up, at least one: the MEASURE its post's
 * `readingMinutes` is held to (the header's READING TIME).
 */
export function readingMinutes(article: Article): number {
  return Math.max(1, Math.ceil(articleWordCount(article) / WORDS_PER_MINUTE));
}
