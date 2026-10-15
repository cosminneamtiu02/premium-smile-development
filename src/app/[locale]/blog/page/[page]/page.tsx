import type { Metadata } from 'next';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { PostList } from '@/components/sections/PostList/PostList';
import { numberedPages, parsePageParam } from '@/lib/blog/blog';
import { populateBlogPage } from '../../populate';
import { blogLocale, blogPageTitle, blogPageWords } from '../../words';

// /{locale}/blog/page/n/ — the blog's LATER PAGES (CLAUDE.md §15.39): the same
// two bands as page 1 — the list with its hero, then the map (../../page.tsx,
// whose header argues the design and why both repeat on every page), cut at
// six posts a page by lib/blog. The address follows the owner's reference
// (infiniswiss.com/blog/page2) with the site's own slashes, and page 1 stays
// at /{locale}/blog/ — the pager never links /page/1/.
//
// ── THE ROUTE IS BUILT BY MULTIPLICATION (the doctor pages' precedent,
// ../../../team/[slug]/page.tsx). Next runs a child segment's
// `generateStaticParams` once for each language the [locale] layout generated
// and merges the two, so `generateStaticParams` below returns the PAGE alone
// and the export writes every page in all five languages — /de/blog/page/2/,
// /fr/blog/page/2/, … . Naming the locale here would be a second spelling of
// the manifest (round 3, 2026-10-14: until then it named `locale: 'ro'` and
// only Romanian pages were written). The list it returns is never empty —
// `numberedPages` falls back to [1] for a blog of six posts or fewer, since
// the export refuses an empty result (lib/blog's PAGES paragraph) — and
// `dynamicParams = false` keeps any page it did not name from being guessed:
// `next dev` answers /de/blog/page/9/ with the 404, and a static host serves
// the 404 dispatcher for it (§5). `{ page }` is the one parameter the body
// reads off `params`; the language reaches it through ../../words.ts'
// `blogLocale`, like on page 1.

type Props = { params: Promise<{ locale: string; page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return numberedPages().map((page) => ({ page: String(page) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, page } = await params;
  const n = parsePageParam(page);
  return {
    title: await blogPageTitle(locale, n),
    // /{locale}/blog/page/1/ exists only for a blog of six posts or fewer and
    // repeats /{locale}/blog/ word for word (lib/blog's PAGES paragraph), so
    // it stays out of search (G2 typescript, 2026-10-14) — and BOTH halves
    // are written, because Next REPLACES the layout's whole `robots` value
    // instead of merging into it: with `index: false` alone, a NOINDEX
    // build's „noindex, nofollow" (the layout's) read „noindex" on this page
    // (measured on a NOINDEX build, 2026-10-14). No build may leave it more
    // open than its shell.
    ...(n === 1 ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function BlogNumberedPage({ params }: Props) {
  const { page } = await params;
  const locale = await blogLocale();
  return (
    <>
      <PostList
        {...populateBlogPage(
          locale,
          parsePageParam(page),
          await blogPageWords(locale),
        )}
      />
      <ClinicLocation scaled />
    </>
  );
}
