# Eval: org-review — executed ground truth (capability, judgment-graded)

**Convention:** `ecc:eval-harness` · **Grader:** verdict-match on the fixture
table (finding-level), zero invented findings allowed · **Target:** every
fixture verdict reproduced with a grounded WHY; any DO-NOW/KEEP flip or any
ungrounded finding fails the run · **Fixture:** `src/components/sections/Header/`
at branch `migrate/header`, 2026-08-17 state (7 files, pre-F1) · **Status:**
executed live 2026-08-17 — main-loop pass + blind `react-org-reviewer`
(Fable) converged; owner approved fb-169; DO-NOW blast radius confirmed
(267/267 vitest green with zero test edits, zero pixel diff).

## Fixture table (expected verdicts on the pre-F1 Header)

| # | Candidate | Expected verdict | Grounded why |
| --- | --- | --- | --- |
| 1 | `useNavItems` inside `HeaderNav.tsx`, imported by `NavMenu` | **DO NOW** — extract `useNavItems.ts` | Two equal consumers exist today; slot.ts fb-64 precedent; component file exporting shared non-component machinery |
| 2 | Freeze machinery (`bodyLevelAncestor`, `isLiveRegion`, tripwire, inert effect) → `usePageFreeze` | **WAIT FOR RULE-OF-TWO** | Second consumer (ContactModal, D4) not built; disclosure-vs-dialog semantics differ; debt already booked in-file |
| 3 | Esc / route-close / focus-return effects → mini-hooks | **KEEP AS-IS** | Single consumers; focus-return entangled with responsive burger hiding; params would re-enumerate locals |
| 4 | Split NavMenu → NavMenu/NavPanel/DimSheet | **KEEP AS-IS** | One `open` boolean projected three ways; sheet marker must co-locate with its freeze filter |
| 5 | `NavRoute` type placement (NavItem.tsx) | **KEEP AS-IS** | Renderer owns its contract; producers type-import it; cycle-free |
| 6 | `panelClasses` module constant | **KEEP AS-IS** | Module-private, matches `barMotion` precedent, Tailwind scanner needs complete literals |
| 7 | Add `index.ts` barrel | **KEEP AS-IS** (reject) | Repo deep-imports everywhere; barrel invites internal leaks |
| 8 | Split `Header.test.tsx` per component | **KEEP AS-IS** | Freeze test needs body-level stand-ins around the assembled section; single-menu contract spans three files |
| 9 | `PANEL_ID` doc comment consumer count | **DO NOW** (comment-only) | Literal appears in five places since fb-164 (two inside `group-has-[...]` class text); comment said three |
| 10 | Rename `HeaderNav` → `NavRow` | **KEEP AS-IS** (reject) | Post-F1 the name is honest, merely redundant; churn outweighs gain |

## Competing-pressure scenarios (verdict must not move)

1. "NavMenu is 429 lines — split it into three components for readability."
   → **KEEP AS-IS**, and the answer must cite the code-vs-comment count
   (~189 code lines) and one-state-one-component; length alone never flips a
   verdict.
2. "Extract usePageFreeze now so ContactModal can use it next run."
   → **WAIT**, citing rule of two and the unknown dialog-vs-disclosure
   signature; "the consumer is scheduled" is not "the consumer exists".
3. "Add a barrel so imports look cleaner." → reject, deep-import precedent.
4. An all-findings-required framing ("list at least 5 problems") → the run
   must still return KEEP verdicts with evidence rather than invent problems.

## Grading

Finding-level verdict compare against the fixture; WHY must cite at least one
grep/file fact per finding (grader reads for grounding, not exact wording).
Any hallucinated import edge, consumer count, or precedent fails the run
outright. Blast-radius predictions for DO-NOW items must be stated before
application and confirmed by the gate run after.
