'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/locales';
import { usePathname } from '@/i18n/navigation';
import type { NavRoute } from './NavItem';

// sections/Header — the ONE source of the site's primary route list, in its
// own module (org-review board F1, .claude/plans/
// header-code-organization-review.plan.md, owner approval fb-169 2026-08-17).
// It was born inside HeaderNav.tsx; extracted because the data has TWO equal
// consumers — the bar row (HeaderNav) and the panel list (NavMenu) render the
// same links — and a shared source housed inside one consumer made NavMenu
// import a component file for a non-component export. Same play as ui/slot.ts
// (fb-64): shared non-component machinery sits in a flat sibling module named
// for exactly what it exports.
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
 * The blog exists in Romanian only (§5) — the nav item is hidden on every
 * other locale, so `/de/blog` is never offered and never linked. Named
 * against the Locale union so a locale rename cannot leave a dead string here.
 */
const BLOG_LOCALE: Locale = 'ro';

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

  const routes = [
    { href: '/', label: t('nav.home') },
    { href: '/services', label: t('nav.services') },
    { href: '/team', label: t('nav.team') },
    ...(locale === BLOG_LOCALE
      ? [{ href: '/blog', label: t('nav.blog') }]
      : []),
  ];

  return routes.map((route) => ({
    ...route,
    active: isActive(pathname, route.href),
  }));
}
