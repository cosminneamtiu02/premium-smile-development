# Button migration — pre-flight architecture review

> **Run:** `/new-atom` · mode **migrate** · branch `migrate/button` (cut from `develop` @ `6575195`)
> **Stage:** S1–S3 evidence + contract, presented for annotate-and-approve **before any code**.
> Building (S4→S7) starts only after this canvas is approved. Commits only on explicit "commit it".

---

## 0 · One clarification first: "branch from production"

There is **no `production` branch**. The repo has exactly the two documented lanes:
`develop` (default — all feature PRs land here) and `main` (the production lane, deployed,
currently 11 commits behind develop's line). Your own #15 decision enforces that `main` only
ever receives promotions **from develop**. A feature branch based on `main` could not PR into
`develop` cleanly, so I cut `migrate/button` **off up-to-date `develop`** per the `/new-atom`
skill. If you meant something else by "production", annotate here.

---

## 1 · What the old repo actually ships (evidence)

Five button-looking things, **three different implementations**, three hover grammars:

| # | Button | Where | Element | Content shape | Hover behaviour (verbatim classes) |
|---|--------|-------|---------|---------------|-------------------------------------|
| 1 | „Programează o consultație" | Hero primary (`home-page.tsx:102`) | `ui/button` + className overrides | plain text | `hover:scale-105` + invert to white bg / accent text + bigger shadow |
| 2 | „Vezi serviciile" | Hero secondary (`home-page.tsx:107`) | `ui/button` + className overrides | plain text | `hover:scale-105` + bg-subtle + bigger shadow |
| 3 | „Programează o consultație" | TopBar CTA (`top-bar.tsx:142`) | `ui/button` + className overrides | plain text | `hover:scale-105` + invert to white (comment: "same pattern propagated…") |
| 4 | „Soluționarea **online** a litigiilor" | Footer ANPC/ODR (`footer.tsx:136`) | **hand-rolled `<a>`** | text with bold span (`RichText` helper) | `hover:-translate-y-0.5` lift + **fill accent**, text flips to white |
| 5 | „Soluționarea alternativă a litigiilor" + ANPC logo | Footer ANPC/SAL (`footer.tsx:149`) | **hand-rolled `<a>`** | image beside text | same lift + fill as #4 |

(Adjacent relatives, out of this run's scope: round icon-only `ui/icon-button` +
`floating-book-cta` — a **different atom**, later in the playbook order.)

Your observation is exactly right and is the disease §6 exists to cure: they *look* like one
family but are three unrelated implementations. The base `ui/button` even carries a default
`hover:-translate-y-px` that usages then fight with `hover:translate-y-0` overrides. The old
hero also resizes button internals from outside (`lg:[&>*]:h-16 lg:[&>*]:px-10`), and the
footer hard-fixes `lg:w-56` on a text container (breaks at German +30–35% width, §8.4).
None of these patterns may survive migration.

---

## 2 · The visual bug, root-caused

**Symptom:** on the "Programează o consultație" button, at the end of the hover the label
suddenly nudges down a hair.

**Cause:** `hover:scale-105` animates `transform: scale()`. While the 200 ms transition runs,
the browser composites the button as a GPU texture — the text is rasterized at scale 1.0 and
*stretched* to 1.05 (slightly soft). When the transition **ends**, the browser re-rasterizes
the layer at the final scale and glyphs re-snap to the pixel grid + re-hint. With a fractional
box (h-16 × 1.05 = 67.2 px) the re-snap lands glyphs a sub-pixel-to-1px lower → the sudden
"push down". Same pop happens in reverse at the end of un-hover. The footer's
`-translate-y-0.5` lift carries the second classic defect of this family: the box moves under
the cursor, so hovering near an edge makes the hover boundary itself move → flicker loops.

**Consequence for the new atom:** your instinct is correct — with **static content and no
box transforms on hover, this bug cannot exist by construction**. The unified animation below
moves *paint*, never the box.

---

## 3 · The architecture question: separate "content" atom?

**Recommendation: No separate ButtonContent atom. One `ui/Button`; content flows through
`children` (a slot). This is also what the brief already mandates (§6.2 "Slots over modes").**

How production design systems (Radix/shadcn, React Aria, Polaris, GOV.UK) split this concept:

- **The Button owns the frame:** box (padding, min-height, radius, border), typography scale,
  color states (rest/hover/focus/active/disabled), the animation, and the **gap** between
  content pieces. These are *variants* → typed props.
- **Content is whatever the caller slots in:** plain text, `<strong>` inside text, an image
  beside text. The button never enumerates content kinds (`type="text" | "image"` is the
  anti-pattern — every new content shape would mean editing the Button).
- **Width/placement belong to the parent** (§6.4): the old hero's equal-width pair stays a
  parent concern (`grid-cols-2` + `w-full` via `className` — positioning, which §6.8 allows).

**Your hover-coupling concern — "the embedded component would have to change behaviour on
hover" — is solved by the platform, not by components.** The button sets `color` on its root
and transitions it; children simply **inherit**. Text, `<strong>`, and any SVG drawn with
`currentColor` follow the button's color transition automatically, mid-animation, with zero
JavaScript, zero shared state, zero awareness that a hover is happening. A separate content
component would *create* the coupling problem you're worried about (it would need hover
subscription via context/JS); the slot model makes the problem not exist.

The three content shapes, concretely:

```tsx
// 1 · plain text
<Button size="xl">Programează o consultație</Button>

// 2 · partly-bold text — next-intl does this natively with ICU tags (t.rich),
//     the button just styles <strong> descendants; color still inherits
<Button variant="outline" asChild>
  <a href={ANPC_ODR_URL} target="_blank" rel="noopener noreferrer">
    {t.rich('footer.anpcOnline', { b: (c) => <strong>{c}</strong> })}
  </a>
</Button>

// 3 · image beside text — gap owned by the Button, image by ui/Image
<Button variant="outline" asChild>
  <a href={ANPC_SAL_URL} target="_blank" rel="noopener noreferrer">
    <Image src="/anpc-logo…" alt="" width={…} height={…} />
    <span>{t('footer.anpcAlt')}</span>
  </a>
</Button>
```

Two boundaries that keep the atom honest:

- **Icon-only controls are a different atom.** `IconButton` (playbook, later) is where §6.3's
  "aria-label required by the types" lives. `ui/Button` is by definition a *labelled* button —
  its accessible name comes from its text content; the a11y gate (axe `button-name`) polices it.
- **The old `RichText` helper is not migrated.** next-intl's `t.rich` is the built-in,
  ICU-native replacement (old repo hand-rolled it because react-i18next lacks it).
  → verdict **drop** — needs your OK (this is a §-mandated ask before dropping).

---

## 4 · One button look, three HTML elements — the one real API decision

First, the *situations*. The same-looking button appears on this site in three technically
different jobs, and correct HTML demands a different element for each:

- **Situation 1 — do something on this page:** „Programează o consultație" opens the
  ContactModal. No navigation happens → must be a real `<button>` (§9: never a click-div,
  and never a fake `<a href="#">`).
- **Situation 2 — go to another page of our site:** „Vezi serviciile" → `/services`. Must be
  a real link `<a>` so Google crawls it and right-click/open-in-new-tab works. And because
  every route is locale-prefixed (`/ro/services`, `/de/services`…), the link should be
  next-intl's `<Link>`, which adds the current locale automatically.
- **Situation 3 — leave the site:** ANPC/SOL legal pages, `tel:`, WhatsApp. A plain
  `<a target="_blank">` (external URLs need no locale logic).

All three must *look and animate identically*. The API question is only: **how does a caller
tell Button which element to be?** The three candidate APIs, each shown on the same three
situations:

**Option A — `asChild` prop (recommended).** Default renders `<button>`. With `asChild`,
Button renders *the child element you give it* and pours all its styling onto that element.

```tsx
// S1: <Button onClick={openModal}>Programează o consultație</Button>
//     → renders <button class="…sweep…">
// S2: <Button asChild><Link href="/services">Vezi serviciile</Link></Button>
//     → renders next-intl's <a href="/ro/services" class="…sweep…">
// S3: <Button asChild><a href={ANPC_URL} target="_blank">…</a></Button>
//     → renders <a target="_blank" class="…sweep…">
```

- ✅ One component, one styling source — the three situations can never drift apart.
- ✅ Works with elements Button has never heard of (next-intl `<Link>` today, anything
  tomorrow). Crucially, the locale machinery stays in `sections/` — the `ui/` layer never
  imports i18n code, keeping the §4 dependency direction clean.
- ✅ Zero new dependencies: a ~20-line internal helper (§3 stack stays locked). Same pattern
  as Radix/shadcn, which your old repo already imitated.
- ⚠️ Cost: you have to learn how `asChild` renders. Walkthrough below, from zero.

**`asChild` from zero.** Ignore components for a moment — look only at what lands in the
browser's DOM.

Without `asChild`, Button's entire job is to produce a `<button>` tag dressed in the right
classes:

```tsx
<Button onClick={openModal}>Programează o consultație</Button>

// what the browser receives:
<button class="…all the sweep/variant/size classes…">Programează o consultație</button>
```

Now the problem case. „Vezi serviciile" must be an `<a>` tag — it navigates to another
page, and links must be links (SEO, right-click → open in new tab, middle-click). But it
must *wear the identical classes* as the button next to it. The reflex with little
experience is: copy the class string onto an `<a>` by hand. That is literally what the old
site's footer did for the ANPC buttons — and hand-copies drifting apart over months is
exactly how the old site ended up with 5 similar-but-different buttons.

`asChild` is that copy, done *by the component, automatically, every render*:

```tsx
<Button asChild>
  <a href="/services">Vezi serviciile</a>
</Button>

// what the browser receives — NO <button> exists, nothing wraps anything:
<a href="/services" class="…the SAME sweep/variant/size classes…">Vezi serviciile</a>
```

**"Produces its own tag" — what that literally means.** A React component is just a
function. Writing `<Button>…</Button>` in a page *calls that function*, and **whatever the
function returns is what ends up in the page's HTML**. So the entire question "which HTML
element will exist?" is answered by looking at Button's `return` statement. Here is
Button's own source code, simplified to the bone, both modes visible:

```tsx
function Button({ asChild, variant, size, children, ...rest }) {
  const classes = buildClassString(variant, size); // the look: sweep, colors, padding…

  if (!asChild) {
    // Button's code contains a <button> tag RIGHT HERE, in its return.
    // This is what "produces its own tag" means: every plain <Button> usage
    // puts this <button> element into the page, with `classes` on it.
    return (
      <button type="button" className={classes} {...rest}>
        {children}
      </button>
    );
  }

  // asChild mode: notice there is NO tag written on this branch. `children`
  // is the element YOU already wrote in the page — e.g. <a href="/services">.
  // cloneElement means "the same element, with these extra props added".
  // So Button hands its class string to YOUR element and returns YOUR element.
  return cloneElement(children, { className: classes });
}
```

One terminology fix, in case it's the snag: `href` is an *attribute*; the element is `<a>`
(an anchor — a link). And with `asChild`, Button does **not** produce the `<a>` — *you*
wrote that `<a>` yourself in the page code. Button only sticks its classes onto it and
returns it, otherwise untouched.

**Why the name `asChild` — and what "child" even is here.** HTML and JSX are trees, and
the tree vocabulary is parent/child: whatever you nest *between* a tag's opening and
closing is that tag's **child**.

```tsx
<Button asChild>          ← parent
  <a href="/services">…</a>   ← the child: the element nested inside
</Button>
```

React makes this literal: everything you nest inside a component arrives in the component
as a prop named exactly `children` (that's why Button's source above reads
`cloneElement(children, …)`). So "the child" = "the `<a>` you nested between `<Button>` and
`</Button>`" — nothing more exotic.

The prop name reads as a sentence: *"Button, render yourself **as** the **child**"* —
instead of being your own `<button>` element, become the element nested inside you. The
name was coined by Radix UI and spread through shadcn/ui; other libraries name the same
idea `as="a"` (Chakra) or `component="a"` (MUI). We keep `asChild` because it's the
dominant convention in the ecosystem this repo's tooling comes from — the skill transfers.

**Why do two modes exist at all?** Because `<button>` and `<a>` are different HTML machines
with different built-in behaviour: `<button>` = "run code when clicked" (open the modal) ·
`<a>` = "go to this URL" (real navigation, right-click menu, SEO). Only the page author
knows which machine a given spot needs — Button can't guess. So Button owns exactly one
thing, the **look** (that `classes` string), and either mounts it on its own `<button>`
(default) or on the element you brought (`asChild`). Either way the look is written once,
in one file — the two can never drift apart.

Rule of thumb when writing pages: **action on this page → `<Button>` · link dressed as a
button → `<Button asChild><a …> or <Link …></Button>`.** It's the same pattern shadcn/ui
and Radix popularized, so it's a skill that transfers to other codebases, and the `AsLink`
Storybook story will show it live with the rendered HTML visible.

**Option B — `href` prop.** `<Button href="…">` renders `<a>`; without `href`, `<button>`.

```tsx
// S1: <Button onClick={openModal}>…</Button>              → fine
// S2: <Button href={`/${locale}/services`}>…</Button>     → ✗ you must hand-build the
//     locale prefix at every call site (or Button imports the router — forbidden: ui/
//     must not depend on app-level navigation, §4 dependency direction)
// S3: <Button href={ANPC_URL} target="_blank">…</Button>  → fine
```

- ✅ Simplest possible API to read.
- ❌ Situation 2 — a first-class need on every page — is broken or hacky. Rejected.

**Option C — two components: `Button` + `ButtonLink`,** sharing one internal style function.

```tsx
// S1: <Button onClick={openModal}>…</Button>
// S2: <ButtonLink href="/services">…</ButtonLink>          (wraps next-intl Link inside)
// S3: <ButtonLink href={ANPC_URL} external>…</ButtonLink>
```

- ✅ Each component's types are simple and exact (no `disabled` on links, etc.).
- ❌ Two public APIs whose look must never drift — a mini version of exactly the disease
  the old repo has (5 similar-but-different buttons).
- ❌ `ButtonLink` must import next-intl's `<Link>` *inside* `ui/` — the locale machinery
  leaks into the atom layer that §8.1 wants locale-agnostic.

**Tradeoff summary: A pays one small learning-curve cost and buys permanent single-source
styling + a clean ui/ layer. B is disqualified by Situation 2. C trades A's learning curve
for a permanent two-API maintenance tax.**
→ **✅ Option A approved by owner on canvas, 2026-08-02** ("yeah option a it is then").

---

## 5 · The unified hover animation (replaces all three old grammars)

Spec from your description: on hover the fill color **grows from the center toward the
edges**; on un-hover it **recedes from the edges back to the center**; both directions
animated over time. No lift, no scale — nothing that can reproduce §2's bug class.

**Mechanism (recommended): horizontal center sweep.** A `::before` layer painted in the
target color, `transform: scaleX(0)` at rest → `scaleX(1)` on hover, `transform-origin:
center`, `transition: transform 240ms ease` — the reverse plays automatically on un-hover
(edges → center), which is *exactly* the symmetry you described. Transform-only → GPU-
composited, no layout, no repaint of text, works at any button size.

```text
root:  relative isolate overflow-hidden          (sweep clipped by the 6px radius)
       transition-colors duration-[240ms]        (label color syncs with the sweep)
       motion-reduce:transition-none             (§9 — instant state swap)
::before: absolute inset-0 -z-10 origin-center scale-x-0
          transition-transform duration-[240ms] hover:scale-x-100
          motion-reduce:transition-none
```

*Alternative mechanism (annotate if you prefer it):* **radial bloom** — the color grows as a
circle from the center (`clip-path: circle(0%→120% at center)`). Reads "center → edges" in
every direction, and generalizes prettily to the round floating CTA later; slightly heavier
(paint-driven, not composited) and softer-edged. Default is the sweep unless you say bloom.

**What "semantic tokens" means here** — yes, exactly what you described, with one nuance.
They are CSS variables declared once in [src/styles/globals.css](../../src/styles/globals.css):
`--cta: #008854`, `--cta-hover: #006b42`, `--ink-inverse: #ffffff`, … The button never
contains a hex value; it says `bg-cta` / `text-ink-inverse` (Tailwind utilities wired to
those variables). The nuance: the names describe the **role** (`--cta` = "call-to-action
surface"), never the color (`--green`) — so if a second theme ever ships, only the values
file changes and every component restyles itself for free. That's the two-layer system from
§15.1: 17 role names, one light-theme value set.

**Color mapping (semantic tokens only, all pairs AA-checked):**

| Variant | Rest | Hover sweep | Label |
|---------|------|-------------|-------|
| `solid` | `--cta` #008854, label `--ink-inverse` | `--cta-hover` #006b42 sweeps over | white throughout — 4.51:1 rest, 6.60:1 hover ✓ |
| `outline` | `--surface` bg, `--cta` border + label (4.51:1 ✓) | **AMENDED (a11y audit; approved with the S7 pack 2026-08-03):** fill+label swap to `--cta`/white is **instant**, then the same `--cta-hover` sweep as solid plays over it | never animates — a timed lerp under the spatial sweep left wide labels' outer glyphs at ~1.1–2:1 mid-transition |
| `ghost` | transparent, `--ink` label | quiet `--line-subtle` sweep | unchanged (11.9:1) |

> **Frame-safety invariant (final):** text color never animates on any variant; the
> sweep only ever moves between two grounds that both pass 4.5:1 with the text
> painted at that moment. This also removed every root transition (the G2 focus-ring
> fade bug class is gone structurally).

Focus ring stays state-independent: `focus-visible:outline-2 outline-offset-2` in `--focus`
(never removed, §9). Active: instant `--cta-hover`, **no transform**. The old repo's shadow
choreography (`shadow-cta` → `shadow-cta-lg`) is **not** migrated — the sweep is the one
hover signal (annotate if you want a shadow token pass later; it'd be a separate decision
against the locked token set).

---

## 6 · Proposed prop contract (S3 — the whole public API)

```ts
type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg' | 'xl';

type ButtonOwnProps = {
  /** Visual tone. solid = filled CTA; outline = bordered, fills on hover; ghost = quiet. */
  variant?: ButtonVariant;   // default 'solid'
  /** Box scale. md ≥44px min-height (§9 primary-target), lg ≥56px, xl ≥64px (hero).
   *  All rem-based; text may wrap — the atom never forces nowrap (§8.4 DE headroom). */
  size?: ButtonSize;         // default 'md'
  /** Merge the button's styling/behaviour onto the single child element
   *  (<a>, next-intl <Link>) instead of rendering a <button>. */
  asChild?: boolean;         // default false
  children: React.ReactNode;
};

export type ButtonProps = ButtonOwnProps &
  Omit<React.ComponentPropsWithRef<'button'>, keyof ButtonOwnProps>;
```

§6.8 fidelity: native props spread onto the root, `ref` as a plain prop, incoming
`className` merged (parents use it for **positioning only** — the old `[&>*]:h-16` resize
hack becomes `size="xl"`). No outer margins. Semantic tokens only. `'use client'` is **not**
needed — the sweep is pure CSS; the atom stays server-renderable static HTML (§16).

Replaces the Phase 0 probe wholesale (the probe's own header says so). Probe's good ideas —
`type="button"` default, role-based tests — are kept and extended.

---

## 7 · Inventory verdicts + expected-diff manifest (S2, declared before building)

Verdict vocabulary (every old-repo piece gets one): **rewrite** = rebuilt fresh in the new
repo to the new contract · **merge** = its job is absorbed into another component, it won't
exist by name · **drop** = not migrated at all because something already covers its job.
Merge/drop verdicts require your explicit OK — that's a skill rule, so nothing silently
disappears during migration.

| Old source | Verdict | Lands as |
|------------|---------|----------|
| `ui/button` (the shadcn-style base button) | **rewrite** | `ui/Button` per §6 contract above |
| Footer's 2 hand-rolled ANPC `<a>` buttons | **merge** | become `Button variant="outline" asChild` usages when the Footer section is migrated (their fixed `lg:w-56` width → parent `min-width`, §8.4) |
| The "parent resizes button internals" styling *pattern* — old Hero/TopBar code doing `lg:[&>*]:h-16 lg:[&>*]:px-10` ("force every child to 64 px tall") | **drop** — ✅ owner-approved on canvas, 2026-08-02 | the Button's own `size="xl"` prop — parents never restyle atom internals in the new repo (§6.8) |
| `ui/rich-text` — a tiny old helper whose only job is rendering translation strings containing `<b>…</b>` markers as real bold text (used for „Soluționarea **online** a litigiilor") | **drop** — ✅ owner-approved on canvas, 2026-08-02 | nothing to build: next-intl's built-in `t.rich()` does the same job (the old repo hand-rolled it because react-i18next can't) |
| `ui/icon-button`, `floating-book-cta` (the round phone button) | out of scope this run | future `IconButton` atom + a section composite, later in the playbook order |

**Naming note (your question):** in this project, compositions of atoms are called
**sections** and live in `src/components/sections/` (Header, Footer, Hero, ContactModal…).
The old TopBar itself **will** be migrated — later, as the `Header` section, composed of
atoms including this very Button (plus LanguageSwitcher, nav links…). Row 3 above is *not*
about migrating the TopBar; it only flags one styling habit found inside the old Hero/TopBar
files that the new repo bans.

**Expected-diff manifest (V gate will be held to exactly this):**

- **Allowed to change:** `ui-button--default`, `ui-button--ghost`, `ui-button--disabled`
  (probe stories replaced by the real contract's stories).
- **New baselines:** every new `UI/Button/*` story — 1280-only per the §13 tier matrix
  (+ opt-in 320 tag on the wrap-stress story), created via scoped `visual:update`.
- **Zero undeclared diffs anywhere else** (`ui-image--*` untouched). Any other diff = regression → `/debug-deep`.

Planned stories (S4/S6): Solid („Programează o consultație"), Outline („Vezi serviciile"),
Ghost, PartlyBold (ANPC/ODR string), WithImage (ANPC logo + text), Sizes, AsLink,
Disabled, DE-longest stress („Vereinbaren Sie einen Beratungstermin"), pseudo-locale stress.
Hover end-states are exercised in the S7 pack screenshots (chrome-devtools real hover),
not in animation-disabled baselines.

---

## 8 · After you approve

S4 failing tests + skeleton story → S5 build against live Storybook → S6 full stories →
G1 machine gate → G2 agent reviewers → V regression net vs the manifest → **S7 visual pack**
(every story × 320/390/768/1280/1536/1920) back on this canvas for point-and-approve →
wait for your explicit **"commit it"** → single commit, PR into `develop`.

**All three decision cards are resolved:**
**(1) `asChild` polymorphism — ✅ approved** (canvas, 2026-08-02) ·
**(2) sweep vs radial bloom — the sweep stands** (default, no objection) ·
**(3) drop old `RichText` — ✅ approved** (canvas, 2026-08-02).

**Nothing is open — hit *Approve* to start S4 (failing tests + skeleton story first).**
