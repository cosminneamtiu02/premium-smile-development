import type { Metadata } from 'next';
import { PostList } from '@/components/sections/PostList/PostList';
import { BLOG_LOCALE, numberedPages, parsePageParam } from '@/lib/blog/blog';
import { populateBlogPage } from '../../populate';
import { blogPageTitle, blogPageWords } from '../../words';

// /ro/blog/page/n/ — the blog's LATER PAGES (CLAUDE.md §15.39): the same band
// as page 1 (../../page.tsx, whose header argues the design), cut at five
// posts a page by lib/blog. The address follows the owner's reference
// (infiniswiss.com/blog/page2) with the site's own slashes, and page 1 stays
// at /ro/blog/ — the pager never links /page/1/.
//
// `generateStaticParams` names every page with `locale: 'ro'`, which Next
// merges OVER each language the layout generated and then de-duplicates
// (../../page.tsx's ROMANIAN ONLY paragraph): only Romanian pages are written.
// The list it returns is never empty — `numberedPages` falls back to [1] for a
// blog of five posts or fewer, since the export refuses an empty result
// (lib/blog's PAGES paragraph) — and `dynamicParams = false` keeps any page it
// did not name from being guessed: a static host serves the 404 dispatcher
// for /ro/blog/page/9/ (§5).

type Props = { params: Promise<{ locale: string; page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return numberedPages().map((page) => ({
    locale: BLOG_LOCALE,
    page: String(page),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const n = parsePageParam(page);
  return {
    title: await blogPageTitle(n),
    // /ro/blog/page/1/ exists only for a blog of five posts or fewer and
    // repeats /ro/blog/ word for word (lib/blog's PAGES paragraph), so it
    // stays out of search (G2 typescript, 2026-10-14).
    ...(n === 1 ? { robots: { index: false } } : {}),
  };
}

export default async function BlogNumberedPage({ params }: Props) {
  const { page } = await params;
  return (
    <PostList
      {...populateBlogPage(parsePageParam(page), await blogPageWords())}
    />
  );
}
