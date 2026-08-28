'use client';

import { useLocale, useTranslations } from 'next-intl';
import { localeHref } from '@/i18n/href';
import { usePathname } from '@/i18n/navigation';
import { matchesRoute, primaryRoutes } from '@/lib/routes';
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
// ── AND SO DID THE MATCH RULE (language-dial lane, 2026-08-28). This file used
// to own a private `isActive` — "section-scoped, not prefix matching for '/'" —
// with the comment that it stayed here because marking the current page needs
// the router and only the Header does it. sections/LanguageSwitcher became its
// second consumer: to decide whether the page you are on exists in the language
// you are picking, `equivalentPath` has to ask the very same question
// (/blog/<slug> is under /blog, so it is Romanian-only too, §5). Rule of two,
// same §4 direction as the list — the rule climbed to lib/routes.ts as
// `matchesRoute` and this hook now calls it. The router did NOT climb with it:
// comparing two paths was always pure, and asking "where am I?" is still
// usePathname's job, right here. Zero pixels move; the Header's suites and
// stories are untouched by design.
//
// ── Why this module is client code ('use client'). Both consumers must know
// WHICH PAGE YOU ARE ON to mark it, and under static export (§16) the answer
// is not knowable at build time: one HTML file per route is pre-rendered, and
// the router that reports the current path lives in the browser. Both
// consumers are already client islands; the directive here makes the boundary
// explicit rather than inherited, so an accidental server-side import fails
// with the honest error instead of a usePathname crash. Since §15.13 that hook
// is the ONLY router touch left in the section: the hrefs are built by the pure
// i18n/href.ts, so nothing but "which page am I on" needs the browser — and
// since D9 even that hook is ours, three lines over next/navigation, so no
// next/link rides into this island's bundle behind next-intl's createNavigation.
//
// §8.1 holds: t() is called HERE, in the section tier, and the atoms below
// NavItem receive finished strings. They never see a key.

/**
 * The primary routes in bar order, each already translated, already told
 * whether it is the current page, and each carrying the FINAL href a plain
 * anchor can print (§15.13 — no <Link> is left to finish one). Used by
 * HeaderNav's bar row AND by NavMenu's panel list.
 *
 * The two strings in play are deliberately different. What SHIPS is
 * localeHref's '/ro/services/'; what the ACTIVE rule compares is the
 * locale-less '/services', because @/i18n/navigation's usePathname hands back
 * the pathname with the locale prefix already stripped ('/ro/services/' →
 * '/services/'). lib/routes.ts' rows are the right shape for that comparison
 * and the wrong one for the anchor — hence `path` fed to matchesRoute in one
 * call and through localeHref in the other. No fallback is needed on the hook
 * any more: since D9 it is ours and it absorbs the no-router case itself,
 * always returning a path.
 */
export function useNavItems(): NavRoute[] {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();

  return primaryRoutes(locale).map((route) => ({
    href: localeHref(locale, route.path),
    label: t(route.key),
    active: matchesRoute(pathname, route.path),
  }));
}
