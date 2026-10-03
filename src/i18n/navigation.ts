'use client';

import { usePathname as useNextPathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { stripLocale } from './href';

// The project's ONE "where am I" seam — and since §15.13 it holds a single
// export: usePathname, which reports the current path with the locale prefix
// already stripped ('/ro/services/' → '/services/'), the shape the Header
// compares to mark the page you are on.
//
// ── WHY Link · redirect · useRouter · getPathname NO LONGER EXIST HERE.
// Every internal link is a plain <a href> built by ./href.ts: the browser, not
// a router, decides where a click goes and each one loads a whole new document
// (§15.13). Keeping a <Link> export would leave the removed thing one import
// away, so this boundary is the first layer of the decision and
// eslint.config.mjs' no-restricted-imports block is the second.
//
// ── WHY THIS IS HAND-ROLLED RATHER THAN next-intl's createNavigation (D9).
// createNavigation returns the whole family — Link, redirect, useRouter,
// getPathname — and destructuring one name off it does not stop the module
// GRAPH from pulling in the rest: next/link came along into the Header's client
// island as unrendered dead code, in a lane whose entire point is that no
// navigation JavaScript ships. Written out, the hook is three lines over
// next/navigation (the lint block's one exempt module, see eslint.config.mjs)
// and the prefix rule it undoes is ./href.ts's, so ./routing.ts's
// `localePrefix: 'always'` is spelled in exactly ONE file for both directions
// instead of ours on the way out and next-intl's on the way in. next-intl keeps
// the job it is here for: useLocale reads the request-scoped locale from the
// provider, no router involved.
export function usePathname(): `/${string}` {
  const locale = useLocale();
  // next/navigation types this `string`; in the App Router it is always a URL
  // pathname, i.e. absolute, and Next has already removed its own basePath from
  // it — so the only prefix left to take off is the locale's. Outside a router
  // (a bare render, a story that forgot `appDirectory: true`) the value can be
  // null, which `|| '/'` reads as "we are at the root" instead of crashing;
  // that is also why consumers need no fallback of their own.
  const pathname = (useNextPathname() || '/') as `/${string}`;
  return stripLocale(pathname, locale);
}
