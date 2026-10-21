// sections/ShareLinks/times — the copy control's two clocks
// (./CopyLinkButton.tsx's THE TIMES and THE REFILL). A plain module, no
// directive and no React, on purpose: a value exported from a 'use client'
// file reaches a SERVER importer as a client reference, not as the number,
// so the numbers live here, where the island, its tests and any server file
// read the same value (sections/PriceList's arrival.ts is the precedent for
// a module a server file and an island share).

/** How long „Link copiat" stays on the status line, counted from the moment
 *  it LANDS there — STATUS_REFILL_MS after the answer — and the tick on the
 *  button goes with it: both are themselves again STATUS_REFILL_MS +
 *  COPY_FEEDBACK_MS after the answer (THE TIMES). A FAILURE has no clock: it
 *  stays until the next press. */
export const COPY_FEEDBACK_MS = 2_500;

/** The pause between an answer reaching the button and reaching the status
 *  line (THE REFILL): the line is EMPTY in between, so a repeated answer is
 *  announced again. Far shorter than COPY_FEEDBACK_MS, which outlasts it
 *  (CopyLinkButton.test.tsx pins the order). */
export const STATUS_REFILL_MS = 150;
