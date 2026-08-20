'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { primaryRoutes } from '@/lib/routes';
import type { NavRoute } from './NavItem';

// sections/Header — the hook that turns the site's route list into the bar's
// entries: each one translated, and each one told whether it is the page you
// are on (org-review board F1, .claude/plans/
// header-code-organization-review.plan.md, owner approval fb-169 2026-08-17).
// It was born inside HeaderNav.tsx; extracted because the data has TWO equal
// consumers — the bar row (HeaderNav) and the panel list (NavMenu) render the
// same links — and a shared source housed inside one consumer made NavMenu
// import a component file for a non-component export. Same play as ui/slot.ts
// (fb-64): shared non-component machinery sits in a flat sibling module named
// for exactly what it exports.
//
// ── THE ROUTE LIST ITSELF NOW LIVES IN lib/routes.ts (Footer run, 2026-08-17).
// The Footer renders the same four links, and it is a DIFFERENT section: had
// the list stayed here, sections/Footer would have to import
// sections/Header/useNavItems — a sideways dependency §4 does not allow
// (app → sections → ui). So the pure data climbed to lib/, beside clinic.ts,
// and this hook kept the two things that need the browser. Observable
// behaviour is unchanged, deliberately: same order, same ro-only blog, same
// aria-current.
//
// ── Why this module is client code ('use client'). Both consumers must know
// WHICH PAGE YOU ARE ON to mark it, and under static export (§16) the answer
// is not knowable at build time: one HTML file per route is pre-rendered, and
// the router that reports the current path lives in the browser. Both
// consumers are already client islands; the directive here makes the boundary
// explicit rather than inherited, so an accidental server-side import fails
// with the honest error instead of a usePathname crash.
//
// §8.1 holds: t() is called HERE, in the section tier, and the atoms below
// NavItem receive finished strings. They never see a key.

/**
 * Section-scoped, NOT prefix matching for '/': every path starts with a
 * slash, so a naive startsWith would light Home up on every page. Everything
 * else matches its own path plus its descendants, which is what makes
 * /blog/<slug> report as Blog — the section, not the article, is what the
 * nav names.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The primary routes in bar order, each already translated and already told
 * whether it is the current page. Used by HeaderNav's bar row AND by
 * NavMenu's panel list.
 *
 * next-intl's usePathname returns the pathname with the locale prefix already
 * stripped ('/ro/services' → '/services'), so the hrefs compared here are the
 * same locale-less strings we hand to <Link>. Outside a Next router (a bare
 * unit test, a detached render) it can hand back nothing — `|| '/'` keeps that
 * case at "we are at the root" instead of crashing on .startsWith.
 */
export function useNavItems(): NavRoute[] {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname() || '/';

  return primaryRoutes(locale).map((route) => ({
    href: route.href,
    label: t(route.key),
    active: isActive(pathname, route.href),
  }));
}
