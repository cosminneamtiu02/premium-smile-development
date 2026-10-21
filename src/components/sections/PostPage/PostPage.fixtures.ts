import { shareHrefs } from '@/lib/share/share';
import type { PostPageBlock, PostPageProps } from './PostPage';

// sections/PostPage — the band’s STORY AND TEST DATA: one whole demo article
// page, in Romanian with diacritics (§15.7; the article is in all five
// languages since 2026-10-15 — the route's twin, Pages/BlogArticle, renders
// its German).
// NEVER SHIPPED: tests/unit/fixtures-fence.test.ts keeps every runtime file in
// src/ off a `*.fixtures` module — only a story, a test or another fixture
// imports this one.
//
// ── NEVER THE ROUTE’S POPULATOR (the build contract’s C1). The band’s
// stories and tests prove the BAND, so they hand it a finished PostPageProps
// object of their own; the route’s story twin (Pages/BlogArticle) proves the
// wiring. Every value is COPIED, never imported — a section’s workbench does
// not reach into site data (sections/PostConclusion’s suite, this lane’s
// convention) — from:
//   · the article,
//     src/content/blog/articles/cum-iti-alegi-periuta-de-dinti.json, word for
//     word — its 27 blocks as it ships since 2026-10-17 — its consecutive
//     paragraphs and subheadings grouped into prose blocks the way the route
//     groups them (populate.ts’ THE GROUPING, its `pageBlocks`): TWENTY runs,
//     ten prose runs with every picture block standing alone between them —
//     prose · photo · prose · photo · prose · gallery · prose · photo · prose ·
//     pair · prose · pair · prose · gallery · prose · pair · prose · pair ·
//     prose · photo. The prose runs, p a paragraph and h a subheading: p · hpp
//     · hpp · hp · p · hp · h · p · hp · p — one subheading stands alone in
//     its run („Pentru copii”), the second gallery between it and its
//     paragraph;
//   · the four blog photos and the four before/after pairs — every picture
//     and its alt, every heading as written, and every note FINISHED as the
//     route finishes it, ro.json’s `blog.article.note` („Notă: {note}”)
//     around the note’s text. Between them they are EVERY INSTANCE the owner
//     listed (2026-10-15: "also add an instance of the single blog image with
//     note, with heading and no not and without no heading nor not and with
//     note no heading. also add every instantiation possible of a inainte and
//     dupa"): a photo with a heading and a note („La consultație”), with a
//     note alone, with neither (the article’s first), with a heading alone
//     („Aici te așteptăm”, its last block); a pair with headings alone („La
//     sosire” / „În cabinet”), with headings and notes („Înainte” / „După”),
//     with neither, with notes alone;
//   · the opener and the cover — the post’s own entry in
//     src/content/blog/posts.json (its title, its two categories, the lobby
//     photograph with its empty alt), and the by-line and the reading time as
//     the route words them from ro.json’s `blog.article.byline` and
//     `blog.readingTime` over the post’s `readingMinutes`, 4 — the card’s
//     number, which the Romanian words’ count at 200 a minute must equal
//     (tests/unit/blog-article-data.test.ts);
//   · the share controls — ro.json’s `blog.article.share` words, and the three
//     addresses built by lib/share (MECHANICS, the ShareLinks stories’ road)
//     for the article’s own address on lib/clinic’s placeholder domain (THE
//     ADDRESS IS NOT A FREE STAND-IN, below);
//   · the TWO galleries — the article’s own since 2026-10-17, when the
//     carousel’s five-card window left the article for the Home page (the
//     owner, verbatim: "the fiver option … do not represent it in the
//     article, represent it on home page"): the carousel’s one axis stands on
//     the page in each of its two values, in the article’s order — the
//     rotating ring („loop”), then the end-to-end list („bounded”, the one
//     that changes direction at each end) — each with THREE cards in its
//     window, a gallery’s only one (sections/PostGallery’s THREE CARDS,
//     ALWAYS), so no block names a window. From 2026-10-16 to that day the
//     page held four, the two modes with three cards and with five (the
//     owner: "all must be instantiated. both with 3 and 5 iteration *and must
//     also have 8 instances*"). Both hold the SAME EIGHT CARDS — CARDS below,
//     spelled once here, where the JSON writes them twice word for word —
//     public/images/demo/gallery-1.jpg … gallery-8.jpg, each picture, alt and
//     caption verbatim. The carousel’s words: ro.json’s
//     `blog.article.gallery` (previous, next, and `picker`, the beads’ group
//     name) and `common.carousel` (the two roledescriptions); each region’s
//     name NUMBERED as the route names a gallery on a page that holds more
//     than one, `blog.article.gallery.regionNumbered` („Galerie foto 1 din 2”,
//     „Galerie foto 2 din 2”) — every gallery is a region landmark, and a
//     page’s landmarks must not share a name (axe’s landmark-unique, which
//     every story’s check runs); and each gallery’s eight cards named as the
//     route names them — each card’s name its bead’s too — counted within ITS
//     gallery, from `blog.article.gallery.slide` („Fotografia 1 din 8” …);
//   · the conclusion — the article’s closing words, signed by its author,
//     lib/team’s Dr. Nicu Elena Alina: her Romanian name and specialty and
//     her cutout (the demo cutout, 900 × 1200, until her photograph lands).
// A COPY CAN GO STALE: should those words change, these frames keep the old
// ones — the route’s twin is the page that follows them.
// THE ADDRESS IS NOT A FREE STAND-IN (2026-10-20, round 2 of the Opus
// typescript review): `DEMO_ADDRESS` is lib/clinic’s `url` — the site’s
// PLACEHOLDER domain, https://example.com, its TODO(owner) — under the
// article’s path, the very address the route builds on the root-served
// shape the `components` project pins; and src/app/[locale]/blog/[slug]/
// populate.test.ts holds this whole fixture STRICTLY EQUAL to the page the
// route builds (its test ‘IS sections/PostPage’s demo page, word for word’).
// So the day the owner sets the production domain (BACKLOG.md entry 7) that
// test turns red until `DEMO_ADDRESS` follows — and the three share links
// with it, which lib/share builds from it below.

/** The article’s address on lib/clinic’s placeholder domain — the one the
 *  copy control copies and the three links share, and the one the route
 *  builds (THE ADDRESS IS NOT A FREE STAND-IN, above) — and its title. */
export const DEMO_ADDRESS =
  'https://example.com/ro/blog/cum-iti-alegi-periuta-de-dinti/';
const TITLE = 'Cum îți alegi periuța de dinți';
/** What the share says around the address, as the route words it round the
 *  title — ro.json’s `blog.article.share.message`, which opens the WhatsApp
 *  text and the e-mail’s body, and `.subject`, the e-mail’s subject line. */
const MESSAGE = `Citește acest articol de la Premium Smile: ${TITLE}`;
const SUBJECT = `Un articol de la Premium Smile: ${TITLE}`;
const HREFS = shareHrefs(DEMO_ADDRESS, { subject: SUBJECT, message: MESSAGE });

/** A gallery block, as the band takes it. */
type GalleryBlock = Extract<PostPageBlock, { kind: 'gallery' }>;

/** The EIGHT CARDS both of the article’s galleries hold, in the JSON’s
 *  order — each picture, alt and caption verbatim. */
const CARDS = [
  {
    image: {
      src: '/images/demo/gallery-1.jpg',
      alt: 'Holul clinicii și ușa deschisă a unui cabinet, prin care se vede scaunul stomatologic mov',
    },
    caption: 'Ușa cabinetului',
  },
  {
    image: {
      src: '/images/demo/gallery-2.jpg',
      alt: 'Două fotolii galbene în fața unui perete cu un model rotund în relief și, în prim-plan, o canapea galbenă',
    },
    caption: 'Sala de așteptare',
  },
  {
    image: {
      src: '/images/demo/gallery-3.jpg',
      alt: 'Sertare albe, aparate mici și un scaun mov într-un cabinet',
    },
    caption: 'Masa de lucru',
  },
  {
    image: {
      src: '/images/demo/gallery-4.jpg',
      alt: 'Un scaun mov sub lampă și, pe peretele mov, un ecran cu o radiografie panoramică',
    },
    caption: 'Scaunul stomatologic',
  },
  {
    image: {
      src: '/images/demo/gallery-5.jpg',
      alt: 'Prim-plan cu un instrument subțire și o piesă de mână, suspendate pe brațul unității dentare',
    },
    caption: 'Instrumentele de lucru',
  },
  {
    image: {
      src: '/images/demo/gallery-6.jpg',
      alt: 'Prim-plan cu două piese de mână argintii, una cu un inel roșu, lângă un vârf de culoare bej',
    },
    caption: 'Piesele de mână',
  },
  {
    image: {
      src: '/images/demo/gallery-7.jpg',
      alt: 'Un pacient cu ochii închiși, cu oglinda ținută lângă dinți',
    },
    caption: 'Oglinda dentară',
  },
  {
    image: {
      src: '/images/demo/gallery-8.jpg',
      alt: 'Mâini în mănuși țin o sondă cu mâner portocaliu lângă dinții unui pacient',
    },
    caption: 'La control',
  },
] as const satisfies GalleryBlock['cards'];

/** The eight cards’ names, as the route words them for each gallery —
 *  `blog.article.gallery.slide`, counted within the gallery. */
const SLIDE_LABELS = [
  'Fotografia 1 din 8',
  'Fotografia 2 din 8',
  'Fotografia 3 din 8',
  'Fotografia 4 din 8',
  'Fotografia 5 din 8',
  'Fotografia 6 din 8',
  'Fotografia 7 din 8',
  'Fotografia 8 din 8',
] as const satisfies GalleryBlock['slideLabels'];

/** The five words both galleries’ carousels share — the two
 *  roledescriptions (`common.carousel`), the two arrows’ names and the
 *  beads’ group name (`blog.article.gallery`); only the region’s name
 *  differs from gallery to gallery. */
const CAROUSEL = {
  role: 'carusel',
  slideRole: 'diapozitiv',
  previous: 'Fotografia anterioară',
  next: 'Fotografia următoare',
  picker: 'Alege fotografia',
} as const satisfies Omit<GalleryBlock['labels'], 'region'>;

/** The demo article page, whole — every string finished, as the route hands
 *  it to the band. */
export const DEMO_PAGE = {
  header: { title: TITLE, byline: 'de Dr. Nicu Elena Alina' },
  cover: {
    readingTime: '4 min de citit',
    image: { src: '/images/hero/lobby.jpg', alt: '' },
    tags: ['igienă', 'sfaturi'],
    tagsLabel: 'Categorii',
  },
  share: {
    label: 'Distribuie articolul',
    facebook: {
      href: HREFS.facebook,
      label: 'Facebook',
      name: 'Facebook, distribuie articolul',
    },
    whatsapp: {
      href: HREFS.whatsapp,
      label: 'WhatsApp',
      name: 'WhatsApp, trimite articolul',
    },
    email: {
      href: HREFS.email,
      label: 'E-mail',
      name: 'E-mail, trimite articolul',
    },
    copy: {
      url: DEMO_ADDRESS,
      label: 'Copiază linkul',
      copied: 'Link copiat',
      failed: 'Linkul nu a putut fi copiat',
    },
  },
  blocks: [
    {
      kind: 'prose',
      items: [
        {
          kind: 'paragraph',
          text: 'Periuța de dinți este instrumentul pe care îl folosești de două ori pe zi, în fiecare zi, așa că merită aleasă cu atenție. Pe raft găsești zeci de modele, cu peri de toate felurile, mânere colorate și promisiuni scrise mare pe ambalaj. Vestea bună este că alegerea nu trebuie să fie complicată: câteva lucruri simple contează mult mai mult decât culoarea sau prețul.',
        },
      ],
    },
    {
      kind: 'photo',
      image: {
        src: '/images/hero/instruments.jpg',
        alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
      },
    },
    {
      kind: 'prose',
      items: [
        { kind: 'heading', text: 'Peri moi, medii sau tari?' },
        {
          kind: 'paragraph',
          text: 'Pentru majoritatea oamenilor, o periuță cu peri moi este alegerea potrivită. Perii moi îndepărtează placa bacteriană la fel de bine ca cei tari, dar sunt blânzi cu gingia și cu smalțul. O periuță tare, folosită cu putere, poate retrage gingia în timp și poate lăsa dinții sensibili la rece și la cald.',
        },
        {
          kind: 'paragraph',
          text: 'Dacă gingiile îți sângerează la periaj sau ai urmat un tratament parodontal, perii extra moi sunt un bun punct de plecare. Sângerarea nu este un motiv să te speli mai rar. Este un semn că gingia are nevoie de atenție și că e bine să ne faci o vizită, ca să vedem împreună de unde vine.',
        },
      ],
    },
    {
      kind: 'photo',
      image: {
        src: '/images/hero/treatment-room.jpg',
        alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
      },
      heading: 'La consultație',
      note: 'Notă: pe ecran, o radiografie panoramică.',
    },
    {
      kind: 'prose',
      items: [
        { kind: 'heading', text: 'Manuală sau electrică?' },
        {
          kind: 'paragraph',
          text: 'Ambele variante curăță bine dacă sunt folosite corect. Periuța electrică te ajută dacă îți este greu să faci mișcări mici și precise, de exemplu când te dor încheieturile, sau dacă ai tendința să apeși prea tare: multe modele te anunță când apeși prea puternic. Periuța manuală nu are nevoie de încărcare și o iei cu tine oriunde.',
        },
        {
          kind: 'paragraph',
          text: 'Oricare ar fi alegerea ta, timpul contează: două minute, de două ori pe zi, cu o pastă de dinți cu fluor. Ține periuța înclinată spre gingie și fă mișcări mici, fără să freci în lung, ca și cum ai lustrui fiecare dinte pe rând. Nu uita de fața dinților dinspre limbă și de suprafețele cu care mesteci.',
        },
      ],
    },
    {
      kind: 'gallery',
      mode: 'loop',
      cards: CARDS,
      labels: { region: 'Galerie foto 1 din 2', ...CAROUSEL },
      slideLabels: SLIDE_LABELS,
    },
    {
      kind: 'prose',
      items: [
        { kind: 'heading', text: 'Capul periuței și mânerul' },
        {
          kind: 'paragraph',
          text: 'Un cap mic ajunge mai ușor la măselele din spate și pe fața dinților dinspre limbă, acolo unde placa se adună ușor și unde periajul ajunge greu. Mânerul trebuie să stea comod în mână și să nu alunece când e ud, mai ales dacă te speli pe dinți în grabă, dimineața.',
        },
      ],
    },
    {
      kind: 'photo',
      image: {
        src: '/images/hero/instruments.jpg',
        alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
      },
      note: 'Notă: și instrumentele noastre au capete mici.',
    },
    {
      kind: 'prose',
      items: [
        {
          kind: 'paragraph',
          text: 'Dacă porți aparat dentar sau ai implanturi, coroane ori punți, întreabă-ne despre periuțele speciale: cele cu perii tăiați în formă de V, potrivite pentru aparat, și periuțele cu un singur smoc, care ajung în locurile greu accesibile din jurul lucrărilor.',
        },
      ],
    },
    {
      kind: 'beforeAfter',
      images: {
        before: {
          src: '/images/hero/lobby.jpg',
          alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
        },
        after: {
          src: '/images/hero/treatment-room.jpg',
          alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
        },
      },
      headings: { before: 'La sosire', after: 'În cabinet' },
    },
    {
      kind: 'prose',
      items: [
        { kind: 'heading', text: 'Când o schimbi' },
        {
          kind: 'paragraph',
          text: 'Schimbă periuța la fiecare trei luni sau mai devreme, dacă perii s-au desfăcut în lateral. O periuță cu perii tociți curăță mult mai puțin, oricât de atent te-ai spăla. Merită schimbată și după o răceală sau o gripă, iar copiii au nevoie adesea de una nouă mai des, pentru că o mestecă.',
        },
      ],
    },
    {
      kind: 'beforeAfter',
      images: {
        before: {
          src: '/images/hero/treatment-room.jpg',
          alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
        },
        after: {
          src: '/images/hero/instruments.jpg',
          alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
        },
      },
      headings: { before: 'Înainte', after: 'După' },
      notes: {
        before: 'Notă: imagine ilustrativă, nu un caz real.',
        after: 'Notă: imagine ilustrativă, nu un rezultat.',
      },
    },
    { kind: 'prose', items: [{ kind: 'heading', text: 'Pentru copii' }] },
    {
      kind: 'gallery',
      mode: 'bounded',
      cards: CARDS,
      labels: { region: 'Galerie foto 2 din 2', ...CAROUSEL },
      slideLabels: SLIDE_LABELS,
    },
    {
      kind: 'prose',
      items: [
        {
          kind: 'paragraph',
          text: 'Copiii au nevoie de o periuță pe măsura gurii lor, cu cap mic, peri moi și un mâner gros, ușor de ținut în pumn. Până pe la șapte sau opt ani, periajul de seară e bine să fie făcut sau verificat de un părinte. O periuță cu personajul preferat poate face din periaj un obicei de care copilul se bucură, nu o corvoadă.',
        },
      ],
    },
    {
      kind: 'beforeAfter',
      images: {
        before: {
          src: '/images/hero/instruments.jpg',
          alt: 'Înainte: prim-plan cu instrumentele suspendate pe brațul unității dentare',
        },
        after: {
          src: '/images/hero/lobby.jpg',
          alt: 'După: sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
        },
      },
    },
    {
      kind: 'prose',
      items: [
        { kind: 'heading', text: 'Cum o păstrezi curată' },
        {
          kind: 'paragraph',
          text: 'După periaj, clătește bine periuța sub jet de apă și las-o să se usuce în poziție verticală, cu capul în sus. Nu o închide într-o cutie cât timp e udă și nu o împrumuta nimănui, nici măcar celor din familie. Dacă mai multe periuțe stau în același pahar, ai grijă să nu se atingă între ele.',
        },
      ],
    },
    {
      kind: 'beforeAfter',
      images: {
        before: {
          src: '/images/hero/instruments.jpg',
          alt: 'Înainte: prim-plan cu instrumentele suspendate pe brațul unității dentare',
        },
        after: {
          src: '/images/hero/treatment-room.jpg',
          alt: 'După: cabinet de tratament, cu un blat lung cu sertare, scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
        },
      },
      notes: {
        before: 'Notă: fiecare instrument își are locul lui.',
        after: 'Notă: sertarele țin totul în ordine.',
      },
    },
    {
      kind: 'prose',
      items: [
        {
          kind: 'paragraph',
          text: 'Periuța curăță fețele dinților, dar nu și spațiile dintre ei. Pentru acestea ai nevoie de ață dentară sau de periuțe interdentare, despre care îți povestim într-un articol separat. Împreună, cele două obiceiuri țin gingia sănătoasă mult mai bine decât periajul singur.',
        },
      ],
    },
    {
      kind: 'photo',
      image: {
        src: '/images/hero/lobby.jpg',
        alt: 'Sala de așteptare a clinicii, cu fotolii galbene și o ușă deschisă spre un cabinet',
      },
      heading: 'Aici te așteptăm',
    },
  ],
  conclusion: {
    text: 'O periuță moale, schimbată la timp și folosită cu răbdare, face mai mult pentru gingiile tale decât orice model scump. Dacă nu știi ce să alegi, adu-ți periuța la următoarea consultație și o alegem împreună.',
    doctor: {
      name: 'Dr. Nicu Elena Alina',
      position: 'Medic specialist în parodontologie',
      photo: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
    },
  },
} as const satisfies PostPageProps;
