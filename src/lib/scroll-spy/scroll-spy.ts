import {
  createExternalStore,
  type ExternalStore,
} from '../external-store/external-store.ts';
import {
  planReadingLine,
  readingIndex,
  type ReadingFrame,
  type ReadingPlan,
} from '../reading-line/reading-line.ts';

// lib/scroll-spy — "WHICH SECTION AM I LOOKING AT?", as a React-free store.
// The mechanical half of an in-page navigation: it watches the document
// scroll, decides which of a list of fragment targets the visitor has reached,
// and publishes that id. It renders nothing — with ONE exception, on one line:
// a spy built with `line: 'reading'` writes its targets' `scroll-margin-top`,
// because that line owns where a jump to them lands (THE READING LINE) — names
// nothing and knows no word of any language (CLAUDE.md §4's foundation ring,
// fence-tested by tests/unit/lib-react-free.test.ts) — the menu that reads it
// owns the markup and the look.
//
// ── WHY IT EXISTS (owner, price-list pack round, 2026-09-14): "the on hover
// animation for current item … normal scrolling also dictates menu item, but
// menu item click takes you also to navigation item. plz craft carefully so it
// doesn't break when it goes both ways". That reverses the price-list board's
// §4.3 option A — the price band shipped with NO current-item marker precisely
// because marking one needs a browser — so this module is the measurement that
// option A said was missing, and THE PIN below is the "so it doesn't break
// when it goes both ways" half.
//
// ── TERMS, FOR THE READER WHO HAS NOT MET THEM.
//   · A SCROLL EVENT is the browser saying "the page moved". It is not a
//     stream: the engine fires at most one per rendered frame, however fast
//     the wheel spins, and it fires AFTER the move, never before it.
//   · A FRAGMENT JUMP is what `<a href="#endodontics">` does — a same-document
//     navigation that puts `#endodontics` in the URL and scrolls that element
//     into view. No JavaScript is involved; the browser does all of it.
//   · The LANDING LINE is where a jump comes to rest: the y this document's
//     own CSS says a jumped-to target's top edge should sit at. It is computed
//     below from the same two properties the browser itself uses, which is the
//     one design decision that makes both directions agree.
//   · To SETTLE is for the scrolling to stop. A smooth jump glides for a few
//     hundred milliseconds, streaming one scroll event per frame all the way;
//     an instant one sends a single event; a click on an item already at its
//     line sends none at all. "Settled" here means "quiet for settleMs".
//
// ── WHY IT LIVES IN lib/ AND NOT IN THE BAND THAT ASKED FOR IT (the
// two-question home test in lib/cx/cx.ts):
//   1. Does it import React, or exist to construct components? No — it is a
//      listener, an arithmetic walk and a store; the `useSyncExternalStore`
//      that reads it lives in its consumer (sections/PriceList/PriceMenu).
//   2. Does it encode a specific atom's look or API? No — no class string, no
//      message key, no DOM output, nothing about a price.
// Both answers put it in the foundation ring, beside lib/scroll-lock, which is
// the same kind of thing: browser MECHANICS with no React in them (the ring is
// React-free, not browser-free — the cx-to-lib lane, 2026-09-02). A second
// consumer was foreseeable and is why this was not five lines inside the
// island — the doctor page's year timeline was one until 2026-10-13 (RETIRED,
// below) — and a long blog post's outline is the next one in line.
//
// ── CONSTRUCTION IS PURE; start() IS THE FIRST BROWSER TOUCH. `output:
// 'export'` renders every client component in Node during the static build,
// where `window` does not exist, and §16's hydration-safety rule says
// visitor-dependent UI renders a neutral default and decides only after mount.
// So createScrollSpy() validates its options, fills in variables and touches
// no document, no window and no timer (the lib/clock precedent). Its
// construction snapshot is `{ current: null }`, which is therefore also the
// FROZEN server snapshot for the store's whole life (lib/external-store's
// third rule) — the static HTML carries no marker anywhere (the price menu's
// `aria-current`, its card's `data-current`), the browser's first render
// agrees with it byte for byte, and the marker appears one frame later when
// start() has looked at the real page.
//
// ── THE LANDING LINE, and why it is not a magic offset — the DEFAULT line
// (`line: 'landing'`; THE READING LINE below is the other). A fragment jump
// comes to rest so that
//     target.getBoundingClientRect().top − scroll-margin-top(target)
//       === scroll-padding-top(<html>)
// — the scroll padding is the strip this site keeps clear at the top of the
// viewport (globals.css: 6rem, the header pill's reach, SC 2.4.11), and the
// target's own scroll margin is the extra air it asks for on top of that. Both
// are read here with getComputedStyle and parseFloat, and anything unreadable
// ('auto', '', a keyword) counts as 0. A target has REACHED ITS LINE when
//     rect.top − margin <= padding + 1
// — "at or above", with one pixel of grace for the sub-pixel arithmetic a
// fractional device-pixel ratio or a zoomed page produces. Reading the very
// two properties the browser consults means a click and the scroll walk can
// never disagree about where "current" begins: there is no second definition
// of the landing line anywhere in this repo, and no consumer-supplied offset
// to keep in sync with a header's height. It was the price menu's line from
// 2026-09-14 until round 5 (2026-09-29), when the menu moved to THE READING
// LINE; since then it is the default, and no consumer in the repo walks it.
//
// ── ONE LINE PER SPY, AND EVERY RULE ASKS IT. The line is chosen once, at
// construction, and each rule below that asks "has it reached?" asks it of
// that line and no other: the POSITION WALK, the TOP FALLBACK (nothing has
// reached THE line yet) and the PIN's arrival check (on the landing line with
// the walk's pixel of grace, or still below it at the page's end; on the
// reading line, within two pixels of the target's own landing). The BOTTOM
// RULE holds no line at all and belongs to the landing line's walk; the
// reading line has no need of it (THE READING LINE). So a spy never carries
// two notions of "reached".
//
// ── RETIRED, 2026-10-13: a third line, `line: 'middle'` (the screen's centre,
// D49), and the `topFallback` option with its 'none' (D35) left with the
// doctor page's year timeline, their one consumer (CLAUDE.md §15.23).
//
// ── THE READING LINE — the second line (`line: 'reading'`; the price menu's
// round 5, 2026-09-29 — owner: "when you scroll, it turns on the shadow
// highlight too late, once it already passes the that point at which you see
// the top of the card because it already passes below the top bar … i need a
// new scrolling or selecting of current card that keeps the line lower for
// currently selected items and also selects top one, like idk, maybe
// somehting based on size of card … and also the go to card when you click on
// the meniu on an option should be more to the center of the screen"). The
// landing line lit a card as its top slid under the header pill — as it was
// leaving the screen. A line at the screen's middle cannot serve a menu whose
// items are JUMPED to — the browser lands every jump on the landing line,
// under the header pill, where a pin checked against the middle has not
// arrived — and at the top of a page it skips every short card whose
// neighbour is already above the middle at scroll 0: there is no scrolling
// above scroll 0 in which to reach it. The arithmetic that answers both lives
// in lib/reading-line — pure numbers; its header argues every step and its
// suite proves the result on the measured page — and this spy is where it
// meets the document:
//   · IT IS NOT THE MIDDLE OF THE SCREEN. It is the middle of the part of the
//     window the page keeps CLEAR, `(scroll-padding-top + innerHeight) / 2`:
//     under the 96px pill the eye's middle sits 48px lower than the screen's.
//     Near either end of the page it BENDS, so the first card is current at
//     scroll 0 even when the second is already above the line, and the last
//     at the page's end.
//   · IT OWNS THE LANDING — THE ONE WRITE. A card that fits the clear area
//     comes to rest CENTRED on the line, a taller one with its top on its old
//     ceiling (padding + its own stylesheet scroll-margin-top: the 136px line
//     the sticky menu rests on). The browser lands every fragment jump by
//     `scroll-margin-top`, so this line WRITES each target's planned margin
//     inline — rounded to two decimals, and only when it differs from what
//     this spy last wrote there — and takes it off again in dispose(), when
//     the stylesheet's own value returns. Every evaluation READS FIRST AND
//     WRITES AFTER: within ONE evaluation no rect is read after a write. A
//     task may hold more than one evaluation — start() with a known hash
//     measures again after the first one's writes (12 reads after 11 writes
//     on the price page), and a settle measures twice (its arrival check, then
//     the finish below) — so the rule bounds each evaluation, not the task.
//     That margin is the one thing this module writes to the page. The FLOOR
//     it plans from is the stylesheet's margin, read at start() — before the
//     first write — and again on every resize, with the spy's own write lifted
//     first (a breakpoint may change it: EVENTS' own argument for never
//     hoisting the read), and never on a scroll event. So a reading-line
//     target keeps its floor in a STYLESHEET — the price card's
//     `scroll-mt-[2.5rem]` — because an inline one is the very property
//     this line writes over.
//   · THE TWO ENDS AND THE TWO PROPERTIES. Near an end the landings are kept
//     inside the page and apart, a share of each card's size between them
//     (the owner's "based on size of card"), so that (1) every target is the
//     answer over some stretch of scrolling, in document order, and (2) at
//     each target's landing the answer IS that target — a click and the
//     scroll can never disagree. So the walk on this line is lib/reading-line's
//     readingIndex over a plan measured afresh at every evaluation; THE BOTTOM
//     RULE is not consulted — the plan keeps the last landing inside the page,
//     which makes the page's end the last target's by construction — and the
//     TOP FALLBACK answers the −1 the plan gives above the first target. The
//     PIN's arrival check asks property (2) directly: the page rests within
//     TWO pixels of the pinned target's landing, because a jump rounds it —
//     the margin to two decimals, the scroll to a whole pixel (measured in the
//     test browser, 2026-09-29: a planned 780.55 landed at 781).
//   · A TARGET THAT CHANGES SIZE RE-MEASURES — fonts arriving, a zoom, a row
//     wrapping: a ResizeObserver on every target runs the same evaluation.
//   · THE ONE SCROLL THIS MODULE MAKES: finishing a jump that did not know the
//     plan. A link with `#id` in it is followed by the BROWSER at load, before
//     any script has run — onto the stylesheet's margin, not the landing — and
//     the browser fixes a jump's destination when the jump begins, so margins
//     written later cannot redirect it (MEASURED 2026-09-29, Chromium 151 and
//     WebKit 26.5: a smooth jump whose target's margin was raised from 40px
//     to 300px 80ms and 250ms into the glide ended with the target's top on
//     136, the line it set out for, every time). A pinned target that RESTS
//     ON ITS STYLESHEET'S LINE was landed by such a jump: its top within two
//     pixels of padding + floor, or below that line with the page at its
//     end, or above it with the page at its start (the jump clamped at scroll
//     0) — and the page more than two pixels from its own landing. The spy
//     finishes that jump with `scrollIntoView({ block: 'start' })`, ONCE PER
//     PIN — a `relanded` flag beside THE START GRACE's three, reset by every
//     select() — and it asks in two places:
//       – start(), once the first evaluation has written the margins and the
//         hash has pinned: the teleport of a visitor who asked for less
//         motion, and any jump that had ended before the island hydrated;
//       – every settle that finds the pin not arrived, before it asks anything
//         else: THE GLIDE. Chromium glides to the fragment at load (THE PIN
//         VERIFIES ARRIVAL records it), the island hydrates mid-glide, start()
//         finds the page still moving and leaves it — and the glide then ends
//         on the stylesheet's line, where for a card shorter than `line −
//         ceiling` the walk names the NEXT card: the URL says one category
//         and the glow sits on its neighbour. The settle catches it, finishes
//         the jump and re-arms, so the finishing scroll's own events — or the
//         next settle — carry on from there.
//     ONCE, because a page carried back onto the stylesheet's line after the
//     spy's own scroll no longer rests where a jump that did not know the plan
//     left it, and a second scroll would only fight whatever carried it there:
//     that pin is judged like any other. It applies to every pin on this line,
//     not only the load-time one — a `hashchange` whose restored position
//     happens to sit on the stylesheet's line is landed too, harmlessly, since
//     it is that fragment's own card. No `behavior`: the stylesheet's
//     `scroll-behavior` chooses a glide or a teleport, so reduced motion is
//     honoured for free. A page RESTORED anywhere off that line — a reload,
//     Back — is left alone; the pin's own check hands its answer to the walk.
//     A click, and a `hashchange` the browser scrolls for, need nothing: the
//     margins are written by then, and the browser's own jump lands on them.
//     start() does NOT finish a fresh navigation's load-time pin while the
//     document still loads (next bullet): a scroll of ours then would stop the
//     browser's own corrections for a late webfont and spend the pin's one
//     finish on a layout about to change — the settle after the load does it.
//   · THE LOAD-TIME JUMP THAT WENT STALE (2026-10-10, the price strip's
//     deep-link defect, `/debug-deep`; BOUNDED after the G2 review the same
//     day): the browser's own jump to a URL's `#fragment` can end where it no
//     longer meant to. MEASURED on the built price page, Chromium, the webfont
//     delayed by `page.route`: a SMOOTH jump is not re-aimed when the webfont
//     reflows the page under it, and leaves the card 4 to 56px off its landing
//     — its top inside the stuck strip's chips — with JavaScript off too (a
//     scripted scroll before the jump did far worse, 180 to 811px;
//     lib/strip-follow's THE BROWSER'S FRAGMENT JUMP GOES FIRST keeps the strip
//     from making one); and a short glide that had already ended was left 20px
//     off by a webfont 1200ms late, in WebKit too. So a pin the URL's own
//     `#fragment` set at start() on a FRESH navigation — a link followed, never
//     a reload's or a Back's restored position: Navigation Timing's own
//     answer, read once at start(), and where it is missing, the narrower rule
//     — is first WAITED for: not judged at all until the document has LOADED
//     (`readyState` 'complete'; a preloaded webfont holds the load event back,
//     and its reflow sends no scroll event), and then finished at the first
//     settle that finds it at rest and not arrived, ONCE PER PIN (the same
//     `relanded`), by the same `scrollIntoView` — never by start(), which runs
//     before the browser's jump, where a scroll of ours would cost the page
//     that jump. BOUNDED, because a page can also move by hands no wheel,
//     touch or key announces — an iPhone's status-bar tap, VoiceOver's
//     three-finger scroll, find in page, a scrollbar drag, a Tab's focus
//     scroll — and pulling such a visitor back is worse than a card a few
//     pixels off (the G2 reviewers MEASURED the unbounded finish pulling a
//     page 5660px back in Chromium and 4410px in WebKit, the focus or the
//     reading cursor left off screen):
//       – the finish needs FOCUS NOT GONE ELSEWHERE, ALWAYS:
//         `document.activeElement` the card, inside it, the body or nothing.
//         A `focusin` outside the card ends the pin's claim for good (a
//         `focusin` listener, the eighth event below);
//       – and EITHER THE PAGE UNMOVED since it last rested within A QUARTER OF
//         A WINDOW of the card's planned landing (STALE_FINISH_REACH; a rest
//         point is recorded at every quiet settle of the load-time wait that
//         finds the card within that reach, never at a settle after the load,
//         and at start() for ANY page — THE HYBRID, the planner's decision of
//         2026-10-10: for a page already AWAY at start, its card then out of
//         reach, that rest skips only the distance bound, never the clear
//         area): then the LAYOUT moved under
//         it, never the visitor, and the finish lands it from ANY distance,
//         the card pushed out of the window included. MEASURED on the built
//         page (2026-10-10): WebKit, which has no scroll anchoring, jumped to
//         the fragment before the webfont arrived, and the reflow left the
//         card 378px off inside the window, or 587, 917 and 1211px off and out
//         of it (3 of 24 loads of a probe), the page never moving again;
//         Chromium's anchoring absorbs most of a reflow, which is why its
//         stale jumps measured only 4 to 56px;
//       – OR, for a page that HAS moved, the card STILL IN THE CLEAR AREA —
//         between the root's `scroll-padding-top` and the window's bottom
//         edge — and within that quarter window of its landing: a card taller
//         than the clear area passes the clear-area test across a scroll as
//         long as itself — four price cards pass 1000px on a phone whose clear
//         area is 690px — so a screen reader reading down one during the load
//         was pulled back 1 to 2 thousand pixels (G2 a11y, 2026-10-10);
//       – during the wait, a page that has STOPPED with the card out of the
//         clear area, after moving, is not waited for: the pin goes and the
//         walk answers — the mark follows what the visitor sees. "Stopped" is
//         TWO quiet settle windows in a row, never one: a long task during
//         the load holds a glide's scroll events back and can fake one (G2
//         typescript, 2026-10-10);
//       – the wait has a CEILING, LOAD_WAIT_CEILING_MS from start(): a request
//         that never completes must not hold the pin for the whole visit, and
//         after it the pin is judged as if the document had loaded.
//     A click's pin, a `hashchange`'s, are never finished this way. ITS LIMITS,
//     recorded: a move the visitor made DURING THE LOAD that comes to rest
//     within reach of the landing — a few pixels of a scrollbar drag during
//     the load-time glide, a short screen-reader scroll — becomes the rest
//     point and is finished like the browser's, pulled back at most a
//     quarter of a window (after the load, such a move is finished only with
//     the card still in the clear area); THE HYBRID'S PRICE AND ITS GAIN: at
//     start() a page whose webfont reflowed BEFORE the island hydrated, or
//     which WebKit never jumped at all (left at the top), looks exactly like
//     one a visitor moved before hydration — and that window exists on EVERY
//     phone load, the HTML readable a second or more before the island
//     hydrates, not only on slow ones — so it is finished only with its card
//     still in view AND the page ABOVE the card's landing: a webfont reflow
//     pushes a card DOWN the page (16 to 36px, and up to 2653px, measured in
//     WebKit), while a reader who scrolled down before hydration sits BELOW
//     it (G2 react, 2026-10-10: without this direction rule such a reader was
//     pulled back 900 and 600px in WebKit, 720 and 285px in Chromium). The
//     start rest point took the WebKit SLOW LOAD e2e from 1 of 4 runs green to
//     4 of 4. Still REFUSED: a pre-hydration reflow that pushed the card OUT
//     of view (1141 and 2653px measured), and any pre-hydration move with the
//     card out of view or the page below its landing. THE RESIDUAL: a reader
//     who scrolled UP before hydration, the card still in view, is pulled
//     down to its landing — at most a clear area; the finish is ONCE per pin,
//     so a layout change after it is not corrected (MEASURED once in 30
//     WebKit loads of a probe, 2026-10-10: `#prosthetics` 41px off after its
//     finish); and `freshLoadPin` is derived afresh at every start(), so in
//     development a Fast Refresh remount with a `#hash` in the URL makes a
//     new "fresh" pin (production mounts the island once, and the bounds above
//     hold either way).
//
// ── THE POSITION WALK is a pure function of the document's scroll state (on
// the landing line; the reading line's walk is its plan's, THE READING LINE,
// and shares with this one only the skipped ids and the TOP FALLBACK): the
// ids, mapped through getElementById (anything missing is skipped — a menu
// may legitimately outlive a card during a hot reload), then
//   · THE BOTTOM RULE first. If the page is scrolled to its very end
//     (`scrollY >= scrollHeight − innerHeight − 1`), the LAST target wins
//     whatever the lines say. Measured in the price-list lane at 1920×1080 on
//     the real price page, while the menu still walked the landing line: the
//     last category card can never reach its own landing line — the document
//     runs out 145px short — so without this rule the final category would be
//     unreachable by scrolling, however far the visitor scrolls. The
//     `maxScrollY > 0` guard is what keeps a page that FITS its viewport
//     (nothing to scroll, so "the end" is also the top) on the top rule below.
//   · otherwise the LAST target in document order that has reached its line —
//     "last", not "first", because every target above the visitor has reached
//     it too and the one nearest the top of the viewport is the one being
//     read.
//   · otherwise THE TOP FALLBACK: the first target. The price band begins at
//     the top of its page, so at scrollY 0 the first card is what the visitor
//     is looking at and the menu should say so — the answer PriceMenu has
//     given there since 2026-09-14, and on THE READING LINE too, which it has
//     passed as its `line` since round 5 (2026-09-29): the plan's −1 above
//     the first card becomes that card.
//
// ── THE PIN — the click's intent, and the half that makes "both ways" safe.
// Without it the two directions fight: a click jumps, the jump scrolls, the
// scroll walks, and the walk overrules the visitor's own choice one frame
// later — worst of all for a target that can never reach its line (the last
// card, a short category at the end of the page), which would flash current
// and then hand the marker back. So `select(id)` PINS that id as current and
// publishes it immediately. The pin then arms a SETTLE TIMER: every scroll
// event while pinned clears and re-arms it, so the timer fires only once the
// jump's own scrolling has stopped, and the scroll position at that moment is
// remembered. The next scroll event that reports a DIFFERENT position is the
// visitor's own hand — the pin is dropped and the walk takes over again —
// unless a resize came first and moved the page by the browser's own choice:
// the resize takes the resting position again (THE RESIZE KEEPS THE PIN).
// While pinned the walk still runs on every scroll and resize, silently: the
// position is kept up to date so that the moment the pin drops there is an
// answer ready, and publishing the pin over it is what `pinned ?? position`
// below says in one line.
// What that buys, in the visitor's words: click any item — reachable or not —
// and it stays marked until you scroll; scroll by hand and the menu follows
// the cards; open a link someone sent you with `#orthodontics` in it and that
// item is marked from the first frame (start() runs the same hash check, and
// so does every back/forward through the `hashchange` listener).
//
// ── THE VISITOR'S OWN INPUT DROPS THE PIN AT ONCE, and this half is not
// optional. A `scroll` event does not say who caused it: the glide a click
// started and a hand on the wheel arrive through the same listener, looking
// identical. So the pin ALSO watches the events only a PERSON can produce —
// `wheel`, `touchmove`, and the keys that scroll a document (the arrows,
// PageUp/PageDown, Home/End, Space). A programmatic smooth scroll emits none of
// them, so any one of them means the visitor has taken over, and the pin is
// dropped in that same event rather than waiting for the settle.
// MEASURED on the built page, which is why this is not a nicety: at 1536×864,
// clicking the LAST category glides for over two seconds (5 800px of smooth
// scrolling). Without this listener a visitor who changes their mind mid-glide
// re-arms the settle with every turn of their own wheel and keeps watching the
// item they abandoned — for the whole gesture, not for a frame.
// What the settle timer still covers is the input this cannot see: a scrollbar
// DRAG produces neither a wheel nor a key. That is why BOTH halves exist, and
// why neither is redundant.
// SIDEWAYS INPUT INSIDE A HORIZONTAL SCROLLER IS NOT PAGE SCROLLING (G2 react,
// 2026-10-09 — verified: tap a chip of the price strip, swipe the strip 120ms
// later, and the marks flashed prophylaxis → emergencies → prophylaxis). A
// consumer names the horizontal scrollers inside its page (the
// `horizontalScrollers` option, element ids looked up at each event): a
// `wheel` over one that is SIDEWAYS — |deltaX| > |deltaY|, or Shift held,
// which every engine turns sideways — scrolls that box and never the page,
// so it leaves the pin alone; so does a touch gesture that STARTS inside one
// and pans anything but CLEARLY vertically — |dx| > VERTICAL_PAN_RATIO |dy|
// since `touchstart` (more than 35° off vertical), decided once, when the
// finger has travelled DECIDE_PX (before that it is no pan at all: a tap, a
// wobble), as the browser decides its own pan's axis after its own slop. NOT
// 45°: MEASURED (the G2 re-review, 2026-10-10), Chromium hands a pan to the
// STRIP from about 37–40° off vertical, and with a 45° split a chip tap's pin
// was dropped by the strip's own pan, the mark walking through five
// categories during the click's glide; iOS Safari's split was not measured.
// The price, recorded: a pan 35–38° off vertical that Chromium gives to the
// page keeps the pin while it moves — until the settle verifies arrival, or
// at once if the pin had already come to rest (any later move drops it). A
// CLEARLY vertical gesture that starts on the strip still scrolls the page,
// and still drops the pin; so does any gesture with a second finger.
//
// ── THE PIN VERIFIES ARRIVAL, AT THE SETTLE (G2 react, Fable, 2026-09-15).
// A pin records an INTENT — a click, a `#id` in the URL — and the two halves
// above assume the browser then carries the page to that target. It does not
// always. Measured on the built page, Chromium and WebKit: a RELOAD with
// `#orthodontics` in the URL restores the previous scroll position instead of
// jumping (y = 1681, Endodonție on screen, Ortodonție marked); a
// full-document Back does the same; a WebKit same-document Back RESTORES the
// position where Chromium re-scrolls to the fragment — and WebKit is every
// iPhone in this clinic's waiting room; and a scroll lock — the contact
// modal, the burger panel — engaging mid-glide freezes the page short of the
// target (y = 2153, Endodonție on screen, Ortodonție marked). In every case no
// further scroll event arrives, the settle fires, and the stale mark would
// stand until the visitor's own hand. So the settle — the one moment the
// scrolling has provably stopped — CHECKS the pin against the page: the target
// has ARRIVED when it sits on its landing line with the walk's own pixel of
// grace, or when it is still below that line while the page has reached its
// end — the browser went as far as it could, which is what the unreachable
// last card, a short category at the end and a page that fits its viewport
// all look like. (On a reading-line spy it has arrived when the page rests
// within two pixels of the target's own landing, which the plan keeps inside
// the page; and a settle that finds it resting on its stylesheet's line
// instead first finishes the jump that put it there — THE READING LINE.) A pin
// whose target has not arrived is dropped, and the walk answers for where the
// page actually is. A completed glide, a
// pasted link (Chromium glides to the fragment at load; the streaming events
// re-arm the settle, so the check runs after landing) and the reduced-motion
// teleport all pass it; every restored position fails it and is corrected
// within two settle windows — THE START GRACE, next, is the second.
// THE START GRACE (owner, 2026-09-29, of the defect the planner found in the
// lane's previous round: "fix them for me"). The settle may judge only a page
// that has STOPPED — and a page whose jump has not yet STARTED looks exactly
// the same to a timer. Measured by the planner on the built page: when the
// main thread is busy for 160ms or more right after a click, the settle timer
// fires BEFORE the jump has produced its first scroll event; the target has
// not arrived, the pin is dropped, and the marks — the link's, and since that
// round the card's glow — walk through every card the glide passes on its
// way. WebKit dropped it 12 times of 12; Chromium, in a scratch harness, 19 of
// 40. So the settle asks two more questions before it hands the answer back,
// and keeps three variables beside `settledY` to ask them with — `checkedY`,
// where the page was the last time the pin looked; `moved`, whether it has
// moved at all since the pin was set; `graceSpent`, whether the one extra
// window has been used — all three reset by every select():
//   · has the page moved since the pin last looked? A jump in flight on a
//     busy thread moves the page before its scroll event is delivered, so a
//     position that differs from `checkedY` re-arms the settle instead of
//     being judged (and every scroll event delivered while the jump glides
//     updates `checkedY` and sets `moved`, as it re-arms);
//   · has it moved at all? A page that has not gets ONE more window, for a
//     jump that has not begun.
// Consequences, each pinned by a test: a glide that stopped short after
// moving is still handed back after ONE window, exactly as before; a page that
// never moved — a restored position, a reload, a WebKit same-document Back —
// after TWO; a second select() renews the grace.
// ITS KNOWN LIMIT, recorded and not built (G2 typescript review, 2026-09-29):
// a scroll event of the visitor's OWN that reaches none of THE VISITOR'S OWN
// INPUT listeners — the tail of a momentum scroll, a scrollbar drag —
// delivered between select() and a long task sets `moved`, and a page that
// has moved gets no grace: when the task then holds the jump back past the
// first settle, that settle drops the pin. The fix would keep the extra
// window until a `hashchange` for the pinned id has been seen.
// TWO BOUNDED CASES, ACCEPTED (same review): (a) `wheel`/`touchmove` over a
// scroll-LOCKED document (an open modal, the burger sheet) and the arrows
// inside a nested scroller (the modal's own, the menu's belt) drop a live pin
// although the page cannot move — measured: every such drop landed on the
// walk's answer, i.e. on what is on screen, so the harm is confined to a
// target the walk can never mark. NAMED TRIGGER, not built: ignore those two
// events while the document is locked — which needs lib/scroll-lock to say so
// (an `isLocked()` it does not have; reading the root's inline `overflow`
// here would couple this module to that one's mechanism). (b) Tab-focusing a
// link low in the sticky menu nudges the page by ~38px (the shell's
// `scroll-padding-bottom` keeping the focused link clear of the corner —
// measured while its steps stood 1rem lower; they rose with the corner on
// 2026-10-09, CLAUDE.md §15.36, so expect a larger nudge, not re-measured) — a
// scroll event no hand made, which drops a settled pin onto the walk's
// answer. Both are viewport-truthful. (The page a RESIZE moves is not one of
// them: THE RESIZE KEEPS THE PIN, next.)
//
// ── THE RESIZE KEEPS THE PIN (the price strip, planner's decision of
// 2026-10-10). A resize may move the page by the BROWSER's choice, with no
// hand anywhere near it. MEASURED: mobile-mode Chromium — Chrome on an Android
// phone or tablet — keeps the node at the window's top-centre in place across
// a rotation; on the price page's 1180×820 touch tablet, once the strip
// stopped painting a ground under that point (sections/PriceList/PriceMenu's
// THE STRIP FLOATS UNDER THE BAR, 2026-10-10), the node there was a card, and
// turning the tablet moved the page 667 → 675px. The settled pin read that
// move's `scroll` as a hand and dropped: a tapped category handed to the walk
// by a turn of the device, against onResize's own word that a resize is never
// a reason to drop the visitor's pin. The browser's `resize` arrives BEFORE
// that `scroll`, with `scrollY` already moved (measured), so onResize takes
// the resting position again, first — `settledY` re-read, for a pin that has
// settled; a pin still gliding has no rest to re-take, and its settle reads
// the page afresh anyway. A real hand still drops the pin: through its wheel,
// touch or scrolling key at once (THE VISITOR'S OWN INPUT), or by moving the
// page past the new rest. What it cannot tell apart, recorded: a scroll of the
// visitor's own that lands between a resize and that resize's own `scroll`
// event — a momentum tail, a scrollbar drag — is taken as part of the
// resize's move, and drops the pin one movement later. `refresh()` takes the
// same path (THE REFRESH), and keeps the same promise.
//
// ── THE LAST PIXELS OF A GLIDE (G2 react, 2026-10-10). A SETTLED pin drops
// only when the page moves more than LANDED_PX (2px) from where it settled.
// MEASURED: WebKit's smooth scroll can end in two steps — 665 → 667 against a
// 666.5 landing — after the settle accepted 665, and its last step read as a
// hand: the mark lost at a rotation 1–2 times in 6 at 1180×820. The comparison
// is against the settled position and that position is never re-taken, so a
// slow scrollbar drag still drops the pin at its third pixel.
//
// ── EVENTS, eight of them on window and — on the reading line only — a
// ResizeObserver on every target; all of them removed by dispose(). Three ask
// "where are we now?": `scroll`, `{ passive: true }` (this listener never
// calls preventDefault, and saying so lets the compositor scroll without
// waiting for it); `resize`, which changes every rect — and the reading
// line's floors, read again then (THE READING LINE) — and therefore the
// answer, and which re-takes a settled pin's resting
// position (THE RESIZE KEEPS THE PIN); `hashchange`, which is how Back,
// Forward and any other link to a `#id` on this page reach us. Four ask "is
// a person doing this?" and exist only to drop the pin: `wheel`, `touchstart`
// and `touchmove` (all passive, same reason; the start only remembers where a
// gesture began) and `keydown`, filtered to the scrolling keys — see THE
// VISITOR'S OWN INPUT. The eighth, `focusin`, asks "has the visitor moved on
// from the card a link brought them to?" — a fresh load-time pin's claim to
// be finished ends at a focus outside it (THE READING LINE's stale load-time
// jump). The observer asks "did a target change size under
// us?" — fonts arriving, a zoom, a row wrapping — because on the reading line
// a target's height decides where it lands; it runs the same evaluation a
// scroll does, and exists on no other line.
// NO requestAnimationFrame THROTTLE, on purpose: the browser already coalesces
// scroll events to at most one per frame, and a walk over a menu-sized list is
// one getComputedStyle for the document plus, per target, one more and one
// getBoundingClientRect — 23 layout reads for eleven categories on the
// landing line (on the reading line one style read for the document and one
// rect per target, its floors cached, then a write only where a margin
// changed), all of them
// against a layout the browser has just finished anyway (the event fires after
// the move). A rAF wrapper would buy nothing at that size and cost a frame of
// latency plus a cancel path to get wrong. The per-target style read is not
// hoisted out of the loop on purpose: `scroll-margin-top` is a CSS value like
// any other and may differ at another breakpoint, so reading it once at
// start() would be wrong the moment the window is resized. (The reading line
// DOES keep it between resizes — it has to, because its own write hides the
// stylesheet's value from getComputedStyle — and answers the same argument by
// reading it again, its write lifted, on every resize.)
//
// ── IT PUBLISHES THROUGH lib/external-store, like the clock and the ring:
// one FLAT snapshot, `sync()` after every change, and the store keeps the old
// object whenever nothing really moved — identity is the signal React's
// useSyncExternalStore compares, and that header explains it once for all four
// stores.
//
// ── THE REFRESH — a resize on the consumer's word (`refresh()`, the price
// strip, owner 2026-10-09). Everything this spy measures against is read on
// every evaluation — the root's `scroll-padding-top` (the reading line's clear
// area, the landing line), the window, the targets — and an evaluation runs on
// every scroll, resize, `hashchange` and target resize. One thing can change
// with none of those to say so: a CONSUMER changing what is measured. The
// price menu's strip changes the root's `scroll-padding-top` — its stylesheet
// sets it to the chips' bottom edge where the strip is shown and sticks
// (sections/PriceList/PriceMenu's THE STRIP'S CLEARANCE, CSS since the G2
// round of 2026-10-09; an inline write by the island before that) — and a
// presentation flip turns that rule on or off with no scroll or resize the
// spy hears, while on the reading line the margins planned before it would
// land every card under the strip until the next scroll. `refresh()` is
// that consumer's way to say "measure again": exactly the resize path — on the
// reading line the margins lifted and every floor read again, then the
// evaluation and its write; on the landing line the walk — and, like a resize,
// never a reason to drop the visitor's pin. Outside start()…dispose() it is a
// no-op, like select(): there are no margins to lift and nothing listening
// to publish to.
//
// ── WHAT IS DELIBERATELY NOT BUILT (each with the reason, so the absence
// reads as a decision rather than an oversight):
//   · The `scrollend` EVENT, which would replace the settle timer with the
//     platform's own "scrolling has stopped". Every Safari before 26 lacks it
//     — that is every frozen iPhone in this clinic's waiting room — so the
//     timer has to exist anyway, and shipping both means two code paths for
//     one job plus a feature test to keep honest.
//   · SCROLLING THE CURRENT LINK INTO VIEW inside a menu that has its own
//     `overflow-y` belt. Nobody has asked, it moves content under the
//     visitor's pointer, and it needs the menu's element — which this module
//     deliberately does not know about.
//   · A `setIds()` FOR A CHANGING LIST. Page data on this site is static: the
//     categories are compiled into the HTML at build time (§16). A ring's
//     `setCount` exists because a deck can be handed a new list; a table of
//     contents cannot. The day one can, this is where it joins.
//   · TWO READING-LINE SPIES ON THE SAME TARGETS. Each would read the other's
//     inline write as its floor — a floor is read with THIS spy's own write
//     lifted, never another's — and plan from it: one reading line per set of
//     targets. NAMED TRIGGER: a second consumer that wants to watch targets a
//     reading-line spy already owns.
//   · TARGETS THAT ARRIVE AFTER start() ARE MEASURED BUT NOT OBSERVED. Every
//     evaluation maps the ids afresh, so a late target is planned and its
//     margin written like any other; but the ResizeObserver was attached at
//     start(), to the targets present then, so a late target's own change of
//     size reaches the plan only with the next scroll or resize. NAMED
//     TRIGGER: a consumer whose list can change — the same day `setIds()`
//     fires.
//
// ── REDUCED MOTION: nothing here animates, so there is nothing to switch off
// (§9). The gliding a jump does is the shell's own `scroll-behavior: smooth`,
// declared inside a `prefers-reduced-motion: no-preference` block in
// globals.css, so a visitor who asked for less motion simply teleports — and
// so does the one scroll this module makes itself (THE READING LINE's
// load-time jump), which passes no `behavior` for exactly that reason. The
// PIN is what survives either way: with a glide it holds through a few hundred
// milliseconds of scroll events, with a teleport through the single one.
//
// WHY THE IMPORTS ABOVE SAY `.ts`: the ring's plain-Node promise — see
// lib/clock/clock.ts's "WHY THE IMPORTS ABOVE SAY `.ts`" paragraph, which
// argues it once for every relative value import inside lib/.

/** What the spy knows: the id of the target the visitor is at, or none yet. */
export type ScrollSpySnapshot = Readonly<{ current: string | null }>;

/**
 * The default quiet time that ends a jump, in milliseconds.
 *
 * 150ms sits between the two things it has to tell apart: a smooth jump
 * streams events every ~16ms until it lands, so any gap that long means the
 * glide is over, while a human hand cannot start a new gesture and be measured
 * inside it. It is a courtesy window, not a rhythm — nothing moves while it
 * runs. A pin whose page has not moved at all when it ends gets one window
 * more (the header's THE START GRACE).
 */
export const DEFAULT_SETTLE_MS = 150;

/**
 * THE LOAD-TIME WAIT'S CEILING, in milliseconds from start(): how long a
 * fresh navigation's load-time pin waits for the document to load before it
 * is judged as if it had (the header's THE READING LINE, its stale load-time
 * jump). A request that never completes must not hold the pin for the whole
 * visit. Ten seconds: far past every load measured on the price page — the
 * slowest probe held its webfont back three and a half — and short of a
 * visitor's patience. KEEP-IN-SYNC with lib/strip-follow's GATE_CEILING_MS,
 * the same wait on the strip's side.
 */
export const LOAD_WAIT_CEILING_MS = 10_000;

export type ScrollSpyOptions = Readonly<{
  /**
   * Fragment ids of the targets, in DOCUMENT order — i.e. the menu's own
   * order. Non-empty strings, unique; the walk trusts the order and the
   * pin trusts the membership.
   */
  ids: readonly string[];
  /**
   * Quiet time after the last scroll event that ends a jump, in milliseconds.
   * Finite, at least 1 and at most 2_147_483_647 (setTimeout's own ceiling —
   * lib/clock argues that bound in full). @default DEFAULT_SETTLE_MS
   */
  settleMs?: number;
  /**
   * The ONE line every rule of this spy measures against (the header's
   * LANDING LINE and READING LINE): 'landing' — where a fragment jump comes
   * to rest, `rect.top − scroll-margin-top ≤ scroll-padding-top`: the
   * DEFAULT, which since round 5 (2026-09-29) no consumer in the repo walks —
   * the price menu walked it from 2026-09-14 until it moved to 'reading';
   * 'reading' — the middle of the CLEAR area, bent near both ends of the
   * page, with every target's landing planned to match and WRITTEN as its
   * `scroll-margin-top` (lib/reading-line; the price menu's line since round
   * 5, 2026-09-29). The walk, the top fallback (the first target, while none
   * has reached the line) and the pin's arrival check all use it; the bottom
   * rule belongs to the landing line. @default 'landing'
   */
  line?: ScrollSpyLine;
  /**
   * Element ids of the HORIZONTAL SCROLLERS inside the page (the header's
   * SIDEWAYS INPUT INSIDE A HORIZONTAL SCROLLER): a sideways wheel over one,
   * or a touch gesture that starts in one and pans sideways, scrolls that box
   * and never the page, so it never drops a pin. Looked up at each event — a
   * scroller may mount after start(). Non-blank strings. @default []
   */
  horizontalScrollers?: readonly string[];
}>;

/** The two lines a spy can measure against (ScrollSpyOptions' `line`). */
export type ScrollSpyLine = 'landing' | 'reading';

/**
 * The spy's public surface: React's external-store protocol — exactly the trio
 * useSyncExternalStore takes, so no custom hook is needed and no React enters
 * the ring (lib/external-store) — plus a lifecycle and the click's intent.
 */
export type ScrollSpy = ExternalStore<ScrollSpySnapshot> &
  Readonly<{
    /** First browser touch: attach the listeners, read the page and the URL's
     *  own `#id` — and on the reading line write the targets' margins and
     *  finish a load-time jump (the header's THE READING LINE). Idempotent
     *  while started. */
    start(): void;
    /** Detach everything and forget the pin — and on the reading line take
     *  the margins off again; re-entrant, and start() works again afterwards
     *  (React re-runs an island's effect — Fast Refresh, a late client-only
     *  mount). */
    dispose(): void;
    /** The click's intent: pin `id` as current until the visitor scrolls after
     *  the jump has settled. An unknown id is ignored, and so is any call
     *  outside the start()…dispose() window — a no-op, never a throw. */
    select(id: string): void;
    /** Re-plan NOW, as a resize would (the header's REFRESH): on the reading
     *  line lift this spy's margins, read every floor again and write the new
     *  plan; on every line recompute the answer — for a consumer that has just
     *  changed what the spy measures against without a resize to say so (the
     *  price strip's stylesheet turning the root's `scroll-padding-top` on or
     *  off at a presentation flip). Never drops a pin. A no-op
     *  outside the start()…dispose() window. */
    refresh(): void;
  }>;

/** setTimeout's ceiling: 2^31 − 1 ms. Above it — as for anything non-finite —
 *  the WebIDL `long` coercion every engine applies silently yields 0 (the
 *  argument in full: lib/clock/clock.ts, MAX_DELAY_MS). */
const MAX_DELAY_MS = 2_147_483_647;

/** A delay this module is willing to arm. `>= 1`, never merely "positive":
 *  0.5 is positive and truncates to the 0 ms timer the bound exists to stop. */
function isUsableDelay(delayMs: number): boolean {
  return Number.isFinite(delayMs) && delayMs >= 1 && delayMs <= MAX_DELAY_MS;
}

/** How far a finger must travel before a gesture that began inside a
 *  horizontal scroller is judged sideways or not (the header's SIDEWAYS INPUT
 *  INSIDE A HORIZONTAL SCROLLER) — under it, no pan has begun: a tap, a
 *  wobble. CSS pixels. Judged ONCE: a gesture that turns afterwards keeps the
 *  axis it was first judged on, as the browser's own pan keeps its axis.
 *  KEEP-IN-SYNC with lib/strip-follow's DECIDE_PX, which judges the same
 *  finger for the strip's hand (strip-follow.test pins the two equal). */
export const DECIDE_PX = 10;

/** THE CLEARLY VERTICAL PAN (the header's SIDEWAYS INPUT INSIDE A HORIZONTAL
 *  SCROLLER): a touch gesture that began inside a horizontal scroller is the
 *  PAGE's — and drops the pin — only when its sideways travel is at most this
 *  share of its vertical travel, within 35° of vertical (tan 35° ≈ 0.700);
 *  anything flatter is treated as the scroller's own pan. KEEP-IN-SYNC with
 *  lib/strip-follow's VERTICAL_PAN_RATIO, which judges the same finger for
 *  the strip's hand (strip-follow.test pins the two equal). */
export const VERTICAL_PAN_RATIO = 0.7;

/** THE STALE FINISH'S REACH, as a share of the window's height (THE READING
 *  LINE's stale load-time jump): a page that has MOVED is finished only with
 *  its card in the clear area within a quarter of a window of the planned
 *  landing — a page moved further has been moved by the visitor (a screen
 *  reader reading down a card taller than the clear area, which the clear
 *  area alone lets through). A page UNMOVED since it last rested within this
 *  reach is finished from any distance: only the layout moved under it. */
export const STALE_FINISH_REACH = 0.25;

/**
 * The keys that scroll a document, and therefore the only keys that mean "the
 * visitor is moving the page themselves". Everything else — Tab, Enter, a
 * modifier, a letter — must leave a pin alone: Enter in particular is how a
 * keyboard visitor ACTIVATES a menu link, i.e. how a pin is born.
 */
const SCROLL_KEYS: ReadonlySet<string> = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

/**
 * Was this document reached by a FRESH navigation — a link followed, a URL
 * typed — rather than a reload or a Back/Forward that restores where the
 * visitor was (the header's THE READING LINE, its stale load-time jump)?
 * Navigation Timing's own answer; false wherever it is missing, which keeps
 * the older, narrower rule.
 */
function isFreshNavigation(): boolean {
  if (
    typeof performance === 'undefined' ||
    typeof performance.getEntriesByType !== 'function'
  ) {
    return false;
  }
  const [entry] = performance.getEntriesByType('navigation');
  return entry !== undefined && 'type' in entry && entry.type === 'navigate';
}

/** A computed CSS length in pixels; anything unreadable ('auto', '', a
 *  keyword) is 0 — the same answer the browser's own scrolling gives it. */
function cssPixels(value: string): number {
  const pixels = parseFloat(value);
  return Number.isNaN(pixels) ? 0 : pixels;
}

/**
 * How close the page must rest to a reading-line target's landing for it to
 * have ARRIVED there — and how close the browser's load-time jump must have
 * put it to the stylesheet's line for start() to finish that jump (THE READING
 * LINE). Two pixels, not the walk's one: a jump ROUNDS its landing — the
 * margin this spy writes carries two decimals, and the browser rests on a
 * whole pixel (measured in the test browser, 2026-09-29: a planned 780.55
 * landed at 781).
 */
const LANDED_PX = 2;

/** The one CSS property this module ever writes (THE READING LINE). */
const MARGIN_PROPERTY = 'scroll-margin-top';

/** One reading-line evaluation's reads: the targets on the page, the frame
 *  lib/reading-line was handed, its plan, and the scroll position they were
 *  all read at (THE READING LINE). */
type ReadingMeasure = Readonly<{
  targets: readonly HTMLElement[];
  frame: ReadingFrame;
  plan: ReadingPlan;
  scrollY: number;
}>;

/**
 * Build a spy. Touches nothing until start().
 *
 * @param options the fragment ids in document order, and (optionally) the
 * settle window, the line and the horizontal scrollers.
 * @throws when `ids` is empty, holds a blank id or repeats one — each of those
 * is a menu that cannot work, and it has to die at the call site rather than
 * mark the wrong item forever — when `settleMs` is not a finite number of
 * milliseconds inside setTimeout's own range, and when `line` is neither
 * 'landing' nor 'reading' (any other word — a plain-JS caller's, or the
 * retired 'middle' — would otherwise fall silently to one of the two).
 */
export function createScrollSpy(options: ScrollSpyOptions): ScrollSpy {
  const {
    ids,
    settleMs = DEFAULT_SETTLE_MS,
    line = 'landing',
    horizontalScrollers = [],
  } = options;

  if (ids.length === 0) {
    throw new RangeError(
      'createScrollSpy: ids must name at least one target (received an empty list). A navigation with nothing to point at has no current item to report.',
    );
  }
  /** Membership for select() and the hash check — built while validating, so
   *  the duplicate scan and the lookup table are the same pass. */
  const known = new Set<string>();
  for (const id of ids) {
    if (id.trim() === '') {
      throw new RangeError(
        'createScrollSpy: every id must be a non-blank fragment id (received an empty one).',
      );
    }
    if (known.has(id)) {
      throw new RangeError(
        `createScrollSpy: ids must be unique (received "${id}" twice). Two elements sharing a fragment id is already a document-level defect — getElementById answers with the first.`,
      );
    }
    known.add(id);
  }
  if (!isUsableDelay(settleMs)) {
    throw new RangeError(
      `createScrollSpy: settleMs must be a finite number of milliseconds, at least 1 and at most ${MAX_DELAY_MS} (received ${String(settleMs)}). Omit it to inherit DEFAULT_SETTLE_MS.`,
    );
  }
  if (line !== 'landing' && line !== 'reading') {
    throw new RangeError(
      `createScrollSpy: line must be 'landing' or 'reading' (received ${String(line)}). Omit it to inherit 'landing'.`,
    );
  }
  const scrollers = new Set<string>();
  for (const id of horizontalScrollers) {
    if (id.trim() === '') {
      throw new RangeError(
        `createScrollSpy: every horizontalScrollers id must be a non-blank element id (received ${id === '' ? 'an empty' : 'a blank'} one). A scroller that cannot be found would let its own sideways scrolling drop the pin, silently.`,
      );
    }
    if (scrollers.has(id)) {
      throw new RangeError(
        `createScrollSpy: horizontalScrollers ids must be unique (received "${id}" twice), like \`ids\` — a repeated id is a mistake at the call site, never a second scroller.`,
      );
    }
    scrollers.add(id);
  }

  /** The visitor's click, until they scroll again (THE PIN above). */
  let pinned: string | null = null;
  /** What the walk last answered. Null until start() has looked. */
  let position: string | null = null;
  /** Where the page came to rest after a pinned jump; null while it still
   *  moves — which is exactly "the settle has not happened yet". */
  let settledY: number | null = null;
  // THE START GRACE's three (the header), each set afresh by every select():
  /** Where the page was the last time the pin looked — at select(), at every
   *  scroll event while the jump glides, at every settle that re-armed. */
  let checkedY = 0;
  /** Has the page moved at all since the pin was set? */
  let moved = false;
  /** Has the pin's one extra settle window been used? */
  let graceSpent = false;
  /** During the load-time wait: has ONE settle already found the page stopped
   *  with the card out of the clear area? A stop needs two in a row. */
  let stillOnce = false;
  /** Where the page last RESTED with the load-time pin's card within reach of
   *  its landing (STALE_FINISH_REACH) — at start() and at every quiet settle
   *  of the load-time wait that finds it so; null while it never has. A page
   *  still there has not moved since: only the layout has (THE READING LINE's
   *  stale load-time jump, UNMOVED). Never at a settle after the load: there a
   *  rest within reach would make every such page UNMOVED on the spot, and
   *  the clear area could never refuse a small move that hid the card. */
  let restY: number | null = null;
  /** Was that rest point the one start() records for a page already AWAY —
   *  its card then out of reach? Such a rest skips only the distance bound:
   *  the card must still show in the clear area (THE HYBRID, in the header). */
  let restFromStart = false;
  /** Has the spy finished THIS pin's jump — the one scroll this module makes,
   *  once per pin (THE READING LINE)? Reset by every select(), too. */
  let relanded = false;
  /** Is the pin the one a FRESH NAVIGATION's `#fragment` set at start() — a
   *  link followed, never a reload's or a Back's restored position (THE
   *  READING LINE's stale load-time jump)? Cleared by every select(). */
  let freshLoadPin = false;
  /** Has the load-time wait reached its ceiling (LOAD_WAIT_CEILING_MS)? */
  let loadWaitOver = false;
  /** The ceiling's timer, armed by start() for a fresh load-time pin. */
  let ceilingTimer: ReturnType<typeof setTimeout> | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let started = false;

  // THE READING LINE's own state (the header); the landing line never
  // touches it.
  /** Each target's FLOOR — its stylesheet `scroll-margin-top` — read while
   *  this spy had nothing written on it, and kept until the next resize. */
  const floors = new Map<HTMLElement, number>();
  /** What this spy last wrote on each target: the ONE write. */
  const written = new Map<HTMLElement, string>();
  /** The observer on every target, between start() and dispose(). */
  let observer: ResizeObserver | undefined;

  /**
   * THE STORE. Its builder runs once, right here, so the construction snapshot
   * — nothing current — is both the first getSnapshot() and the frozen
   * getServerSnapshot(). The pin outranks the walk in this one expression,
   * which is the whole precedence rule of the module.
   */
  const store = createExternalStore<ScrollSpySnapshot>(() => ({
    current: pinned ?? position,
  }));

  /**
   * THE LINE, in viewport pixels (the header's LANDING LINE): the document's
   * `scroll-padding-top`. One value for every target, so the walk reads it
   * once, not once per target.
   */
  function lineY(): number {
    return cssPixels(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    );
  }

  /**
   * The y of the edge that meets the line: the target's top less its own
   * `scroll-margin-top` (the air a jump leaves above it). With lineY() this
   * is the landing line's ONE definition of "reached" — `edgeY(target) <=
   * lineY() + 1` in the walk, the same difference within a pixel in
   * arrived().
   */
  function edgeY(target: Element): number {
    const top = target.getBoundingClientRect().top;
    return top - cssPixels(getComputedStyle(target).scrollMarginTop);
  }

  /** The targets on the page, in the ids' order — an id with no element is
   *  skipped (the header's POSITION WALK: a menu may outlive a card). */
  function presentTargets(): HTMLElement[] {
    return ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
  }

  /** THE POSITION WALK (see the header): a pure read of the document. */
  function walk(): string | null {
    const targets = presentTargets();
    if (targets.length === 0) return null;

    const root = document.documentElement;
    const maxScrollY = root.scrollHeight - window.innerHeight;
    // THE BOTTOM RULE: the end of the page means the last target, whatever
    // the lines say — the last card is routinely unreachable (header).
    if (maxScrollY > 0 && window.scrollY >= maxScrollY - 1) {
      return targets[targets.length - 1].id;
    }

    const y = lineY();
    // THE TOP FALLBACK — the first target (the header) — overwritten by every
    // target that has reached THE line, so what remains is the LAST one that
    // has.
    let current = targets[0].id;
    for (const target of targets) {
      if (edgeY(target) <= y + 1) current = target.id;
    }
    return current;
  }

  // ── THE READING LINE (the header), in four small steps — a floor, a
  // measurement, the one write, and the walk that uses them.

  /**
   * A target's FLOOR: its stylesheet `scroll-margin-top`, read the first time
   * it is asked for and kept until liftWrites() forgets it — never over this
   * spy's own write, because liftWrites() takes the write off in the same
   * breath as it forgets the floor. Asked for by start()'s first evaluation and
   * by the first after every resize, so never on a scroll event; the one
   * exception is a target start() did not see (a hot reload's new card), read
   * once, the first time it is measured.
   */
  function floorOf(element: HTMLElement): number {
    const cached = floors.get(element);
    if (cached !== undefined) return cached;
    const floor = cssPixels(getComputedStyle(element).scrollMarginTop);
    floors.set(element, floor);
    return floor;
  }

  /**
   * The measurement: every read one evaluation needs and nothing written —
   * the document's scroll padding, the window, where the document ends, and
   * each target's document top, height and floor — handed to lib/reading-line
   * as a frame and planned. Null for a window with no height (a collapsed
   * frame), which has no clear area to find a middle in and which
   * planReadingLine refuses: the evaluation then leaves everything as it was
   * rather than throw from inside a scroll listener.
   */
  function measureReading(
    targets: readonly HTMLElement[],
  ): ReadingMeasure | null {
    const viewport = window.innerHeight;
    if (!(viewport > 0)) return null;
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const frame: ReadingFrame = {
      viewport,
      maxScrollY: root.scrollHeight - viewport,
      padding: cssPixels(getComputedStyle(root).scrollPaddingTop),
      targets: targets.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top + scrollY,
          height: rect.height,
          floor: floorOf(element),
        };
      }),
    };
    return { targets, frame, plan: planReadingLine(frame), scrollY };
  }

  /**
   * THE ONE WRITE: each target's planned margin as its inline
   * `scroll-margin-top`, to two decimals, and only where it differs from what
   * this spy last wrote there — so a scroll, which moves no landing, writes
   * nothing at all. Always after every read of its evaluation.
   */
  function writeMargins(measure: ReadingMeasure): void {
    measure.targets.forEach((element, index) => {
      const value = `${Math.round(measure.plan.margins[index] * 100) / 100}px`;
      if (written.get(element) === value) return;
      element.style.setProperty(MARGIN_PROPERTY, value);
      written.set(element, value);
    });
  }

  /**
   * Take the one write off every target it was made on — the stylesheet's own
   * value returns — and forget every floor, so the next read of one sees the
   * stylesheet (on a resize, and in dispose()). Both in one place is what keeps
   * floorOf() honest: a floor is never missing while this spy's write is
   * still on its target.
   */
  function liftWrites(): void {
    for (const element of written.keys()) {
      element.style.removeProperty(MARGIN_PROPERTY);
    }
    written.clear();
    floors.clear();
  }

  /**
   * The reading line's walk: measure, plan, write, then answer with the plan's
   * index — the TOP FALLBACK, the first target, for its −1, and no BOTTOM
   * RULE (the plan keeps the last landing inside the page).
   */
  function evaluateReading(): string | null {
    const targets = presentTargets();
    if (targets.length === 0) return null;
    const measure = measureReading(targets);
    if (measure === null) return position;
    writeMargins(measure);
    const index = readingIndex(measure.frame, measure.plan, measure.scrollY);
    if (index !== -1) return targets[index].id;
    return targets[0].id;
  }

  /** On the reading line a pinned target has ARRIVED when the page rests
   *  within LANDED_PX of its planned landing, measured afresh. */
  function readingArrived(target: HTMLElement): boolean {
    return distanceFromLanding(target) <= LANDED_PX;
  }

  /** How far the page rests from `target`'s planned landing, in CSS pixels,
   *  measured afresh — Infinity for a target the plan does not hold. */
  function distanceFromLanding(target: HTMLElement): number {
    const landing = plannedLandingOf(target);
    return landing === null
      ? Number.POSITIVE_INFINITY
      : Math.abs(window.scrollY - landing);
  }

  /** The scroll position where `target` lands, as planned afresh — null for a
   *  target the plan does not hold. */
  function plannedLandingOf(target: HTMLElement): number | null {
    const targets = presentTargets();
    const index = targets.indexOf(target);
    const measure = index === -1 ? null : measureReading(targets);
    return measure === null ? null : measure.plan.landings[index];
  }

  /**
   * Does the page rest where a jump that did NOT know the plan put `target` —
   * on its STYLESHEET's line (the header's THE ONE SCROLL THIS MODULE MAKES)?
   * Its top within LANDED_PX of padding + floor; or below that line with the
   * page at its end, or above it with the page at its start — the jump went
   * as far as the page would let it; and, either way, the page more than
   * LANDED_PX from the target's own landing, because closer than that it has
   * simply arrived.
   */
  function restsWhereTheStylesheetPutIt(
    target: HTMLElement,
    measure: ReadingMeasure,
  ): boolean {
    const index = measure.targets.indexOf(target);
    if (index === -1) return false;
    const { frame, plan, scrollY } = measure;
    const top = frame.targets[index].top - scrollY;
    const stylesheetLine = frame.padding + frame.targets[index].floor;
    const onIt =
      Math.abs(top - stylesheetLine) <= LANDED_PX ||
      (top > stylesheetLine && scrollY >= frame.maxScrollY - 1) ||
      (top < stylesheetLine && scrollY <= 1);
    return onIt && Math.abs(scrollY - plan.landings[index]) > LANDED_PX;
  }

  /**
   * THE ONE SCROLL THIS MODULE MAKES (the header's THE READING LINE): on the
   * reading line, a pinned target resting where a jump that did not know the
   * plan put it is landed where the plan says — once per pin. Asked by
   * start() and by every settle that finds the pin not arrived.
   *
   * @returns whether it scrolled.
   */
  function finishTheJump(): boolean {
    if (line !== 'reading' || pinned === null || relanded) return false;
    const target = document.getElementById(pinned);
    if (target === null) return false;
    const measure = measureReading(presentTargets());
    if (measure === null || !restsWhereTheStylesheetPutIt(target, measure)) {
      return false;
    }
    relanded = true;
    target.scrollIntoView({ block: 'start' });
    return true;
  }

  /** The load-time wait is over, whatever ended it — the pin judged, gone, or
   *  no longer the URL's: its ceiling's timer is not left behind. */
  function endLoadWait(): void {
    if (ceilingTimer === undefined) return;
    clearTimeout(ceilingTimer);
    ceilingTimer = undefined;
  }

  /** Has the document loaded — or the load-time wait reached its ceiling
   *  (LOAD_WAIT_CEILING_MS), after which it is judged as if it had? */
  function loadedOrGivenUp(): boolean {
    return loadWaitOver || document.readyState === 'complete';
  }

  /** Does `target` still show in the window's CLEAR area — between the
   *  root's `scroll-padding-top` and the window's bottom edge? The test of a
   *  visitor who has not moved on (THE READING LINE's stale load-time jump). */
  function inClearArea(target: HTMLElement): boolean {
    const rect = target.getBoundingClientRect();
    const padding = cssPixels(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    );
    return rect.bottom > padding && rect.top < window.innerHeight;
  }

  /** Has focus stayed with the visitor's link — on the card, inside it, or
   *  nowhere (the body)? */
  function focusStayed(target: HTMLElement): boolean {
    const active = document.activeElement;
    return (
      active === null || active === document.body || target.contains(active)
    );
  }

  /**
   * THE LOAD-TIME JUMP THAT WENT STALE (the header's THE READING LINE): a
   * fresh navigation's load-time pin that came to rest OFF its landing — the
   * browser's own jump overtaken by a layout that changed under it — is landed
   * where the plan says, once per pin (the same `relanded`). Asked by the
   * settle alone, once the page has stopped and the document has loaded (the
   * settle waits for that before it judges such a pin at all, up to
   * LOAD_WAIT_CEILING_MS), and never by start(): a scroll of ours before the
   * browser's own jump would cost the page that jump. BOUNDED: focus on the
   * card or nowhere, always; and either a page UNMOVED since it last rested
   * within a quarter of a window of the landing (from any distance), or the
   * card in the clear area within that quarter window (STALE_FINISH_REACH) —
   * a visitor who has moved on is never pulled back.
   *
   * @returns whether it scrolled — and the settle must look again.
   */
  function finishStaleLoadJump(): boolean {
    if (line !== 'reading' || pinned === null || relanded || !freshLoadPin) {
      return false;
    }
    const target = document.getElementById(pinned);
    // BOUNDED, FOCUS FIRST, ALWAYS: never a card whose visitor's focus has
    // gone elsewhere — a Tab, a screen reader's cursor.
    if (target === null || !focusStayed(target)) return false;
    // …and EITHER the page has NOT MOVED since it last rested within a
    // quarter of a window of the landing — the LAYOUT moved under it, never
    // the visitor, so the finish lands it from any distance, the card pushed
    // out of the window included (UNMOVED: WebKit, no scroll anchoring) — OR
    // the card still shows in the clear area within that quarter window (a
    // moved page: Chromium's anchored residuals; a reader further down a tall
    // card is refused).
    // THE HYBRID: a rest point start() took for a page already AWAY counts
    // only with the card in view AND the page ABOVE its landing — a webfont
    // reflow pushes a card DOWN the page, while a reader who scrolled before
    // the island hydrated sits BELOW it (the header's THE HYBRID).
    const landing = restFromStart ? plannedLandingOf(target) : null;
    const unmoved =
      restY !== null &&
      Math.abs(window.scrollY - restY) <= LANDED_PX &&
      (!restFromStart ||
        (inClearArea(target) && landing !== null && window.scrollY < landing));
    if (
      !unmoved &&
      !(
        inClearArea(target) &&
        distanceFromLanding(target) <= STALE_FINISH_REACH * window.innerHeight
      )
    ) {
      return false;
    }
    relanded = true;
    target.scrollIntoView({ block: 'start' });
    return true;
  }

  /** The page is at rest: remember where, if the load-time pin's card lies
   *  within reach of its landing (the stale finish's UNMOVED rule). */
  function noteRest(): void {
    if (!freshLoadPin || pinned === null) return;
    const target = document.getElementById(pinned);
    if (
      target !== null &&
      distanceFromLanding(target) <= STALE_FINISH_REACH * window.innerHeight
    ) {
      restY = window.scrollY;
      restFromStart = false;
    }
  }

  /** A target that changes size re-measures: the same evaluation a scroll
   *  runs, for as long as the spy is started. */
  function observeTargets(): void {
    observer = new ResizeObserver(() => {
      if (started) recompute();
    });
    for (const element of presentTargets()) observer.observe(element);
  }

  function recompute(): void {
    position = line === 'reading' ? evaluateReading() : walk();
    store.sync();
  }

  function clearSettle(): void {
    if (settleTimer === undefined) return;
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }

  /**
   * Has the pinned target come to rest ON THE LINE (THE PIN VERIFIES ARRIVAL,
   * in the header)? On it, with the walk's own pixel of grace — or still below
   * it while the page has reached its end, i.e. the browser went as far as it
   * could. The SAME line the walk measures against: the landing line — on a
   * reading-line spy, the target's own planned landing (readingArrived). A
   * target that has left the page has not arrived.
   */
  function arrived(id: string): boolean {
    const target = document.getElementById(id);
    if (target === null) return false;
    if (line === 'reading') return readingArrived(target);
    const offset = edgeY(target) - lineY();
    if (Math.abs(offset) <= 1) return true;
    const root = document.documentElement;
    const maxScrollY = root.scrollHeight - window.innerHeight;
    return offset > 0 && window.scrollY >= maxScrollY - 1;
  }

  /** (Re-)start the quiet window. Called by select(), by every scroll event
   *  that arrives while the jump is still gliding, and by a settle that finds
   *  the page not yet at rest (THE START GRACE). When it fires, judge()
   *  looks. */
  function armSettle(): void {
    clearSettle();
    settledY = null;
    settleTimer = setTimeout(judge, settleMs);
  }

  /**
   * THE SETTLE: the quiet window has ended — the one moment the pin can be
   * checked against the page (THE PIN VERIFIES ARRIVAL, THE START GRACE, THE
   * READING LINE's one scroll).
   *   0. A fresh navigation's load-time pin while the document still loads
   *      (and its ceiling has not passed): not judged yet — look again after
   *      another window; but a page that has stopped AWAY from the card, out
   *      of the clear area, after moving — still on two windows in a row —
   *      drops the pin and the walk answers.
   *   1. Arrived: the pin holds, and the position it rests at is remembered.
   *   2. On the reading line, resting where a jump that did not know the plan
   *      put the target — its stylesheet's line: the spy finishes that jump,
   *      once per pin, and looks again after another window.
   *   3. Not arrived, but the page is not where the pin last saw it: a jump in
   *      flight on a busy thread, whose scroll events have not been delivered
   *      yet. Moved, then — look again after another window.
   *   4. Not arrived and never moved: one more window, once, for a jump that
   *      has not begun.
   *   5. On the reading line, a FRESH navigation's load-time pin at rest off
   *      its landing — the browser's own jump gone stale — whose card still
   *      holds focus (or nothing does), and whose page either has not moved
   *      since it last rested within a quarter of a window of the landing
   *      (UNMOVED) or shows the card in the clear area within that quarter
   *      window: the spy finishes it,
   *      once per pin (THE READING LINE's stale load-time jump).
   *   6. Otherwise the page has stopped short of the target: the walk answers.
   */
  function judge(): void {
    settleTimer = undefined;
    // Never null here — unpin() clears the timer — but it narrows the type.
    if (pinned === null) return;
    // A fresh navigation's load-time pin is not judged while the document
    // still loads: a webfont still to come reflows the page under it, and no
    // scroll event would follow to say so (THE READING LINE's stale
    // load-time jump). The settle simply looks again.
    if (freshLoadPin && !relanded && !loadedOrGivenUp()) {
      // …unless the page has stopped AWAY from the card — the visitor's own
      // move, or a screen reader's: then there is nothing to wait for, and
      // the walk answers. A page still moving is a jump in flight.
      const y = window.scrollY;
      if (y !== checkedY) {
        moved = true;
        checkedY = y;
        stillOnce = false;
        armSettle();
        return;
      }
      noteRest();
      const target = document.getElementById(pinned);
      // …but never a page still where it last rested within reach of the
      // landing: only the layout moved, and the UNMOVED finish lands it after
      // the load (G2 typescript, 2026-10-10).
      const atItsRest =
        restY !== null && !restFromStart && Math.abs(y - restY) <= LANDED_PX;
      if (moved && !atItsRest && (target === null || !inClearArea(target))) {
        // STOPPED, on TWO quiet windows in a row, never one: a long task
        // during the load holds a glide's scroll events back and can fake one
        // (G2 typescript, 2026-10-10).
        if (!stillOnce) {
          stillOnce = true;
          armSettle();
          return;
        }
        unpin();
        recompute();
        return;
      }
      stillOnce = false;
      armSettle();
      return;
    }
    endLoadWait();
    if (arrived(pinned)) {
      settledY = window.scrollY;
      return;
    }
    // The finishing scroll's own events — or the next settle — carry on.
    if (finishTheJump()) {
      armSettle();
      return;
    }
    const y = window.scrollY;
    if (y !== checkedY) {
      moved = true;
      checkedY = y;
      armSettle();
      return;
    }
    if (!moved && !graceSpent) {
      graceSpent = true;
      armSettle();
      return;
    }
    // At rest, loaded and not arrived: a fresh navigation's load-time jump
    // that went stale is finished, once per pin.
    if (finishStaleLoadJump()) {
      armSettle();
      return;
    }
    unpin();
    recompute();
  }

  function unpin(): void {
    clearSettle();
    endLoadWait();
    pinned = null;
    settledY = null;
  }

  function onScroll(): void {
    if (pinned !== null) {
      if (settledY === null) {
        // Still gliding: this event belongs to the jump, not to the visitor —
        // and it is the proof the page has moved (THE START GRACE).
        moved = true;
        checkedY = window.scrollY;
        stillOnce = false;
        armSettle();
      } else if (Math.abs(window.scrollY - settledY) > LANDED_PX) {
        // The page has moved since it came to rest — a hand, a wheel, a key —
        // by more than LANDED_PX from the SETTLED position, never re-taken
        // (THE LAST PIXELS OF A GLIDE, in the header).
        unpin();
      }
      // else: a scroll event that moved nothing, or a glide's last pixel or
      // two (a bounce at the end of the page, a programmatic scrollTo to where
      // we already are, WebKit ending its smooth scroll in two steps). Keep it.
    }
    recompute();
  }

  /**
   * A gesture only a person can make (see THE VISITOR'S OWN INPUT): drop the
   * pin now, without waiting for the settle to decide whose scrolling this is.
   * It recomputes immediately rather than leaving it to the `scroll` event that
   * follows, because a wheel that is about to be swallowed by the end of the
   * page produces no scroll event at all.
   */
  function onVisitorInput(): void {
    if (pinned === null) return;
    unpin();
    recompute();
  }

  /** Is the event's target inside one of the consumer's horizontal scrollers
   *  (the header's SIDEWAYS INPUT INSIDE A HORIZONTAL SCROLLER)? */
  function inHorizontalScroller(target: EventTarget | null): boolean {
    if (horizontalScrollers.length === 0 || !(target instanceof Node)) {
      return false;
    }
    for (const id of horizontalScrollers) {
      if (document.getElementById(id)?.contains(target) === true) return true;
    }
    return false;
  }

  /** A wheel drops the pin — unless it turns a horizontal scroller sideways. */
  function onWheel(event: WheelEvent): void {
    if (pinned === null) return;
    if (
      inHorizontalScroller(event.target) &&
      (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey)
    ) {
      return;
    }
    onVisitorInput();
  }

  /** A touch gesture that began inside a horizontal scroller: where, and —
   *  once the finger has travelled DECIDE_PX — whether it pans sideways. */
  let gesture: { x: number; y: number; sideways: boolean | null } | null = null;

  function onTouchStart(event: TouchEvent): void {
    const touch = event.touches.length === 1 ? event.touches[0] : undefined;
    gesture =
      touch !== undefined && inHorizontalScroller(event.target)
        ? { x: touch.clientX, y: touch.clientY, sideways: null }
        : null;
  }

  function onTouchMove(event: TouchEvent): void {
    if (gesture !== null) {
      const touch = event.touches.length === 1 ? event.touches[0] : undefined;
      if (touch === undefined) {
        // A second finger: a pinch, the page's — never the scroller's pan.
        gesture = null;
      } else {
        if (gesture.sideways === null) {
          const dx = touch.clientX - gesture.x;
          const dy = touch.clientY - gesture.y;
          // Not a pan yet: a tap, a wobble — nothing to judge.
          if (Math.hypot(dx, dy) < DECIDE_PX) return;
          // Only a CLEARLY vertical pan — within 35° of vertical — is the
          // page's; anything flatter is the scroller's (VERTICAL_PAN_RATIO).
          gesture.sideways = Math.abs(dx) > VERTICAL_PAN_RATIO * Math.abs(dy);
        }
        // The scroller's own sideways pan: the page does not move.
        if (gesture.sideways) return;
      }
    }
    onVisitorInput();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!SCROLL_KEYS.has(event.key)) return;
    // …BUT ONLY IF THE KEY REACHED THE PAGE. A keydown bubbles to window from
    // wherever it landed, and some controls CONSUME these keys instead of
    // scrolling with them: Space on a <button> is that button's activation
    // (the header's Contact button, the burger, a dial code), and the arrows
    // belong to a <select> or a text field. Treating those as "the visitor is
    // scrolling" would drop a pin although the page never moved (G2 react,
    // 2026-09-14). A focused <a> is deliberately NOT in this list: a link does
    // not swallow Space, so the page scrolls under it and the pin should go.
    // `dialog` IS: ui/Modal focuses the <dialog> element itself, and the
    // arrows inside it scroll the dialog's own content, never the page
    // (G2 react, Fable, 2026-09-15).
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'button,[role="button"],input,select,textarea,[contenteditable],dialog',
      )
    )
      return;
    onVisitorInput();
  }

  function onResize(): void {
    // THE RESIZE KEEPS THE PIN (the header): a SETTLED pin takes the page's
    // resting position again, first — the browser may have moved the page as
    // part of this resize, and that move's `scroll` event comes after this
    // one. A pin still gliding is its settle's to judge, untouched.
    if (pinned !== null && settledY !== null) settledY = window.scrollY;
    // Every rect changed, so the answer may have; a resize is never a reason
    // to drop the visitor's pin. On the reading line a breakpoint may also
    // have changed a target's own stylesheet margin, so the write comes off
    // first and the evaluation reads every floor again (THE READING LINE).
    if (line === 'reading') liftWrites();
    recompute();
  }

  /** THE REFRESH (the header): the resize path, on a consumer's word — and
   *  only while started, where the listeners it re-plans for exist. */
  function refresh(): void {
    if (!started) return;
    onResize();
  }

  /** The URL's own `#id`, if it names one of ours. Covers Back/Forward, a
   *  pasted link and the load-time hash (start() calls it too). */
  function selectFromHash(): void {
    // Bare `slice(1)`, no decoding: every fragment id in this repo is ASCII
    // English by owner decision (fb-461), so nothing here is ever
    // percent-encoded. A non-ASCII id would need decodeURIComponent and a
    // guard around its throw — a decision for the consumer that brings one.
    const id = window.location.hash.slice(1);
    if (known.has(id)) {
      select(id);
      return;
    }
    // A FRAGMENT THIS MENU DOES NOT OWN is still news: the shell's skip link
    // (#main), a footer anchor, a link into another band. Ignoring it lets a
    // live pin survive a jump away from every target it knows — click a
    // category, then hit the skip link while the first jump is still inside
    // its settle window, and the menu goes on marking that category while the
    // page sits at the top of the document, with no later event to contradict
    // it (G2 react, 2026-09-14). Dropping the pin hands the answer back to the
    // walk, which reads where the page actually is.
    if (pinned === null) return;
    unpin();
    recompute();
  }

  function select(id: string): void {
    // OUTSIDE THE STARTED WINDOW THIS IS A NO-OP, and both halves of that are
    // real (G2 typescript, 2026-09-14, both reproduced under plain Node).
    // After dispose(): re-pinning would publish a current item for a page this
    // store has stopped watching — precisely what dispose()'s own reset exists
    // to prevent — to any subscriber still attached. Before start(), or where
    // there is no browser at all (the ring is loadable by plain Node, and
    // start() takes its `typeof window === 'undefined'` exit there): arming the
    // settle would schedule a callback that reads `window.scrollY` a moment
    // later and throws ReferenceError from a timer nobody can catch. The type
    // permits both calls — clock and rotation take the same runtime-guard route
    // rather than modelling a phantom lifecycle — so the guard is here.
    // selectFromHash() is unaffected: start() sets `started` before calling it.
    if (!started) return;
    if (!known.has(id)) return;
    pinned = id;
    // THE START GRACE, renewed: the page is where it is now, it has not moved
    // yet, and the one extra window is unspent — and this pin's jump has not
    // been finished by the spy (THE READING LINE's one scroll, once per pin).
    checkedY = window.scrollY;
    moved = false;
    graceSpent = false;
    stillOnce = false;
    restY = null;
    restFromStart = false;
    relanded = false;
    // A click's pin, a `hashchange`'s: never the load-time one (start() marks
    // that one after this call returns).
    freshLoadPin = false;
    endLoadWait();
    // Arm BEFORE publishing: a subscriber notified of the new current item may
    // synchronously dispose (React runs store listeners during the same task),
    // and a timer armed afterwards would outlive the very call that cleaned it
    // up — the lib/clock precedent, same reason.
    armSettle();
    store.sync();
  }

  function start(): void {
    if (started) return;
    // A no-op where there is no browser: the module stays loadable by plain
    // Node (the ring's promise) even though nothing calls start() there.
    if (typeof window === 'undefined') return;
    started = true;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('focusin', onFocusIn);

    recompute();
    selectFromHash();
    // Only while still started: the pin's store.sync() may reach a subscriber
    // that disposes this spy, and a disposed spy must neither scroll the page
    // nor observe anything.
    if (!started) return;
    // THE LOAD-TIME JUMP THAT WENT STALE: a pin the URL's own `#fragment` set
    // on a FRESH navigation, never a reload's or a Back's restored position.
    freshLoadPin = line === 'reading' && pinned !== null && isFreshNavigation();
    // Where the page rests as the spy begins to watch — the browser's jump,
    // or whatever came before the island hydrated (ITS LIMITS, in the header).
    // A card within reach makes it a full rest point; for a page already
    // AWAY it is still one, but it skips only the distance bound — the card
    // must show in the clear area (THE HYBRID).
    restY = null;
    noteRest();
    restFromStart = false;
    if (restY === null && freshLoadPin) {
      restY = window.scrollY;
      restFromStart = true;
    }
    // …and its wait has a ceiling (LOAD_WAIT_CEILING_MS).
    loadWaitOver = false;
    if (freshLoadPin && document.readyState !== 'complete') {
      ceilingTimer = setTimeout(() => {
        ceilingTimer = undefined;
        loadWaitOver = true;
      }, LOAD_WAIT_CEILING_MS);
    }
    // THE READING LINE: finish the browser's load-time jump if it already
    // rests on the stylesheet's line — now that the first evaluation has
    // written the margins and the hash has pinned (a no-op on the landing
    // line) — and watch every target's size. NOT for a fresh load-time pin
    // while the document still loads: a scroll of ours then would stop the
    // browser's own corrections for a late webfont and spend this pin's one
    // finish on a layout about to change — the settle after the load finishes
    // it instead, still once (G2 react and typescript, 2026-10-10: fitting
    // cards 10 to 20px off with the scripts 700ms late and the webfont 1800ms).
    if (!freshLoadPin || document.readyState === 'complete') finishTheJump();
    if (line === 'reading') observeTargets();
  }

  function onHashChange(): void {
    selectFromHash();
  }

  /** A focus that lands OUTSIDE the pinned card ends a fresh load-time pin's
   *  claim to be finished (THE READING LINE's stale load-time jump): a Tab
   *  that went on, a screen reader's cursor — the visitor has moved on. The
   *  browser's own focus of the fragment's card is inside it. */
  function onFocusIn(event: FocusEvent): void {
    if (!freshLoadPin || pinned === null) return;
    const target = document.getElementById(pinned);
    const element = event.target;
    if (
      target !== null &&
      element instanceof Node &&
      target.contains(element)
    ) {
      return;
    }
    freshLoadPin = false;
    endLoadWait();
  }

  function dispose(): void {
    clearSettle();
    endLoadWait();
    if (started) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('focusin', onFocusIn);
      observer?.disconnect();
      observer = undefined;
      started = false;
    }
    // The reading line's one write comes off every target it was made on —
    // the stylesheet's own value returns — and its floors are forgotten, so a
    // later start() reads them afresh. The landing line wrote nothing.
    liftWrites();
    // Back to what a fresh spy answers: a disposed store that still named a
    // current item would be reporting a page it has stopped watching.
    pinned = null;
    position = null;
    settledY = null;
    gesture = null;
    freshLoadPin = false;
    loadWaitOver = false;
    restY = null;
    restFromStart = false;
    store.sync();
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    getServerSnapshot: store.getServerSnapshot,
    start,
    dispose,
    select,
    refresh,
  };
}
