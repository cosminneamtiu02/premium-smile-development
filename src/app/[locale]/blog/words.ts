import { getLocale, getTranslations } from 'next-intl/server';
import { isLocale, type Locale } from '@/i18n/locales';
import { blogWordsFrom, type BlogPageWords } from './populate';

// app/[locale]/blog/words.ts — the server half of ./populate.ts' seam, shared
// by the two route pages (./page.tsx and ./page/[page]/page.tsx): the ROUTE's
// language, and a list page's words in it (CLAUDE.md §15.39 round 3 — the
// blog in every language). The mapping of keys to words is ./populate.ts'
// `blogWordsFrom`, which the Pages/Blog twin calls too with `useTranslations`'
// translator, so the two cannot drift (../page-twins.test.ts holds both to
// it).
//
// ── ONE LANGUAGE, READ ONCE. A page body reads the route's language with
// `blogLocale` — `getLocale()`, which reads back what src/i18n/request.ts
// resolved from the [locale] segment (§15.16 Phase C: no `params` plumbing for
// the locale) — and hands that one value to both `blogPageWords` and
// ./populate.ts, so the posts and the words around them can never be in two
// languages. `isLocale` is the narrowing, not a guard against reality: next-
// intl hands back a plain `string`, lib/blog's words are a `Record<Locale, …>`,
// and request.ts falls back to the default locale for anything else, so the
// throw is unreachable on the built site (the services page's paragraph).
//
// ── THE TAB'S TITLE takes the locale as a PARAMETER instead: a metadata
// function is the standing exception to that rule, the layout's own and the
// 404 page's precedent (request.ts' header names it).

/** The route's language, narrowed to the five the site routes. */
export async function blogLocale(): Promise<Locale> {
  const locale = await getLocale();
  if (!isLocale(locale)) {
    throw new Error(`blog page: unknown locale "${locale}"`);
  }
  return locale;
}

/** A list page's words, in `locale` — the route's (`blogLocale`). */
export async function blogPageWords(locale: Locale): Promise<BlogPageWords> {
  return blogWordsFrom(await getTranslations({ locale, namespace: 'blog' }));
}

/**
 * The tab's title in `locale`: „Articole și noutăți — Premium Smile" for page
 * 1, and the page number after the title for every later page, so no two pages
 * share a title (SC 2.4.2).
 */
export async function blogPageTitle(
  locale: string,
  page: number,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'blog' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const title =
    page === 1 ? t('title') : t('pageTitle', { title: t('title'), page });
  return `${title} — ${common('siteName')}`;
}
