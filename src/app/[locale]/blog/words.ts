import { getTranslations } from 'next-intl/server';
import { BLOG_LOCALE } from '@/lib/blog/blog';
import { blogWordsFrom, type BlogPageWords } from './populate';

// app/[locale]/blog/words.ts — the words of a blog list page, read in the
// blog's one language (§5) — the server half of ./populate.ts' seam, shared by
// the two route pages (./page.tsx and ./page/[page]/page.tsx). The mapping of
// keys to words is ./populate.ts' `blogWordsFrom`, which the Pages/Blog twin
// calls too with `useTranslations`' translators, so the two cannot drift
// (../page-twins.test.ts holds both to it).
//
// The locale is passed EXPLICITLY: the blog exists in Romanian only, and
// next-intl's request config lets an explicit locale win over the route's
// (i18n/request.ts, §15.16).

export async function blogPageWords(): Promise<BlogPageWords> {
  return blogWordsFrom(
    await getTranslations({ locale: BLOG_LOCALE, namespace: 'blog' }),
    await getTranslations({ locale: BLOG_LOCALE, namespace: 'common' }),
  );
}

/**
 * The tab's title: „Articole și noutăți — Premium Smile" for page 1, and the
 * page number after the title for every later page, so no two pages share a
 * title (SC 2.4.2).
 */
export async function blogPageTitle(page: number): Promise<string> {
  const t = await getTranslations({ locale: BLOG_LOCALE, namespace: 'blog' });
  const common = await getTranslations({
    locale: BLOG_LOCALE,
    namespace: 'common',
  });
  const title =
    page === 1 ? t('title') : t('pageTitle', { title: t('title'), page });
  return `${title} — ${common('siteName')}`;
}
