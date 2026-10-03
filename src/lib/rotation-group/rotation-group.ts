import { createClock, type ClockEnv } from '../clock/clock.ts';
import {
  createExternalStore,
  type ExternalStore,
} from '../external-store/external-store.ts';
import type {
  Rotation,
  RotationIdleReason,
  RotationStatus,
} from '../rotation/rotation.ts';

// lib/rotation-group — ONE beat, many rings: the opt-in scheduler that makes
// several rotations move at the same instant. React-free (CLAUDE.md §4's
// foundation ring, fence-tested by tests/unit/lib-react-free.test.ts), no
// 'use client', no DOM, no classes, no words. Board:
// .claude/plans/rotation-lib.plan.md, FINAL CONTRACT §4 (Q9b, built on the
// owner's fb-424 rider), amended by the G2 round (G2-5, G2-7, G2-8).
//
// ── The `.ts` in the imports above is deliberate and load-bearing: see
// clock.ts, "WHY THE IMPORTS ABOVE SAY `.ts`" (G2-7).
//
// ── THE SITE DEFAULT IS STILL INDEPENDENT CLOCKS (board Q7, owner fb-419).
// Nothing on this site joins a group unless a lane decides to, deliberately and
// in writing. The argued default: rhythms differ because CONTENT differs — a
// photograph needs a glance, a review card needs reading time, and for this
// audience (§9: skewing older) the deck's interval should be materially longer
// than a hero frame's. Two unequal rhythms drift in and out of phase, coincide
// occasionally, and the layout hides even that, since viewport-tall bands are
// rarely on screen together.
//
// ── WHAT A SHARED BEAT COSTS, SAID OUT LOUD. WAI-ARIA wants each widget to
// restart ITS OWN timer when the visitor navigates it and to pause on ITS OWN
// hover. A group must therefore either re-phase everyone when one dot is
// pressed (pressing the hero would restart the reviews) or let the touched
// widget leave the beat — i.e. the "in sync" guarantee dies at the first
// interaction either way. This module takes the second horn, which is the
// standard's: the beat is shared, the MANNERS stay each member's own. A
// suspended, stopped or idle member swallows its own tick because its own clock
// says so; a hand-navigated member swallows exactly one (its full-interval
// courtesy, paid in beats — see clock.ts restart()/resume(), external branch)
// and rejoins after it. The group writes members' state only through the
// play()/pause() FAN-OUT below; it never re-phases a member and never reads
// one.
//
// ── THE ROTATION CONTROL OF A GROUPED SET IS THE GROUP'S (G2-5, a11y). Under
// reduced motion — or after any member idles — a control wired to one member
// could not make the set move, and members whose beat was stopped went on
// reporting `running` (their live regions lied). So group.play() plays the beat
// AND every member, group.pause() stops both, and a grouped consumer renders NO
// per-member rotation control: one visible control, which is the SC 2.2.2
// mechanism for the whole set. Each member keeps play()/pause() for
// programmatic use (and for the day it leaves the group).
//
// ── WHY THE BEAT IS A CLOCK AND NOT A setInterval OF ITS OWN (the four-folder
// argument in the board's FINAL CONTRACT). A group needs the same first dwell,
// the same reduced-motion decline and the same background-tab hygiene as any
// single rotator. Giving it a private timer would copy those manners — the very
// drift this lane exists to end — so the beat is lib/clock, exactly like the
// one inside a rotation, and every fix lands in one file.
//
// ── CONSUMPTION (the recipe in rotation.ts, plus four group rules):
//
//   · SINGLE OWNER: exactly ONE component start()s and dispose()s the group.
//     Other bands only add() their member and call the returned remove(). A
//     second start() would re-phase the first dwell for everyone, and the first
//     cleanup's dispose() would freeze the other band's members — there is
//     deliberately no reference counting to paper over that.
//   · ADD IN THE START EFFECT, BEFORE start() — never in a useState
//     initializer (that runs on the server too, and twice in StrictMode dev). A
//     member added after start() joins mid-beat and loses its first dwell.
//   · CLEANUP DISPOSES THE MEMBERS TOO: each remove(), then each member's
//     dispose(), then the group's. A member's own start() installed its
//     matchMedia and visibilitychange watchers, and only ITS dispose() removes
//     them — the group's dispose() stops the beat and nothing else.
//   · ONE GROUP PER MEMBER: a rotation added to two groups advances twice per
//     beat. That is a consumer error and is deliberately unguarded (a member
//     does not know its groups).
//
//   · BUILT ONCE, HELD STABLE: the group AND the members array come from
//     useState initializers — `const [members] = useState(() => [createRotation(
//     { driver: 'external', … }), …])` — so the effect's deps are the same
//     references on every render. An inline `const members = [hero, deck]` is a
//     NEW array each render; exhaustive-deps is satisfied and warns about
//     nothing, yet every re-render (every tick of any member) would run
//     cleanup → effect: dispose() + start() on everything, clearing a hovered
//     member's pointer cause, re-phasing the beat to its first dwell after
//     every tick, and churning N+1 watcher pairs per render.
//
//     useEffect(() => {
//       const removals = members.map((member) => group.add(member));
//       for (const member of members) member.start();
//       group.start();
//       return () => {
//         for (const remove of removals) remove();
//         for (const member of members) member.dispose();
//         group.dispose();
//       };
//     }, [group, members]);

// The two type names below are lib/rotation's, not lib/clock's (org-review
// F11, 2026-09-09): a grouped consumer already speaks the RING's vocabulary —
// rotation.ts re-exports the statuses "so a consumer typing its own handlers
// never has to import from lib/clock" — and the group is a thing a consumer of
// rings holds. `RotationStatus` is an alias of the clock's own, and
// `RotationIdleReason` has identical members, so this is naming, not behaviour:
// zero runtime change.
export type RotationGroupSnapshot = Readonly<{
  /** The beat's own status — the group control reads this, not a member's. */
  status: RotationStatus;
  /**
   * 'too-few' is excluded because it is unreachable: the structural gate is
   * lib/rotation's two-item floor, applied per member, and a group exposes no
   * setEnabled of its own.
   */
  idleReason: Exclude<RotationIdleReason, 'too-few'> | null;
  /** How many rotations are currently driven by this beat. */
  members: number;
}>;

export type RotationGroupOptions = Readonly<{
  /** The shared rhythm, in milliseconds, at least 1 ms. */
  intervalMs: number;
  /** The first beat after start(); defaults to intervalMs (the first dwell). */
  startDelayMs?: number;
  /** Fakes for the clock's two browser touches; defaults are the real browser. */
  env?: ClockEnv;
}>;

/**
 * The beat's public surface: React's external-store protocol (the trio
 * useSyncExternalStore takes — see lib/external-store) plus the membership and
 * the one control a grouped set shows.
 */
export type RotationGroup = ExternalStore<RotationGroupSnapshot> &
  Readonly<{
    /**
     * Join the beat. Throws when the member drives itself.
     * @returns remove — idempotent, for the consumer's effect cleanup.
     */
    add(member: Rotation): () => void;
    /** Start the beat only: members start themselves (see CONSUMPTION). */
    start(): void;
    /** The one visible rotation control: the beat AND every member. */
    play(): void;
    pause(): void;
    /**
     * Stops the beat only: members keep their own state and their own watchers.
     */
    dispose(): void;
  }>;

/**
 * Build a shared beat. Touches nothing until start() or play() — the clock's
 * "construction is pure" rule, inherited.
 *
 * @throws when `intervalMs` or `startDelayMs` is not a finite number of at
 * least 1 ms (the clock's guard, G2-4).
 */
export function createRotationGroup(
  options: RotationGroupOptions,
): RotationGroup {
  const members = new Set<Rotation>();

  const clock = createClock({
    intervalMs: options.intervalMs,
    startDelayMs: options.startDelayMs,
    env: options.env,
    onTick: () => {
      // A copy: a member's tick may run consumer code that adds or removes a
      // member, and this round must stay the round it started as.
      let failure: unknown;
      let failed = false;
      for (const member of [...members]) {
        try {
          member.tick();
        } catch (error) {
          // BEAT ISOLATION: a member ticks consumer code (its subscribers are
          // React components), and one that throws must not starve the rest of
          // the set for this beat — a half-moved page is worse than a reported
          // error. The first failure is rethrown once the round is complete, so
          // it still reaches the console and the clock's own try/finally.
          if (!failed) {
            failed = true;
            failure = error;
          }
        }
      }
      if (failed) throw failure;
    },
  });

  function build(): RotationGroupSnapshot {
    const beat = clock.getSnapshot();
    return {
      status: beat.status,
      // 'disabled' is the CLOCK's word for what the ring publishes as
      // 'too-few', which is why the snapshot type excludes the latter.
      // Narrowed rather than cast: the unreachable case is PROVEN away here
      // instead of asserted, and if a future gate ever makes it reachable the
      // group reports "no reason" rather than lying about one.
      idleReason: beat.idleReason === 'disabled' ? null : beat.idleReason,
      members: members.size,
    };
  }

  /**
   * THE STORE: its builder runs once, here, so the construction snapshot is
   * both the first read and the frozen server one, and every store.sync() below
   * publishes only on a real change — lib/external-store's header explains why
   * the identity is the signal React reads.
   */
  const store = createExternalStore(build);

  clock.subscribe(store.sync);

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    getServerSnapshot: store.getServerSnapshot,
    add(member: Rotation): () => void {
      if (member.driver !== 'external') {
        // A programming error, not a runtime state: throwing is the only way it
        // becomes visible, since a double-driven ring looks merely "fast".
        throw new Error(
          "rotation-group: a member must be created with driver: 'external' — a rotation on its own internal clock would advance twice.",
        );
      }
      members.add(member);
      store.sync();

      let removed = false;
      return () => {
        if (removed) return;
        removed = true;
        members.delete(member);
        store.sync();
      };
    },
    start: clock.start,
    play(): void {
      clock.play();
      // The fan-out (G2-5): the group's control speaks for the whole set, so a
      // member that reduced motion or an earlier pause had idled starts too.
      for (const member of [...members]) member.play();
    },
    pause(): void {
      clock.pause();
      // …and stopping means every member reports 'stopped' and turns its live
      // region polite, instead of claiming to run while the beat is silent.
      for (const member of [...members]) member.pause();
    },
    // Membership deliberately SURVIVES a dispose: an effect that runs again
    // (Fast Refresh in dev, a late client-only mount) start()s the same group,
    // and one that had forgotten its members would beat for nobody.
    dispose: clock.dispose,
  };
}
