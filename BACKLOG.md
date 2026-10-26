# BACKLOG.md — work left for later, on purpose

Started 2026-10-01 on the owner's word: "create also in this pr a list with stuff to do later if
it doesn't exist already. add there coookies, complete accesibility test rerun and policy page for
the moment". Each entry says what the work is, why it waits and where its record already lives.
The records stay the source of truth (CLAUDE.md, COOKIES.md); this file points at them. An entry
leaves the list in the lane that does the work, or when the owner drops it, and a new one joins it
on the owner's word. Decisions still go to CLAUDE.md §15.

An entry keeps its number for good, because CLAUDE.md and code comments cite the numbers: one that
leaves takes its number with it. Entry 5 — larger text on the Services page — left on 2026-10-10
on the owner's word ("drop this one"), the day entries 7 and 8 joined. Entry 4 — new words for the
doctors band's eyebrow — left on 2026-10-26 when the owner chose „Echipa Premium Smile".
Entry 11 — the threshold scroll steps checked against the „Echipa" dropdown — left on 2026-10-26
on the owner's word ("ok"), once the scroll steps it was to check had been dropped (2026-10-16,
never merged).

## 1 · Cookies — consent for the Google Maps embed

- **Why it waits:** the owner, 2026-09-09: "bypass somehow cookies consent for the moment … we'll
  get to cookies consent and implementation later" — recorded as CLAUDE.md §12's rider. The
  smaller first step below, `credentialless`, was proposed on 2026-10-01 and sent here by the
  owner on 2026-10-02: "add to backlog cookies".
- **Is it required? Researched 2026-10-26** (the owner: "is this still a must for impement? do i
  even need this? i'd prefer not to, but if legally required, add agani to backlog"; research,
  not legal advice: entry 3's lawyer confirms). NOT STRICTLY REQUIRED, BUT A REAL RISK. No law,
  court or regulator clearly requires a consent step for this setup, and the map sets no cookies.
  It stays an accepted risk for three reasons:
  - (1) the visitor's IP reaches Google on load under "legitimate interest", and a court can reject
    that basis when a less intrusive way exists: click-to-load, or a picture (LG München I, Google
    Fonts, 2022, €100);
  - (2) German regulators read the cookie rule as covering Google's script and a map that loads by
    itself (DSK, OH Digitale Dienste ¶76). That script writes and removes a sessionStorage test key
    on every load (COOKIES.md §3);
  - (3) the US transfer rests on the EU–US Data Privacy Framework, which the General Court upheld
    in 2025 (Latombe) and which is under appeal (C-703/25 P).

  No decision on an embedded map was found anywhere, and ANSPDCP's cookie fines found (5,000–37,000
  lei) were all for tracking cookies. The realistic exposure:
  - Romania: an order to change, possibly a fine; unlikely.
  - Germany: a visitor's claim of about €100 plus costs, or a competitor's warning letter.

  NO WORK UNTIL A TRIGGER FIRES. Build click-to-load (below; COOKIES.md §7):
  - before the site is marketed to German patients;
  - at the first complaint or warning letter;
  - the day the framework falls.
- **Today:** the „Ne găsești" map (`sections/ClinicLocation`, on Home, Team and every doctor page)
  loads Google's `<iframe>` with the page, with no consent gate. The only cookie the site itself
  writes is the language cookie (COOKIES.md §2).
- **DONE 2026-10-10 — the smaller first step, `credentialless` (CLAUDE.md §15.38):** since
  2026-10-01 we knew §3's "the embed set zero cookies" held for WRITES only — in Chrome and Edge,
  which keep third-party cookies on, the frame SENT a signed-in visitor's existing Google cookies
  (19 of 46 requests in a probe of the shipped `<iframe>`), and the EU cookie rule covers reading
  what a device stores. The map's `<iframe>` now wears `credentialless` (spelled as its own name,
  because the export's React drops an empty string; a fresh, empty cookie jar, thrown away when
  the page closes: measured 19 → 0, the map, its dragging and its card
  buttons unchanged); Safari blocks those cookies anyway and Firefox keeps each site's cookies
  apart. The finding and the fix are in COOKIES.md §3 and §7 and CLAUDE.md §12's rider; the
  privacy page discloses the map (entry 3). A note under the map said it where it happens from 2026-10-10
  until the owner removed it on 2026-10-13 (CLAUDE.md §15.38 round 3): the policy, linked from every footer,
  carries it alone, and such a line is required again only beside the button if the map goes click-to-load.
- **The owner's direction, 2026-10-10 (advice session, no code changed by it):** "i want that thing
  with the map to work automatically when you open the website". The advice given, recorded here
  for the day this entry is picked up: automatic + Google's map + no consent — the law allows two
  of the three. KEEP IT AUTOMATIC for now (the accepted risk of 2026-09-09, its cookie half now
  closed); switch to click-to-load (below) the day any complaint or letter arrives, or BEFORE the
  site is marketed to German patients (the Google Fonts letters came from Germany, and GDPR lets a
  visitor sue at home); if "automatic AND no risk" is ever wanted, the answer is our own map
  (MapLibre), never a banner for one map. Measured the same day for comparison: jonaclinic.ro sets
  16 cookies before any click (Google Analytics, Google Ads, the Facebook and TikTok pixels,
  YouTube, reCAPTCHA) and keeps loading them after „Refuz" — the pattern ANSPDCP has fined
  (5,000–40,000 lei in 2024–2026, every case trackers without consent, none a map).
- **The rule that keeps the site banner-free:** no analytics, no Facebook or TikTok pixel, no
  Google Ads tracking, ever, without a consent tool that BLOCKS them until a "yes" (COOKIES.md §5).
  The day one is wanted, this entry's work becomes due.
- **What no attribute fixes:** the visitor's IP address reaching Google whenever the map loads by
  itself — the risk accepted and postponed on 2026-09-09 (COOKIES.md §3, the Google Fonts case).
  Routing the map through our own address does not help: Google's page fetches its pieces
  straight from Google's servers, and a static site has no server to route them. The two ways
  out without a modal are both in COOKIES.md §3's list. Click to load inside the map's own box: a
  picture of the map, one button and one line saying Google will see the visitor's IP address;
  the click is the consent and nothing is stored, so it asks again on every page with the map,
  and the map is not live until the click (for the picture, an OpenStreetMap image with its
  credit line or a drawn map; whether Google's terms allow a screenshot of its map is not
  checked). Or our own map (MapLibre with map data we host): live, with no Google and no consent,
  but not Google's look, no rating card and a large new library.
- **The work:** COOKIES.md §7 is the checklist — nine items, one lane: the consent record, the
  `<iframe>` absent (never hidden) until consent, the design of the no-consent branch (an image, a
  "show map" button or a plain link out — that lane's call), hydration safety (CLAUDE.md §16 rule
  2), the live flip, the tests, the disclosure (entry 3) and the clean-up of §12's rider. Read
  COOKIES.md §5 before adopting any third-party consent manager.
- **Also checked on 2026-10-01:** nothing else stores anything — the only cookie writer is
  `src/i18n/cookie.ts`, no other browser storage is used, and GitHub Pages, the interim host,
  sends no cookies (its response headers). A link inside the map opens Google's own pages in a
  new tab, where Google sets its own cookies (five Google Analytics cookies on its Terms page, in
  the probe) — the visitor's own visit, like any link out. Cloudflare, §15.2's candidate launch
  host, can add a cookie of its own (`__cf_bm`) through its bot protection: keep that off, or list
  it on the policy page (entry 3).

## 2 · A complete accessibility test, re-run on the finished site

- **Why it waits:** CLAUDE.md §9 makes WCAG 2.2 AA an acceptance criterion and asks the page tier
  for "a manual keyboard walkthrough and a screen-reader pass (NVDA or VoiceOver) before launch".
  Every lane has tested its own part; nobody has yet walked the whole site as built.
- **The work, on the built export, on every page type (Home, Services, Team, a doctor page, the
  blog's list, a blog article, the 404, the contact dialog, the language banner), in Romanian and
  in German:**
  - automated: the per-story axe run (CI already has it) plus an axe or Lighthouse pass over the
    built pages;
  - keyboard only: Tab and Shift+Tab through every page — focus always visible, nothing trapped,
    Escape closes the dialog and focus returns to its opener;
  - screen readers: VoiceOver on macOS and on an iPhone, NVDA with Firefox on Windows;
  - reflow at 320px and at 200% zoom with no sideways scroll; Windows High Contrast (forced
    colours); reduced motion;
  - a blog article's e-mail share link in an older classic Outlook on Windows: the `mailto:` is
    UTF-8 throughout, as RFC 6068 asks, but a mail client that decodes it with the system code
    page would show „CiteÈ™te" (a Western Windows) or „CiteČ™te" (a Romanian one) for „Citește"
    (reported, not measured — lib/share's header); the article's Copy link is the visitor's way
    round it;
  - a blog article's WhatsApp share on an iPhone and on an Android phone, each with the app
    installed: the link opens the app with the article's sentence intact — French's narrow space
    before its colon included — which no phone has confirmed yet (lib/share's header reads it off
    WhatsApp's own app-link files and a desktop request alone).
- **Open records to confirm or re-open in that pass:**
  - SC 2.2.2 on the blog article's photo gallery and the Home page's articles band (both
    sections/CardCarousel, 2026-10-17): both modes move by themselves every 5.5 seconds, and every
    activation — one of its tall previous / next arrows, one of its progress dots, a swipe, a tap
    on the cards — stops the movement for good, the owner's pick among three ("OPTION 1").
    That is a control that stops the moving content, but NOTHING VISIBLE SAYS SO, so an
    auditor may still ask for an explicit pause button (lib/rotation's `rotationControl` is the
    way to one). Nor anything audible — the owner's option for that half: the words the Hero's
    beads carried until 2026-10-20 (dropped there because a press no longer stops the Hero) are
    TRUE here, so the two dot groups could be named „Alege articolul (oprește derularea)" and
    „Alege fotografia (oprește derularea)" — `home.articles.picker` and
    `blog.article.gallery.picker`, one string ×5 each (the phase-3 accessibility reviews,
    2026-10-20; not changed: new words on his site). A screen reader's reading cursor is not a press: the card it reads is still
    swapped every 5.5 seconds until something stops the carousel. AND THE DWELL, AN OPEN
    QUESTION FOR THE OWNER: the 5.5 seconds are the Hero's and the reviews deck's rhythm, and
    they are shorter than the Home band's cards take to read — each slide there is a whole blog
    card; the newest post's title and summary are 45 words in Romanian and 51 in German, 18 and 20
    seconds at the ~150 words a minute of lib/rotation's reading-time rider (the gallery's
    captions, two to four words, fit). No record shows him choosing 5.5 seconds for these cards
    with those numbers in front of him (the deck's own record calls its reading-time question
    OPEN, ReviewsCarousel.tsx's REVIEWS_INTERVAL_MS); the levers are the constant
    (`CARD_CAROUSEL_INTERVAL_MS`) or a dwell per card from its own word count. SC 2.5.1 / 2.5.7 (a single-pointer
    way to move it) are met by the visible arrows and dots since the same day. The dots are BUTTONS,
    like the Hero's (the owner asked for the Hero's): eight in an article gallery and twelve on the
    Home page's articles band are 10–14 Tab stops per carousel — the lever, not taken, is one Tab
    stop for the row (a roving-tabindex toolbar, arrow keys between the dots).
  - The Home page's articles band draws the blog's cards as 65 % MINIATURES (the owner's pick,
    2026-10-17, „Miniature (all 65%)"; sections/BlogCarousel, sections/PostCard's `miniature`): ON A
    PHONE, its line, the centre card's title reads 19.5px, its read-more 11.7, its summary and
    reading time 10.4, its author 9.1 and its category tags 7.8px. From a tablet's screen up its
    flat row (2026-10-25, CLAUDE.md §15.39 round 5) draws the full card's own sizes on a tablet (the
    summary 16px) and, on a laptop or a desktop, a numbers tile's sentence (14.6px at a 1140
    window, 18 at 1401, 24.75 at 1920). No AA criterion sets a minimum text size; zoom enlarges the
    phone's text (pinch-zoom), and the row follows the band scale's trade, the numbers band's own:
    on a 1440 × 900 laptop the summary holds 18.5 device px at 100, 110 and 125 % and reads 24 / 28 /
    32 at 150 / 175 / 200 %; on a 1920 screen it holds 24.7 up to 150 % and reads 28 and 32 after —
    larger at every step than the floored line it replaced there (develop's 10.7 → 20.8 and 14.3 →
    20.8), but growing ×1.73 and ×1.29 to 200 % where that line grew ×1.95 and ×1.45 (MEASURED on
    the built export, 2026-10-26). The site's readers skew older (§1): look at it with them. The
    levers: the share, one constant in sections/BlogCarousel, or a text floor inside the miniature.
  - The Home page's articles band's FLAT ROW (2026-10-25, CLAUDE.md §15.39 round 5), from a tablet's
    screen up — one decision for the owner and two checks:
    · THE CLAMPED TITLES, THE OWNER'S CALL: in the row a card's title and summary show two lines at
      most, „…" past them (his pick, "Card 24% shorter, same text size"). Under SC 1.4.12's
      text-spacing overrides a title that fits two lines needs a third, and its end goes behind the
      „…": at his 1401 window Romanian cuts 10 of the 12 titles with the overrides (2 without),
      English 7 (3), German 11 (6), French 12 (7), Italian 11 (3) — measured by the band's builder,
      2026-10-26. The whole words stay in the DOM, in the link's accessible name and on the article
      page, but an auditor may read it as F104 (the G2 accessibility review's MEDIUM 5). The levers:
      clamp the summary alone and keep the titles whole, or three title lines — either makes the
      row's cards taller again.
    · A LISTEN (NVDA with Chrome, VoiceOver with Safari): in the row several cards are on screen and
      live, so the cards' container is silent and ONE visually hidden status line names the centred
      card after a press („Articolul 2 din 12"), and the centred card carries `aria-current` —
      measured in the built page's markup in Chromium, never heard.
    · THE TAB ORDER IN SAFARI AND FIREFOX: Tab walks the row's live cards in their on-screen order
      through CSS `reading-flow` and `reading-order`, which only Chromium supports (137+); in WebKit
      26.5 and Firefox 153 it follows the list's order, so at the ring's wrap it goes centre → right
      → far left (SC 2.4.3, borderline: each card says its place, „Articolul 12 din 12").
  - In Safari, which does not scroll a control Tab focuses into view, Home's twelve progress dots
    (a 308px row: x 6–314 at a 320 window, x 41–349 at 390) can sit under the fixed corner buttons
    (x 16–72 and W − 72 to W − 16): at 320 dots 2 and 11 can be covered entirely (the discs are
    round, 28px in radius — an idle 24 × 44 dot fits inside one only within about ±2px of
    vertical alignment), at 390 only partly (dot 12 is never entirely covered) (SC 2.4.11;
    computed by the phase-3 accessibility reviews, 2026-10-20). An article gallery's eight
    (212px) stay clear. Tab through them on an iPhone and on a Mac's Safari at those widths. And
    with a screen reader, the FIRST press on a carousel's arrow or dot while it runs: since
    2026-10-21 the press commits the stop — the live region turning polite — in an update of its
    own BEFORE the card swaps (ui/use-rotation's handNavigation; until then both landed in one
    update, and whether the new card was announced depended on when the engine read the region's
    politeness) — check with VoiceOver's and TalkBack's double-tap and NVDA with Firefox that the
    new card is now announced; if it is still silent, the lever is an always-polite hidden node
    that receives the card's name on each hand step. And on an iPhone (sections/CardCarousel's
    header): a tap on a gallery photo (it carries no link), on a side card or on the stage's
    empty ground must stop the movement for good — iOS Safari sends a click only to an element
    that answers clicks, so since 2026-10-21 the cards' hand-box carries React's own click
    responder, set through a ref (inferred from WebKit's rules, not tried on a device); and a
    quick flick (a tenth of a step, about 16–22px) must move one card WITHOUT also following the
    card's link on Home, if iOS's tap slop is wider than the carousel's 10px drag threshold (the
    lever: let a finger's drag arm the click swallow too, for about half a second).
  - BROWSER ZOOM THAT CANNOT DOUBLE TWO KINDS OF TITLE (WCAG 2.2 SC 1.4.4, the F94 pattern —
    computed by the blog-article lane's G2 accessibility review, 2026-10-17 and 2026-10-20), both
    the owner's call: (a) the `hero-scaled` titles — the doctor's name, the blog list's and the
    Team page's hero heading, the blog article's title (new): on a 1920 screen 89.4 device px from
    100 to 150 % and ×1.11 at 200 %, and from a ≈1720 to a ≈2876px window no zoom doubles them;
    the band's trade was accepted on other texts' numbers, never on these (ui/Heading's THE ZOOM
    TRADE, with its lever — a 5rem cap, which doubles them at 500 % only); (b) Home's slogan (the
    `slogan` step, 5.5833vw from the tablet up, older than the lane): ×1.00 at 200 % and ×1.49 at
    500 % on a 1920 screen, never doubling on ≈1433–3840px windows (its THE ZOOM, RECORDED).
    Safari's zoom stops at 300 %, where neither doubles at a laptop width. A check of "the text
    grows" passes the `hero-scaled` titles (×1.11) and fails only the slogan, which on ≈1536–1920px
    windows does not grow at all at 200 %; measure "doubles by 200 %".
  - THE BLOG'S CATEGORY TAGS UNDER BROWSER ZOOM (WCAG 2.2 SC 1.4.4, the F94 pattern — computed by
    the blog-article lane's phase-3 accessibility review, 2026-10-20), the owner's call: an
    article's cover draws its tags in a pixel of their own, relative to the cover's width
    (sections/PostCover's CHIP_SCALE — the ratio the owner picked at his 723px window), and a page
    zoom, which narrows the window in CSS pixels, shrinks that pixel as it enlarges the page
    wherever the zoomed cover is narrower than 513.4 CSS px. An 18px label at 100 % reads, at
    200 %, 24.0px on an upright iPad mini (744), 24.2 on a 768 iPad (×1.35 — now smaller than the
    reading time above it, 32px, where at 100 % it was the larger), 24.7 in an 800 window and 30.7
    in a 1024 window behind a classic scrollbar (15 screen px), 25.9 on an 820 iPad and 33.4 on an
    iPad Air held sideways (×1.85); of the iPads only the 13-inch ones held sideways double at
    200 %, the upright ones at 300 % (Safari's largest step); phones up to about 380px wide are
    already on the floor at 100 % and double exactly, and ×1.95 at 390 and ×1.77 at 430; a pinch
    zoom enlarges the tags with the page. The blog list's cards draw their tags in the same kind of
    card-relative pixel (sections/PostCard's THE CHIPS FOLLOW THEIR CARD), and below the band
    scale's step the same trade holds wherever a ONE-column card's content box is over 342.3px —
    about 453–738px windows behind a scrollbar, 436–719 without one: at the owner's own 723
    window an 18px label reads 17.8 / 17.9 / 19.6 / 24.0px at 110 / 125 / 150 / 200 % (×0.99,
    ×1.00, ×1.09, ×1.33), doubling only at 300 %; at 200 % half a 1280 laptop (a 640 window)
    gives ×1.53, half a 1366 ×1.42, half a 1440 ×1.34, a 600px touch tablet ×1.59; everywhere
    else the floor binds and they double at 200 %, or more — but for one more band, the
    TWO-column cards at about 1040–1138px windows behind a scrollbar (1021–1119 without), whose
    content boxes sit above the floor there: their tags lag the zoom, as low as ×0.99 / ×1.12 /
    ×1.34 at 110 / 125 / 150 %, though at least ×2.15 at 200 % (the phase-3 accessibility
    re-review's arithmetic and the PostCard fold's, 2026-10-20; PostCard.tsx's THE ZOOM) — and a
    third, found by the round-3 review (2026-10-21): THREE-column cards the band scale never
    draws, on a touch screen wider than about 1551 CSS px (a coarse pointer keeps the scale off)
    or with a mouse in Safari 16.0–16.3 or Firefox 110–127 from about 1570px, whose content boxes
    are over the floor too — on a 1640 touch screen 12.83px at 100 % and ×1.03 / ×1.17 / ×1.52 /
    ×1.87 at 110 / 125 / 150 / 200 %, on a 2000px one ×1.48 at 200 % — and there the tags can
    even SHRINK while a zoom enlarges the page: ×0.98 and ×0.96 at 110 and 125 % on that 2000px
    touch screen, ×0.97 / ×0.92 / ×0.89 at 110 / 125 / 150 % (then ×1.06 at 200 %) on a 2560 one
    past the gutter's 12.5rem cap, ×0.98 at 110 and 125 % in a 1920 window in those engines (the
    PostCard fold's arithmetic, 2026-10-21; PostCard.tsx's THE ZOOM). A larger DEFAULT font size
    passes them by as well: at the 723 window a 20px default leaves the label at 17.96px (×1.00)
    and a 24px one draws it at 19.6 (×1.09), while the card's other words grow ×1.25 and ×1.5.
    Recorded, not changed
    (PostCover.tsx's THE ZOOM); the lever is to drop the cover's own pixel (CHIP_SCALE and its cap)
    so the chips take the page's — rem outside the band scale, doubling at 200 % — at the cost of
    44px chips on every phone and, at 320, three long Romanian categories one to a line, ending
    168px down the 192px picture; and under a phone's 200 % page zoom the lever does WORSE than
    today: a German „Kieferorthopädie" chip (186.2px at its 18px label, measured) overflows the
    131.5–139px tag line to the left — 26.7px past the screen's edge on a 375 phone, cutting
    4.7px of its label, 19.2px on a 390 (its edge and most of its padding) — where today's floor
    keeps every tag on the screen (the phase-3 reviews, 2026-10-20; PostCover.tsx's THE ZOOM
    carries the measured numbers).
  - THE BAND TITLES' STEP UNDER BROWSER ZOOM (WCAG 2.2 SC 1.4.4 — site-wide and older than the
    blog lanes; computed by the blog-article lane's phase-3 accessibility review, 2026-10-21), the
    owner's call: ui/Heading's `band` step (§15.24, every `<h2>`) is 30px in a column under 28rem
    and 36px from it, and a page zoom narrows the column in CSS px — so a band title whose column
    is 28rem to 56rem wide at 100 % (about 558–1078px windows behind a classic scrollbar) crosses
    the step and grows only ×1.67 at 200 %, and a card title does the same inside its card (the
    blog list's one-column card at the 723 window: ×1.10 / ×1.04 / ×1.25 / ×1.67 at 110 / 125 /
    150 / 200 %). The step exists so that no band title outranks a phone's `<h1>` (ui/Heading's
    'band' paragraph, UNDER BROWSER ZOOM THE STEP CAN BE CROSSED).
  - SC 2.2.2 on the three rotators that never stop for good (the fourth, the card carousel, is
    the bullet above) — no stop for mouse or touch, and no hold while a screen reader's
    reading cursor is on a review (CLAUDE.md §15.19 round 4, §15.21 round 3); the third rotator, since
    2026-10-13, is the doctor page's courses column, whose highlight moves from idea to idea every
    3 seconds on its own (§15.23 round 7) — it hides nothing, every idea stays readable, but it
    starts by itself, never stops while the courses are on screen, and runs BESIDE the biography,
    the page's main reading; and unlike the Hero and the reviews deck, which hold while keyboard
    focus is inside them, it has NO STOP FOR ANYONE, keyboard included — nothing in it is
    focusable (the accessibility review's MEDIUM of that day). What would conform: a pause/stop
    control, or one sweep that finishes within 5 seconds when the list comes into view and then
    rests; a hover hold alone, or one lap then stop (18 seconds), would not. And while the Hero
    or the reviews deck runs, a press that does not come with keyboard focus is NOT announced: it
    moves the slide, the clock keeps running, and the live region stays 'off' (lib/rotation's
    liveRegion — polite only while keyboard focus holds the band, or under reduced motion). The
    people it costs are screen-reader users, not mouse or touch users, who see the change: a
    VoiceOver or TalkBack double-tap arrives as a click with no keyboard focus, so the new slide
    is not read (computed from the code, not tried on a device; NVDA's browse-mode Enter could go
    either way; no AA failure — the new slide and the bead's aria-current are still exposed; the
    phase-3 accessibility reviews, 2026-10-20). The lever, to check with a real screen reader: a
    polite window for the press's own change, switched on BEFORE the slide changes (switched in
    the same update, many screen readers announce nothing) and closed before the next automatic
    step — the order the card carousel now keeps for its own presses (ui/use-rotation's
    handNavigation commits the stop first, 2026-10-21), there for good because its press stops;
  - SC 2.4.5 Multiple Ways — a doctor page is reachable only through its card (§15.23; the doctors
    dropdown recorded in §15.15 is one answer);
  - forced colours — `ui/Button`'s solid face loses its boundary when it dresses an `<a>` (§15.23,
    §15.25: the `forced-colors:border` follow-up) — the contact dialog's call and WhatsApp
    controls among them, the site's main conversion controls (§15.30 round 5);
  - owed listens — iOS VoiceOver on the doctors list and its phone reading order (§15.25), and on
    the stat tiles, plus NVDA with Firefox in browse mode on a tile (§15.23 round 5); and, on the
    blog's list at a laptop width (`/ro/blog/`), the site's first forced line breaks (§15.39 round 3
    (7)): the `<h1>` and the lead keep their line breaks there, so check with NVDA in Chrome and in
    Firefox, and with VoiceOver in Safari (WebKit computes its own accessible name), that H and the
    headings list announce the WHOLE heading — its second line, which ends on „prin blogul nostru",
    is what says the page is the blog — and that arrowing reads both heading lines and the lead's
    three (Chromium's accessible name has a space at the break, measured; the tests' library keeps
    the break, so only a real screen reader proves it) — and the same on the Team page
    (`/ro/team/`, `/de/team/`), whose `<h1>` and lead carry the same breaks since 2026-10-15
    (CLAUDE.md §15.25 round 4): there the heading's second line, „și oamenii care te întâmpină la
    clinică", is half of what it says; and on a blog article (`/ro/blog/<slug>/`), the by-line under
    the title: its capitals are CSS, and Chromium and WebKit hand assistive technology the text as
    painted, „DE DR. NICU ELENA ALINA" — check that VoiceOver and NVDA say "doctor" and do not
    spell „DR" letter by letter (sections/PostHeader's A LISTEN OWED; the phase-3 accessibility
    review, 2026-10-20); and, on the blog's list and Home's articles band on a phone, VoiceOver's
    and TalkBack's TOUCH exploration over a card — the whole card is one link drawn over its words,
    so a finger on the summary or the author most likely lands on the link: check that the
    author, the summary and the tags are still reached by swiping, and whether a double-tap
    while the screen reader's cursor rests on the title or the summary opens the article (a
    double-tap is a tap at that point, and the link's layer is there) (sections/PostCard's WHAT
    IT COSTS — inferred from the engine's hit test, not tried on a device); and the cards'
    author line has CSS capitals like the by-line — „DR. NICU ELENA ALINA" on the list and on
    Home's centre card (French „DR NICU …", no full stop) — the same "doctor, not D-R" check;
    and, on a blog article's share row, the copy button's STATUS LINE (sections/ShareLinks' THE
    LINE — a `role="status"` region the page prints empty and the press fills): with NVDA and
    JAWS in Chrome and in Firefox, VoiceOver on macOS and iOS, and TalkBack, check that the first
    answer is spoken once; that a repeated identical answer is spoken again, both about a second
    after the last one and after a success has cleared; that a failure can still be read in browse
    mode afterwards; that the two kept answers (invisible and aria-hidden, there to hold the line's
    height) cannot be reached by character navigation or by VoiceOver's touch exploration; and that
    the empty line is no blank swipe stop (the phase-3 accessibility review, 2026-10-21);
  - the map — the corner buttons over Google's zoom controls at 320 and 390px, and the Tab order
    through Google's frame (COOKIES.md §7);
  - SC 2.4.11 Focus Not Obscured under the language banner — an ACCEPTED gap (the owner, 2026-10-03,
    CLAUDE.md §15.33): with the suggestion card open (a visitor whose browser language differs from
    the page), a keyboard visitor in Chrome or Edge in a window 1024 to 1280px wide who Tabs into the
    footer finds „Acasă" or „Servicii" ENTIRELY hidden behind the card. The footer's logo, a link
    since that day and the footer's first stop, makes Chromium scroll to the page's end, where the
    card covers the site map; Firefox and Safari keep 76 to 95 % of those links visible, and develop
    before that day hid none (measured on the built export). The page cannot scroll past its end, so
    the cure belongs to the banner: keep room for the card at the page's end while it is open — the
    planner's recommendation, declined for now (LanguageBanner.tsx, its SC 2.4.11 record). Those
    numbers were taken with the card 16px lower than today (it rose with the corner buttons on
    2026-10-09, CLAUDE.md §15.36), so the walk re-measures which footer links hide at 1024–1280px.
    And LanguageBanner.tsx's claim that the root's scroll padding "rests a Tab-scrolled target's
    bottom edge" above the card holds only for a target already partly in view: Chromium CENTRES a
    target reached from wholly out of view in the window less its scroll padding, and on screens
    shorter than about 600–650px that centre can fall inside the card (the phase-3 accessibility
    review's reading of the same rule behind the Hero's bead focus scroll, 2026-10-20 — to check
    in the walk);
  - the language banner on SHORT screens (CLAUDE.md §15.36, computed by the a11y review, not yet
    measured): the card's top slides under the sticky top bar on a viewport under about 408px tall
    (392 before 2026-10-09), and between about 277 and 315px both of its controls hide entirely —
    1366 × 768 at 200 % zoom and phones held sideways are the cases. The lever — drop the card to the
    corner row on short, wide screens — was TAKEN on 2026-10-09 for the price strip's sake (CLAUDE.md
    §15.20 round 6: under 30rem of height and from 40rem of width); a short window NARROWER than 40rem
    keeps the lift. MEASURED there since (Chromium, an Italian browser on `/ro/services/`, before any
    scroll): an SC 2.4.11 FAILURE, older than the strip — on develop the stacked menu's first link
    „Consultații" is wholly hidden at 390×500 and 390×525, and with the strip the first two chips are
    at 390 × up to ~481px (partly to ~525), so a link or chip focused there is entirely hidden. The
    a11y review's recommended cure, the banner's own lane: no suggestion on windows narrower than
    40rem and shorter than about 32rem (§8.6 makes it optional; the corner language button is one tap
    away), and Escape to dismiss it everywhere;
  - the phone gutter (CLAUDE.md §15.35) — in SAFARI on a phone (320 to 480px), Tab a short footer
    site-map link („Acasă", "Home", "Team") into the bottom strip: WebKit leaves a focused control
    where it is, and with the halved gutter the label can sit almost entirely under the 56px language
    bulb (the G2 a11y review's arithmetic: the label at x ≈ 16–61 against the bulb's 16–72 at 320;
    it used to end clear of it); confirm that its ring and part of the label stay visible (SC 2.4.11,
    met by that arithmetic) or move the strip's links in;
  - the price menu — Firefox, a real iPhone and screen readers never run (§15.20 round 5); and, since
    the band scale reached it (CLAUDE.md §15.32 round 2), two zoom paths never measured: open
    `/de/services/` in a 1920 window in FIREFOX with View → Zoom → "Zoom Text Only" at 150 and 200 % —
    the price rows must read ≈ 1.5× and 2× their 100 % size (not 2.25× and 4×, the double zoom the
    rem floor may cause), and no menu label may cross into the cards column; and compare SAFARI's page
    zoom at 125 / 150 / 200 % against the Chromium numbers below. (At 1920 a 200 % text zoom enlarges
    the rem step past the column — 56rem becomes 1792px, the column is 1521 — so the band leaves the
    scale and reads ≈ 1.45×, the trade Chromium records too; there the double zoom can show only at
    150 %, as ≈ 1.6× or more. The 2.25× and 4× apply under the 1401 reference. Computed from how
    Firefox applies text zoom, not run.) The SAME CHECK on the Home page's articles band (sections/
    BlogCarousel, its cards 65 % miniatures), whose flat row draws in a pixel of its own in rem — the
    theme's pixel over the share, from a tablet's width up to the band scale's step (THE FLAT ROW'S
    PIXEL, 2026-10-25; its floor, a second rem path, left on 2026-10-26): `/de/` in a 1024 window,
    "Zoom Text Only" at 150 and 200 % — a card's summary ≈ 1.5× and 2× its 100 % size (≈ 2.25× and 4×
    is the double zoom) — and in a 1920 window, where its title should read ≈ 1.5× at 150 % (≈ 1.6×
    or more is the double zoom); and no card's words may leave its frame (in the row a title or a
    summary past its two lines ends in „…" — the clamp, not a defect);
  - the price STRIP (CLAUDE.md §15.20 round 6) — on a real iPhone: its touch scrolling, the hidden
    scroll indicator (iOS 18.2 and later), a link straight to a category on a slow connection (the
    load wait) and VoiceOver's reading order through the chips; on a laptop window under 60rem with
    a mouse only: whether the row stays discoverable with its scrollbar hidden (the owner's call);
  - the blog's list (CLAUDE.md §15.39 rounds 2 and 3, 2026-10-14), in every language: in FIREFOX
    with View → Zoom → "Zoom Text Only", the cards' category chips — drawn in a pixel of their own,
    relative to the card (THE CHIPS' PIXEL in tests/unit/design-scale.test.ts) — may zoom twice,
    like the price list's floor above: open `/de/blog/` in a 1920 window at 150 and 200 % and check
    that a chip's label reads ≈ 1.5× and 2× its 100 % size, not more, and stays on its picture —
    and the same on an article's cover (`/de/blog/<slug>/`, sections/PostCover's tags, the same
    kind of pixel); on
    page 1 in a 390px window in SAFARI (macOS: Settings → Advanced → "Press Tab to highlight each
    item on a webpage", or Option+Tab; an iPhone: Full Keyboard Access), scroll until the pager rests
    behind the bottom-right discs, then Tab onto its forward arrow — the pager sits right-aligned
    under the call and WhatsApp discs, and WebKit leaves a focused control where it is, so the arrow
    can be entirely hidden (SC 2.4.11; the root's `scroll-padding-bottom` keeps it clear only where
    a browser scrolls the focused control into view); on a phone held sideways, open the menu and
    reach „Blog", the panel's fourth link, below the screen's fold — the panel scrolls by design (its
    height capped to the screen), so check that a finger reaches „Blog" and that Tab brings it into
    view; and the top bar's step with four links in every row was measured in Chromium only
    — re-measure it at 62rem in Firefox and Safari (CLAUDE.md §15.22's arithmetic; French binds);
  - SC 1.4.4 Resize Text on Home, Team and Services, on every doctor page since 2026-10-13 —
    its map band first, then the whole page the same day — and on the blog's list since 2026-10-14
    (at a 1140 window its summaries and its hero's lead — the page's introduction — read 13px, its
    authors 11.4 and its card titles 24.3, and a
    20px default font is not followed — ACCEPTED as on Home by the owner on 2026-10-15, the floor
    left to this pass with every scaled page) — the band scale (CLAUDE.md §15.25 round
    2, §15.32 and its rounds 2, 3 and 4; a doctor's biography is the page's longest reading): on a laptop
    or desktop every band there — the Services page's price list since
    the same evening, which a floor holds at the theme's own size under the reference, so there it
    follows a zoom as rem does — draws in a design pixel that follows its column, so a browser
    zoom leaves its text the same size on screen until the column drops under the scale's step (the
    map band's address at 200 %: ×1.45 on a 1920 screen, ×1.31 on 2560, against develop's ×2; on a
    doctor's page, since 2026-10-13, the map band is the ONE band that keeps its size — on a 1440
    laptop its address holds 16.4 device px at 100, 110 and 125 % while the biography grows 18 →
    22.5, on a 1920 screen 22px up to 150 %, CLAUDE.md §15.32 round 3), and a
    larger default font size is not followed (a 20px setting on a 1440 laptop reads the address at
    16.45px) — so the 200 % zoom check above must test that text GROWS, not only that nothing
    scrolls sideways. The owner's levers are in §15.25 round 2 (a cap at the reference) and §15.32
    round 2 (THE FLOOR — on every scaled page at once, so the pages keep matching); he accepted the
    trade for the whole doctor page on 2026-10-13 ("Accept, like Home"), leaving the floor to this
    pass. THE BLOG'S ARTICLE PAGE (sections/PostPage, since 2026-10-14 — the site's longest
    reading) draws in the same unfloored pixel and has NOT been put to him: at a 1140 window
    behind a classic 15px scrollbar its paragraphs read 14.6px, its notes 13.0 and its by-line 11.4
    (14.8px for the paragraphs with overlay scrollbars); on a 1440 laptop behind a classic
    scrollbar its paragraphs hold 18.5 device px at 100, 110 and 125 % (the notes 16.45, the
    by-line 14.4; with overlay scrollbars, a MacBook's default, 18.75 / 16.67 / 14.58); on a 1920
    screen 200 % gives ×1.45 (×1.44 with overlay scrollbars); and the worst case, a 24″ iMac at
    its default 2240px width with overlay scrollbars, reads them 25.0 / 27.5 / 29.2 / 29.2 / 29.2 /
    29.2 / 45 device px at 100 / 110 / 125 / 150 / 175 / 200 / 250 % — ×1.17 at 200 % (a 2560
    screen ×1.33 with overlay scrollbars, ×1.32 with a classic one); a 20px default font on the
    1440 laptop reads 18.5px where rem would draw 22.5 (the phase-3 accessibility reviews'
    arithmetic, 2026-10-20). OPEN, his: accept it like the blog's list (his „1 a", CLAUDE.md §15.39
    round 3 (7)(1)), or THE FLOOR on PostPage's rhythm box (never under the theme below the 1401
    reference, as the price list; the article's title would then read 65px at a 1140 window, the
    other pages' 52.7). THE FLOOR mends every figure UNDER the reference — 18 / 16 / 14px at 1140,
    the 1440 laptop 18.5 → 19.8 → 22.5 at 100 / 110 / 125 %, the 20px default font — and raises
    the iMac's 200 % from 29.2 to 36, rem's own size there (×1.44; its 175 % 29.2 → 31.5, the
    1920's 150 % 24.75 → 27); but neither screen doubles by 200 %, each starting above the
    reference (×1.389 and ×1.375 at 100 %; twice the 100 % size near 278 and 275 %); only §15.25
    round 2's other lever, a cap at the reference, would double them. The article's TITLE has its
    own, separate open trade (the `hero-scaled` titles, item (a) of the TWO KINDS OF TITLE bullet
    above): the floor lifts it under the reference (on the 1440 laptop 66.9 → 71.5 → 81.3px at
    100 / 110 / 125 %) but leaves its ×1.11 on a 1920 screen. The
    price list's OWN numbers (§15.32 round 2, the a11y review's arithmetic, Chromium page zoom):
    under the reference a floor keeps it never smaller than develop and growing with a zoom as rem
    does; past it a 200 % zoom grows the price rows ×1.45 on a 1920 screen and ×1.44 on 2560
    (develop ×2), the 110 and 125 % steps leave them unchanged on 1920 and the 175 % step on 2560,
    and twice the 100 % size arrives at ≈ 275 %.
  - THE TOP BAR'S DROPDOWNS (CLAUDE.md §15.40; the accessibility review of 2026-10-16): an NVDA
    browse-mode pass and a JAWS one over „Servicii" and „Echipa" — the word a link, then its ⌄ named
    „Submeniul …" (aria-expanded), which a mouse cannot press at rest (it lets the pointer through to the
    word's arrow) — and an iPad held sideways under VoiceOver's touch exploration, where WebKit may skip that
    click-through ⌄. Tools that click by SCREEN POSITION (JAWS's mouse routing, Dragon's MouseGrid) land on
    the word's link and follow it, never the ⌄ — expected, to confirm. On a phone, VoiceOver and TalkBack
    on the menu's two section rows: „Servicii, button, collapsed" (with „current page" on its own page) and
    the list under it.

## 3 · The privacy and cookie policy page

- **BUILT 2026-10-10 (CLAUDE.md §15.38; the owner: "build all things mentioned and all fixes and
  add to backlog what needs to be done"):** `/{locale}/privacy` in all five languages
  (`sections/PrivacyPolicy`), linked from the Footer's legal strip („Confidențialitate și
  cookie-uri") on every page (a note under the map also pointed at its map part until
  2026-10-13); the Services page
  says under its last card that the prices include all taxes. The page states what the site
  measurably does: the host's logs, the ONE language cookie (its name and its 12 months read from
  the code, Safari's ~7 days), the Google map and its IP transfer, phone and WhatsApp contact, the
  links out, the visitor's rights and the complaint to ANSPDCP, and who runs the clinic.
- **Why it still waits — the owner's part, before launch:**
  - **the clinic's legal facts** — `legal` in `src/lib/clinic/clinic.ts`: the company's registered
    name, CUI, Trade Register number, registered office, and an e-mail for privacy requests. All
    five are on the registration certificate (Certificat de înregistrare) or with the accountant.
    Until each arrives the page prints „[de completat]" in its place and the e-mail is no link;
  - **the professional details** the page states (Law 365/2002 art. 5 for a regulated profession):
    that the doctors hold the title „medic dentist", granted in Romania, and are members of the
    Colegiul Medicilor Stomatologi din România — `controller.profession` in
    `src/messages/privacy/*.json`; correct it if any doctor's title was granted elsewhere;
  - **the prices line** — „Prețurile sunt exprimate în RON și includ toate taxele."
    (`services.prices.taxNote` ×5): confirm it is true of every price on the list — RESOLVED
    2026-10-26: the owner confirmed it („confirm asta", answering "Confirm „prices include all
    taxes" is true"), so the line stands as written;
  - **the patient part** — the page says the patient file is handled at the clinic, where the
    patient is informed about it (`contact.patient`); align it with the clinic's own patient
    privacy notice, if one exists. Whether the clinic has a data protection officer was asked
    here too, until the owner DROPPED the question on 2026-10-26 ("drop this too: Whether the
    clinic has a data protection officer (usually not required)"): the policy names none, and a
    single clinic is normally not required to have one;
  - **a lawyer's read of the Romanian text**, then the four translations confirmed — EN, DE, FR
    and IT are Claude's drafts, flagged in this lane's record (§15.38 lists the points the drafts
    raised: the GDPR wording for art. 6(1)(b), the one-month reply that GDPR lets extend by two,
    the gloss for the College's name in each language);
  - **from the five-language copy review (2026-10-10), the owner's or the lawyer's to settle:**
    the clinic's LEGAL FORM first (an SRL, or a cabinet medical individual or societate civilă
    medicală, which registers with the DSP's Registrul unic al cabinetelor medicale and holds a
    CIF — the page's labels were made form-neutral until then); how long phone and WhatsApp
    messages are kept (the page states criteria today, „cât timp ne trebuie", not a number);
    whether the Law 365/2002 art. 5 information should name the DSP as the authority that
    authorises the clinic; whether the 12-month language cookie fits the cookie law's exemption
    as Romania applies it (Opinion 04/2012 reads it narrowly; the CNIL and the Garante treat
    language cookies as exempt — a shorter `LOCALE_COOKIE_MAX_AGE_S` is the lever); the reviews
    part's legal basis, which the reviewers' written consent (entry 7) would settle;
- **At launch (the host changes):** the page names the interim host, GitHub Pages
  (`HOST` in `PrivacyPolicy.tsx`, `TODO(launch)`); switch it to the launch host and move
  `POLICY_UPDATED` the same day. On Cloudflare keep bot protection off, or the page must list its
  `__cf_bm` cookie (entry 1). Any later change to the words moves `POLICY_UPDATED` too.
- **If entry 1 ever ships a consent record:** the page lists that cookie as well (COOKIES.md §4)
  and says how to withdraw consent.

## 6 · Re-optimise the site for all its static content

- **Why it waits:** the owner, 2026-10-02, while the ribbon's white specks were being fixed: "add also
  with this pr in the backlog to reoptimize site for all static content". The ribbon fix (CLAUDE.md
  §15.26 round 7) is the trigger: it was a performance question too, and it showed how much the
  browser can still be spared.
- **When (the owner, 2026-10-26: "pictures and site speed optimization and seo optimisation comes
  when i'll have all the content."):** once all the content is in — entry 7's list, the real
  photographs and texts — because every new picture and text changes what is measured.
- **What it is:** one pass over everything the static export serves — the HTML of every locale ×
  route, the stylesheet, the client islands' JavaScript, the fonts, the optimised pictures — for
  weight and for the work the visitor's browser does with it, against CLAUDE.md §10.6, which already
  makes Core Web Vitals an acceptance criterion: Lighthouse / PageSpeed on the built export for each
  page type, the hero picture as the LCP element. The exact scope is the owner's to set when the
  work starts.
- **Starting points already recorded (read them first; none is a decision):**
  - the doctors band's ribbon sizes one canvas per card at mount, also on Home where the band starts
    below the first screen; lazy canvas creation is the recorded lever (CLAUDE.md §15.25) — and since
    round 7 each tile's pieces are painted in software and copied, at about develop's main-thread time
    on the workstation and a phone emulated with a slowed processor, never on a real phone (§15.26
    round 7 has the numbers);
  - the services page ships about 162 KB of JavaScript gzipped (§15.20 round 5's measurement), most of
    it the framework every page carries;
  - the hero's three photographs ship at 1920 × 1280, 74–202 KB each before the optimiser's variants
    (§15.21 round 11).
- **How to measure it:** on the built export, served the way the host will serve it, never the dev
  server — `next dev` ships unminified bundles and a different image pipeline. Record each page
  type's numbers before and after, in five languages where the words change the weight.

## 7 · What only the owner can supply — the placeholders

- **Why it waits:** these are the clinic's facts and words, and the owner authors the site's
  content (CLAUDE.md §15.17). Each is marked `TODO(owner)` where it lives; until it arrives, the
  site shows a placeholder. Added on the owner's word, 2026-10-10.
- **`src/lib/clinic/clinic.ts`:**
  - the WhatsApp number — the phone's for now, on the owner's word ("for the moment leave same
    number, i'll modify that", §15.27);
  - the production domain — still `https://example.com`. The metadata §10 asks for needs it
    (canonical URLs, hreflang links, the sitemap, the Open Graph tags), and the interim host stays
    noindex until it is attached (§15.2). Since 2026-10-17 a blog article's share links, its copy
    button and its LINK-PREVIEW tags (the cover photograph and the title a messenger shows for a
    shared link — the owner's "mandatory feature") are all built on it through lib/site-origin, so
    until it is set they point at the placeholder: a link sent from a share button or the copy
    button OPENS example.com itself, and a shared link draws no picture (Facebook also reads
    og:url as the page's own address and scrapes that, so even an address copied from the
    browser's bar may be sent there — Facebook's documented behaviour, not measured). A build can
    name another origin with the SITE_ORIGIN variable — the owner's network preview does; the
    interim Pages host's builds do NOT (release.yml sets only PAGES_BASE_PATH and NOINDEX), so
    once promoted its share links, copied address, og:url and og:image all read
    `https://example.com/premium-smile-development/…`. Setting SITE_ORIGIN there to the host's
    github.io origin is a one-line lever, not taken;
  - the company's five legal facts (`legal`, since 2026-10-10) — name, CUI, Trade Register number,
    registered office, a privacy e-mail; the privacy page prints „[de completat]" until each
    arrives. Entry 3 has the whole list of what that page still needs.
- **`src/lib/team/team.ts`:**
  - the six doctors — their names and specialties are the owner's; everything else is a random
    placeholder under those real names, in all five languages: the pictures (demo silhouettes),
    the course rows, the four „în cifre" numbers, the quotes and the three biography paragraphs
    with their key words (§15.23 round 3 and round 7, and the file's `TODO(owner): REAL DOCTORS,
    PLACEHOLDER DETAILS` block, which also flags Claude's two edits to the names and the
    specialties for confirmation). The weekly hours left the site with the doctor page's schedule
    card on 2026-10-13 (§15.23 round 7), so no placeholder "Thursday: closed" remains for a
    patient to act on. Also Claude's drafts, from the same day: the courses' eyebrow „Repere din
    drumul meu spre specializare" in five languages, and each doctor's second biography paragraph
    and „Cursuri" tile written around it. ESTIMATES ARE ENOUGH for each doctor's four „în cifre"
    numbers (the owner, 2026-10-26: "and in cases of dr pages for the same category component
    elements also just estimations"): three tiles print their number with „+", "at least", so an
    estimate rounded down stays true; the „Cursuri" tile is today a bare count of the course rows
    the page lists, so an estimate there takes the „+" too and never says fewer than those rows
    (tests/unit/team-data.test.ts);
  - the clinic's three numbers on Home and Team — 16+ years, 8.000+ patients, 11.000+ procedures —
    placeholders too (`clinicStats`, §15.23 round 5): no clinic-wide count exists in the
    repository or on the old site. ESTIMATES ARE ENOUGH here too (the owner, 2026-10-26: "add at
    those that i want just some estimations: Years open / Total patients / Total procedures"):
    the clinic's own round figures replace them, rounded down under their „+".
- **`src/lib/prices/prices.ts`:** five rows read off a skewed photograph of the printed tariff
  carry `TODO(owner): verify against the printed sheet` (§15.20).
- **`src/lib/hero-slides/hero-slides.ts`:** the Home opener's three slogans and their picture
  descriptions are Claude's drafts in all five languages (§15.21 round 11) — to confirm or rewrite.
- **The Team page's hero** (`team.hero.title` and `team.hero.lead` in `src/messages/*.json`, since
  2026-10-15, CLAUDE.md §15.25 round 4): the heading „Echipa noastră: specialiștii cu care ne mândrim /
  și oamenii care te întâmpină la clinică" and its three-line lead are Claude's drafts in all five
  languages, each measured to step down like the blog's — to confirm or rewrite (a new wording must
  pass the same measurements: the hero's scale test reads the message files).
- **`src/content/blog/posts.json`** (the blog's list page, §15.39 — added 2026-10-11): the twelve
  posts are Claude's placeholder drafts — titles, summaries, dates and tags written so the blog
  page can be seen, attributed to the clinic's real doctors and illustrated with the clinic's own
  three photographs — and, since round 3 (2026-10-14), translated by Claude into English, German,
  French and Italian, the blog being in every language. One of them has an article behind it, in
  all five languages (the next bullet); the other eleven have none — their cards open that one
  article, the stand-in, while each is named for its own post (an SC 2.4.4 mismatch until every
  post has its article; ui/TextButton's THE PROMISE, HALF KEPT) — on the list's pages AND, since
  2026-10-17, in the Home page's articles band, which shows the same cards. They
  landed on develop with the page on the owner's word (2026-10-14), so the next promotion publishes
  them on the interim host — linked from the top bar of every page in every language since rounds 2
  and 3 of the same day (§15.39), and noindex like the whole host. Their reading times („4 min de
  citit", `readingMinutes`) are placeholders too, and so are the list page's hero heading and lead
  and the card's „Citește mai mult…" — Claude's drafts in all five languages (`blog.hero.*`,
  `blog.card.*`); since 2026-10-15 the heading ends on "through our blog" (the German one the
  owner's, refined with him: „…wie Sie es pflegen, in unserem Blog") and the lead is three phrases, its middle item dropped for the stairway. Replace them, or have each named doctor confirm theirs, in every language, before
  launch (the next promotion already publishes them, linked from every page, on the noindex interim
  host).
- **`src/content/blog/articles/`** (the article page, §15.39 round 4 — added 2026-10-14): the one
  article behind the list, „Cum îți alegi periuța de dinți" (728 words, signed by Dr. Nicu Elena
  Alina), is Claude's draft — the doctor confirms or rewrites it. Its pictures are STAND-INS: since
  2026-10-15 it shows every kind of blog photo and every kind of before/after the owner asked to
  see (with a heading and a note, a heading alone, a note alone, neither — four photos and four
  pairs), all of them the clinic's own lobby, treatment room and handpieces, under headings and
  grey „Notă: …" lines that say so; and since 2026-10-17 it shows TWO galleries — circular, then
  end to end, three cards in each window (the five-card window is the Home page's) — each of the
  same EIGHT placeholder photographs (`public/images/demo/gallery-1.jpg` … `gallery-8.jpg`):
  portrait crops, six of the clinic's own three hero photographs and two of a STOCK close-up of a
  dental check-up (`public/images/demo/hero-calm.jpg`, not the clinic's own, its source
  unrecorded), captioned by Claude in five languages. A
  real before/after of a patient needs that patient's written consent (a photograph of someone's
  teeth is health data, GDPR art. 9) and a CMSR check (the advertising guide bans unrealistic
  result imagery). Its share links and its
  copy button carry the placeholder domain until `url` is set (above). Its EN/DE/FR/IT words
  (2026-10-15) are Claude's drafts, checked against the CMSR scan and the dash rule — for the
  owner's reading like the rest of the site's foreign copy. EVERY CARD OF THE LIST (and of Home's articles band) OPENS IT for
  now — the owner's "dummy" (2026-10-15: "all should point to same article"): a card titled one
  thing opens this article until its own post has an article, which its card then opens by
  itself (lib/blog-article's THE STAND-IN) — and its reading time is its own post's placeholder:
  nine of the eleven stand-in cards announce 3, 5, 6, 7 or 8 minutes and open a page that says 4.
  Before launch every post needs its article, or the stand-in leaves.
- **Consent (GDPR):** written consent from the patients whose seven Google reviews show their
  names, three with their photographs — a name beside a dental review is health data, art. 9
  (§15.19 round 4, `src/lib/reviews/reviews.ts`); and the same from every doctor and every member
  of staff the site names, pictures and describes (`lib/team`'s block). The staff's portraits are
  still demo silhouettes (§15.23 round 4).
- **Already public:** nothing in CI refuses a release while these placeholders remain — the
  release gate recorded in §15.23 round 3, a test that refuses a production build while `lib/team`
  is flagged placeholder, was never built — and the 2026-10-03 promotion published them on the
  interim host, which is built with `NOINDEX=1` (`.github/workflows/release.yml`), so search
  engines skip it.
- **The work:** the owner sends each value; it lands in its file, where the data tests and the
  CMSR scan (§13) check it.

THE LIST FOR THE CLINIC (the owner, 2026-10-26: "le vreau cu liniuta pe romana, la ce ii legat de
doctori vreau o lista cu fiecar doctor individual ce ii trebuie, odata ca si fotografie, odata
pentru pagina respectivilor"), in Romanian — what to ask the clinic for:

**Contact**

- numărul de WhatsApp, dacă e altul decât telefonul clinicii
- o adresă de e-mail pentru pacienți
- o adresă de e-mail pentru cererile privind datele personale (poate fi aceeași)
- pagina de Facebook a clinicii, dacă există
- confirmarea programului: luni–vineri 09:00–19:00, sâmbătă și duminică închis
- domeniul site-ului (adresa web a clinicii)

**Date legale (pentru pagina de confidențialitate)**

- denumirea firmei
- CUI
- numărul de la Registrul Comerțului
- sediul social
- forma juridică: SRL, cabinet medical individual sau societate civilă medicală
- autorizația DSP și înscrierea în Registrul unic al cabinetelor medicale
- nota de informare a clinicii pentru pacienți, dacă există
- cât timp se păstrează fișele pacienților

**Medicii — pentru fiecare medic, separat**

**Dr. Malea (Sabău) Oana Bianca — medic specialist în protetică dentară și parodontologie**

- fotografia: de la talie în sus, cu fundalul eliminat (sau pe un fundal simplu, îl eliminăm noi)
- pentru pagina medicului:
  - o biografie scurtă (3 paragrafe)
  - un citat personal (filozofia de lucru)
  - cursurile și specializările (5–6 repere)
  - cifrele, ca estimări: ani de experiență, pacienți, intervenții, cursuri
- acordul scris pentru apariția pe site
- de confirmat: specialitatea, așa cum e scrisă mai sus

**Dr. Toma Lucian — medic specialist în protetică dentară, specializat în endodonție microscopică**

- fotografia: de la talie în sus, cu fundalul eliminat (sau pe un fundal simplu, îl eliminăm noi)
- pentru pagina medicului:
  - o biografie scurtă (3 paragrafe)
  - un citat personal (filozofia de lucru)
  - cursurile și specializările (5–6 repere)
  - cifrele, ca estimări: ani de experiență, pacienți, intervenții, cursuri
- acordul scris pentru apariția pe site
- de confirmat: specialitatea, așa cum e scrisă mai sus

**Dr. Nicu Elena Alina — medic specialist în parodontologie**

- fotografia: de la talie în sus, cu fundalul eliminat (sau pe un fundal simplu, îl eliminăm noi)
- pentru pagina medicului:
  - o biografie scurtă (3 paragrafe)
  - un citat personal (filozofia de lucru)
  - cursurile și specializările (5–6 repere)
  - cifrele, ca estimări: ani de experiență, pacienți, intervenții, cursuri
- acordul scris pentru apariția pe site
- de confirmat: specialitatea, așa cum e scrisă mai sus

**Dr. Ivașcu-Zugravu Cătălina — medic specialist în ortodonție și ortopedie facială**

- fotografia: de la talie în sus, cu fundalul eliminat (sau pe un fundal simplu, îl eliminăm noi)
- pentru pagina medicului:
  - o biografie scurtă (3 paragrafe)
  - un citat personal (filozofia de lucru)
  - cursurile și specializările (5–6 repere)
  - cifrele, ca estimări: ani de experiență, pacienți, intervenții, cursuri
- acordul scris pentru apariția pe site
- de confirmat: scrierea numelui cu diacritice (Ivașcu, Cătălina) și specialitatea — „ortopedie facială" sau denumirea oficială, „ortopedie dento-facială"

**Dr. Opriș Mircea — medic specialist în chirurgie dento-alveolară**

- fotografia: de la talie în sus, cu fundalul eliminat (sau pe un fundal simplu, îl eliminăm noi)
- pentru pagina medicului:
  - o biografie scurtă (3 paragrafe)
  - un citat personal (filozofia de lucru)
  - cursurile și specializările (5–6 repere)
  - cifrele, ca estimări: ani de experiență, pacienți, intervenții, cursuri
- acordul scris pentru apariția pe site
- de confirmat: scrierea numelui cu diacritice (Opriș) și specialitatea

**Dr. Bozdog Horațiu — medic specialist în chirurgie dento-alveolară**

- fotografia: de la talie în sus, cu fundalul eliminat (sau pe un fundal simplu, îl eliminăm noi)
- pentru pagina medicului:
  - o biografie scurtă (3 paragrafe)
  - un citat personal (filozofia de lucru)
  - cursurile și specializările (5–6 repere)
  - cifrele, ca estimări: ani de experiență, pacienți, intervenții, cursuri
- acordul scris pentru apariția pe site
- de confirmat: scrierea numelui cu diacritice (Horațiu) și specialitatea

**Personalul de sprijin — pentru fiecare: o fotografie portret, pe verticală (format 3:4), și acordul scris pentru apariția pe site**

- Stan Ioana Ecaterina — registratoare medicală
- Gurgu Aurelia — asistentă medicală
- Cândea Angelica — recepție, programări și comunicarea cu pacienții

**Cifrele clinicii („În cifre") — ca estimări**

- de câți ani funcționează clinica
- numărul total de pacienți
- numărul total de intervenții

**Prețuri**

- de verificat 5 rânduri, citite dintr-o fotografie neclară a listei de prețuri:
  - Extracție corp străin de pe canalul radicular (ac) — 300 lei
  - Extracție corp străin de pe canalul radicular (pivot, DCR) — 220 lei
  - Kemeny flexibil — 550 lei
  - Gutieră de repoziționare — 1.100 lei
  - Implant dentar Bredent — 3.200 lei
- confirmarea că toate prețurile sunt la zi

The items the owner supplies himself are off this list but still owed in the bullets above: the
reviewers' consent, the blog's articles and their photos, the Home opener's slogans, the Team
page's heading and the placeholder posts.

## 8 · Decisions parked until launch

- **Why it waits:** each was recorded as the owner's to make before launch, and none blocks the
  work in progress. Added on the owner's word, 2026-10-10. On 2026-10-26 the owner settled four of
  the five (below); only the final host is still open.
- **The decisions:**
  - translated URLs — `/de/leistungen` instead of today's shared English slugs (`/de/services`,
    and since 2026-10-10 `/ro/privacy` for the policy page, which could be `/ro/confidentialitate`).
    Decide before launch: changing a published URL afterwards needs redirects (CLAUDE.md §5,
    §15.3). DECIDED 2026-10-26: translated URLs, being built in their own lane
    (`rework/localized-slugs`; the owner: "this sound sensational, but i want a separate worktree
    working on it"). The item stays until that lane lands;
  - the share image — the picture WhatsApp and Facebook show beside a link to the site, the Open
    Graph image (§10.3; §15.6's last open item, for which the logo mark is the natural source).
    DECIDED 2026-10-26: the clinic's logo mark (the owner: "here i go with your idea: The
    link-preview image (the logo is the natural choice)"), built with the SEO work (entry 10);
  - the final host — Cloudflare Pages is the recommendation, not yet confirmed; GitHub Pages is
    the interim host only and will not be the launch host (§15.2);
  - the purple — whether `accent-decorative` #7A6D9C moves to the logo's own lilac #8576B1, which
    re-tints the lilac tints, the auras and the ribbon with it (§15.1's one open sub-item, §15.28).
    DECIDED FOR NOW 2026-10-26: #7A6D9C stays (the owner: "keep like it is now at the moment"),
    open to revisiting.
- **Dropped 2026-10-26:** EUR prices on the foreign-language pages — lei (RON) everywhere, no
  euros (the owner: "drop this: Euro prices on the foreign-language pages, or lei everywhere.").

## 9 · Re-check the privacy policy against the website

- **Why it waits:** the owner, 2026-10-11: "also add in the backlog to recheck policy if it is
  compliant with my website". The policy page (entry 3, CLAUDE.md §15.38) was written on
  2026-10-10 from what the site did that day, and the site keeps changing. Entry 3 holds what only
  the owner and a lawyer can settle; this entry is the check that every sentence of the policy is
  true of the site as it ships, and that the site does nothing the policy leaves out.
- **When:** before launch, on the launch host and the real domain; and again after any change to
  something the policy describes — the host, the map, the language cookie, a new link to another
  site, a page that shows people's names or photos, anything loaded from another site (a script,
  a font, a picture, a video), or a form.
- **What to check — each claim, on the built export served the way the host serves it (never
  `next dev`), in a fresh browser profile:**
  - "a single cookie, only after a language choice" — browse every page type, scroll, open the
    contact dialog, move the map: no cookie at all; then pick a language, and accept and close the
    language suggestion: exactly one cookie, `NEXT_LOCALE`, holding only the language code, for
    12 months (`LOCALE_COOKIE_MAX_AGE_S` in `src/i18n/cookie.ts`; Safari keeps it 7 days at
    most). The page prints the name and the lifetime from the code, so those two cannot drift;
    what it says about WHEN the cookie is written can;
  - "no other form of storage in your browser" — localStorage, sessionStorage and IndexedDB empty
    for the site, and no service worker;
  - "no analytics, advertising or tracking cookies", and Google's map as the only other company —
    a network capture on every page type: every request goes to the site's own address, except
    Google's map frame on the pages that show the map;
  - "no forms" — no `<form>` and no text field on any page;
  - the map — "loads when you scroll close to it", does not tell Google which page you are
    reading, and in current browsers carries none of your Google cookies: the `<iframe>` wears
    `loading="lazy"`, `referrerPolicy="no-referrer"` and `credentialless`; re-run the cookie probe
    of COOKIES.md §3; the section name the policy quotes („Ne găsești") is still the band's heading
    in each language, and the address and the phone stay beside the map and in every footer;
  - "reviews on the home page, with names and, for some, a photo" — still on Home only, and the
    reviewers' consents in hand (entry 7);
  - "the links to Instagram, TikTok, WhatsApp or Google Maps" — list every link to another site on
    the built pages and compare (today's list is below);
  - "hosted by" — the host the page names, and the privacy policy it links, are the host that
    actually serves the site (entry 3's launch switch);
  - the clinic's details — the legal facts once the owner supplies them (entries 3 and 7); the
    phone and the address come from `src/lib/clinic` and follow by themselves;
  - the five languages still say the same thing — `tests/unit/privacy-parity.test.ts` checks the
    keys and the placeholders, not the meaning;
  - every change to the words moves `POLICY_UPDATED` in `PrivacyPolicy.tsx`, the date at the top.
- **Today — a quick look at develop `823bce1`'s build, 2026-10-11, not the full check:** the map
  frame wears all three attributes; no page has a form; no code in `src/` uses any other browser
  storage; the only thing loaded from another site is Google's map frame, on the 40 pages that
  show the map; the links to other sites go to WhatsApp, Instagram, TikTok, Google Maps and ANPC's
  complaint site `reclamatiisal.anpc.ro` (in every footer), and, from the policy page itself, to
  the College of Dentists, ANSPDCP, GitHub, Google and WhatsApp. The one gap found: the policy's
  links part does not name the ANPC link — whether it should is the lawyer's call (entry 3).
- **A lever, not built:** the mechanical half of this list — no form, nothing from another site
  but the map, the frame's three attributes, no storage in the code — could become a test over the
  built export, so that CI fails the day the site and the policy part ways.

## 10 · Getting found on Google — the search-engine work (SEO)

- **Why it waits:** the owner, 2026-10-11: "now that i think about it add to backlog optimisation
  of the website" — and, asked whether he meant speed or Google search, "both i think?". Speed
  is entry 6; this entry is the other half. CLAUDE.md §2 makes "SEO-ready by construction" a
  non-negotiable and §10 is its checklist, but the work was planned inside the content run the
  owner halted on 2026-09-06 (§15.17), and none of it reached develop. The plan is
  PHASE4_SEO_PLAN.md §3, §4 and §7 — its §6 and §7 predate the clinic's photos, the map, the
  real reviews and the favicon, so read them as the plan for the machinery, not as today's state.
- **When (the owner, 2026-10-26: "pictures and site speed optimization and seo optimisation comes
  when i'll have all the content."):** the work starts once all the content is in (entry 7), and
  the share image, the logo mark (entry 8), is built with it.
- **Today (develop `823bce1`'s build, 2026-10-11):** no page carries the clinic's structured
  data (the `Dentist` JSON-LD), a canonical link, links to its other languages (hreflang) or
  Open Graph tags; there is no `sitemap.xml` and no `robots.txt`; Home and Services are titled
  „Premium Smile" alone (Team „Echipa noastră — Premium Smile", a doctor's page „Dr. {name} —
  Premium Smile"), and only the privacy page has a meta description. The interim host is built
  with `NOINDEX=1` (`src/app/[locale]/layout.tsx`), so none of this costs anything until the
  domain is attached — and all of it is due before launch.
- **The work, in §10's order:**
  - the `Dentist` JSON-LD on every page, fed only by `src/lib/clinic` (§10.1–2), with zero
    errors in Google's Rich Results Test — the archived S1 commit `cc749de` (closed PR #81,
    PHASE4_SEO_PLAN.md §2) still applied cleanly on 2026-10-10 and is the recorded first
    candidate;
  - a title and a meta description for every page in every language, "Service — Clinic — City"
    (§10.3) — the words are the owner's (§15.17), drafted by Claude only on his word; the doctor
    pages' pattern is in PHASE4_SEO_PLAN.md §4;
  - Open Graph tags and the share image — the clinic's logo mark, decided 2026-10-26 (entry 8),
    built with this work;
  - `sitemap.xml` with hreflang alternates and `x-default`, hreflang links in every page's head,
    a self-referencing canonical, and `robots.txt` pointing at the sitemap (§10.4);
  - optionally, `Service` markup on the Services page (§10.2; the archived `servicesJsonLd`);
  - at launch: the sitemap submitted in Google Search Console, and the owner claims the Google
    Business Profile (§10.7) — for both, the clinic's Google Business Profile LOGIN, to get from
    the clinic (the owner, 2026-10-26: "add this for launch backlog: The clinic's Google Business
    Profile login, to claim it and submit the sitemap at launch"); Search Console still verifies
    the domain itself, by a DNS record or a file on the site.
- **Depends on:** the production domain (entry 7 — every canonical, hreflang link, sitemap row
  and the JSON-LD's `url` is built from it); translated URLs (entry 8 — once Google has indexed
  a URL, changing it needs a redirect; decided 2026-10-26, in their own lane); the share image
  (entry 8 — decided 2026-10-26: the logo mark). Already done: the Footer's address and phone on
  every page (§10.5). Core Web Vitals (§10.6) are entry 6.

## 12 · The patients' reviews — the „[…]" cuts and the CMSR's testimonial rule

- **Why it waits:** the owner, 2026-10-16, after asking why the reviews on Home show „[…]" and
  whether showing them straight from Google would still leave the clinic answerable for them
  („ele sunt pubblice pe google reviews adica daca de exemplu iau un api care numa streamuieste
  reviewurile, mai is "liable" de chestia asta??"): "add to backlog that i should come back on
  this". Nothing changes until he decides.
- **Today:** the seven reviews (`src/lib/reviews/reviews.ts`, CLAUDE.md §15.19 round 4) are the
  patients' Google reviews with eleven phrases cut, each cut marked „[…]" — on 2026-09-30 the
  owner picked "Trim" over "Word for word". The four other languages were translated from the
  cut Romanian and carry the same marks. What each mark hides, by the card's title (the names
  stay in the data rows alone: the repository is public, and the consents are still owed —
  entry 7):
  - „Empatie și implicare": „Recomand cu […] încredere!" ← „cea mai mare";
  - „Procedura, explicată clar", four: the opening „Experiența mea … a fost extraordinară, …",
    „de optimă calitate", „impecabilă", „o super profesionistă";
  - „De la recepție până în cabinet": „este una […]." ← „impecabilă, din toate punctele de
    vedere";
  - „Atenție la detalii": „a fost […]." ← „extraordinară", and „experiențe stomatologice […]." ←
    „de calitate";
  - „Instrumente și tratamente noi": „sunt noi […]." ← „și foarte calitative";
  - „Același medic de zece ani": „de aproximativ 10 ani […]." ← „și colaborarea cu ea a fost la
    superlativ";
  - „Grijă și pentru cei mici": „cât și de profesionalism […]." ← „- premium 😄".
- **The rule, in the adopted text:** Decizia CMSR nr. 04/2CN/2025 (Monitorul Oficial nr. 529 of
  6 June 2025, in force since 1 July 2025), annex, pct. 3.1 lit. d): „Forma de exercitare a
  profesiei sau medicul care preia pe site-ul web sau paginile din cadrul rețelelor de socializare
  afirmațiile/testimonialele pacienților este responsabil conform legii și poate fi sancționat în
  conformitate cu prevederile Codului deontologic al medicului stomatolog pentru conținutul
  preluat." The banned words are pct. 3.3 lit. (a)(iii) — „cea mai bună", „top", „optim",
  „excelență", „servicii profesionale" / „calitative" / „de înaltă calitate", „servicii premium
  sau exclusiviste" among them. Read on 2026-10-16 in the copy the Argeș county college published
  (cmsarges.ro, „Ghidului de bune practici privind publicitatea medicilor stomatologi"); cmsr.ro's
  own page for the guide serves the April 2025 draft, the same paragraph in substance, and the old
  PDF address under cmsr.ro/wp-content/uploads/2025/04/ answers 404.
- **The API question — no, read off the guide (not a lawyer's opinion):** being public on Google
  is not the point. There the patient publishes; on the site the clinic does, and the rule's verb,
  „preia", says nothing about how the taking is done. A feed of Google's reviews (the Places API)
  leaves the liability where it is and adds risks:
  - the text arrives whole, the banned words included; cutting them makes it a feed no longer;
  - Google picks the reviews — "A maximum of 5 reviews can be returned", "sorted by relevance" —
    so a new review would appear on the site unread, and the clinic would answer for it;
  - Google's display rules ("Policies and attributions for Places API") require each review's
    author and avatar and a link to the original, while the guide's same page asks the patient's
    prior consent for photos, „inclusiv cu privire la indicarea numelui";
  - Google forbids storing Places API content (place IDs excepted), so the reviews could not be
    written into the static HTML at build: each visitor's browser would fetch them, which
    CLAUDE.md §16 rules out — a paid API key, and the visitor's IP sent to Google before any
    consent, entry 1's question a second time.
- **Found while checking (2026-10-15 and 16):**
  - two cuts leave a sentence without its point — „Atenție la detalii"'s „… a fost […]." and „De
    la recepție până în cabinet"'s „… este una […]."; the rule was the smallest cut that leaves a
    whole sentence, and screen readers skip the brackets at their default settings, so a listener
    hears "My experience … was." The lever: cut the whole clause, as „Procedura, explicată clar"
    does for its opening;
  - the line between kept and cut is a judgment: „sunt mulțumit de calitatea lucrărilor" stayed
    and „experiențe stomatologice de calitate" went; and while the guide bans „servicii
    profesionale", six of the seven quotes keep „profesionalism", „profesionalitate" or „foarte
    profesional", said by patients about their visit — for the lawyer's read (entry 3);
  - the CMSR scan (`tests/unit/cmsr-scan.test.ts`, CLAUDE.md §13) would catch ONE of the eleven
    phrases if it came back, „cea mai mare" (run against its Romanian patterns on 2026-10-16): it
    has none for „extraordinar", „impecabil", „optim" alone, „super", „la superlativ",
    „calitativ" or „premium" — the last needs care, since the clinic's own name carries it.
    lib/reviews' header says such a word "fails CI instead of shipping"; for these it would not.
- **The choices when the owner comes back (none taken):**
  1. keep the cuts and their marks — honest and inside the guide; the cost is the look;
  2. settle it with the consents entry 7 already owes: show each patient the shortened text when
     asking, and a text the patient approved is theirs — the marks on that card can go (the
     recommendation of 2026-10-15);
  3. replace the reviews with ones that need no cut — every one on the site needs one today;
  4. no reviews on the site, a link to the clinic's Google listing instead: nothing is taken
     over. The same guide, pct. 2 lit. f (iii), bars links to pages whose content may be
     considered contrary to the profession's ethical and deontological principles; a link to the
     clinic's own listing is common practice, but that is the lawyer's call (entry 3);
  5. word for word — the 2026-09-30 choice reversed: no marks, and every phrase the guide bans
     shown on the clinic's own site.
- **Not on the list:** the API (above), and the cuts without their marks, which would show a
  shortened text as the patient's whole words.
- **The work, once decided:** the rows of `src/lib/reviews/reviews.ts` in all five languages, its
  data test (`tests/unit/reviews-data.test.ts`) and the CMSR scan; lib/reviews' header and
  CLAUDE.md §15.19 round 4 record the decision; the screenshots that show the deck — Pages/Home,
  Sections/ReviewsCarousel and Sections/ReviewCard.
