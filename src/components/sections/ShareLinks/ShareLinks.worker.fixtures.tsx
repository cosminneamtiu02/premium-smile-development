import { renderToString } from 'react-dom/server';
import { ShareLinks, type ShareLinksProps } from './ShareLinks';

// sections/ShareLinks — THE SERVER'S HTML, rendered where there is NO window
// and NO document: a dedicated Web Worker, started by ShareLinks.test.tsx's
// THE SERVER HTML hydration test. A test fixture (the `*.fixtures.*`
// workbench name — tests/unit/fixtures-fence.test.ts keeps every runtime file
// off it), never shipped.
//
// WHY A WORKER. The static export renders the row on a server, in Node, where
// `window` and `document` do not exist; the browser test that hydrates it
// runs in a page, where both do. A server pass rendered in that same page
// would follow any `typeof window` branch the browser's own render follows,
// and could never show the two disagreeing (the React review, round 2). The
// components project cannot render in Node: its suites run in Chromium, and
// the unit project resolves no `@/` path. A dedicated worker is the browser's
// own Node-shaped room — `typeof window` and `typeof document` are
// 'undefined' there, as on the server — served by the same Vite, so every
// import resolves as the test's own. MEASURED (2026-10-20): with a
// `typeof window` branch written into the copy button's render, the round-1
// way — the server pass rendered in the page — stayed green, and this one
// failed. WHAT IT CANNOT STAND FOR — the test's own paragraph has it whole —
// starts with the globals a worker HAS and Node lacks: `self`, `location`,
// `requestAnimationFrame` and `navigator.onLine` (MEASURED, 2026-10-21: all
// four in a Chromium 151 worker, none in Node 24). A render branching on one
// of those prints here what the page prints, and passes, while the export's
// Node would print something else.

/** What the worker answers: the HTML, and the two globals it was rendered
 *  without — read back by the test, so a worker that HAD them fails it. */
export type ServerRender = Readonly<{
  html: string;
  window: string;
  document: string;
}>;

addEventListener('message', (event: MessageEvent<ShareLinksProps>) => {
  const answer: ServerRender = {
    html: renderToString(<ShareLinks {...event.data} />),
    window: typeof window,
    document: typeof document,
  };
  postMessage(answer);
});
