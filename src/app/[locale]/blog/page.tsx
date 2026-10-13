import type { Metadata } from 'next';
import { PostList } from '@/components/sections/PostList/PostList';
import { BLOG_LOCALE } from '@/lib/blog/blog';
import { populateBlogPage } from './populate';
import { blogPageTitle, blogPageWords } from './words';

// /ro/blog/ — PAGE 1 of the blog's list (CLAUDE.md §15.39, the blog branch,
// 2026-10-11): the owner's reference is infiniswiss.com/blog — a centred
// heading, five articles a page as cards, „Anterior · 1 / 3 · Următor" under
// them. Page n lives at /ro/blog/page/n/ (./page/[page]/page.tsx); every page
// is a complete document built ahead of time, and the pager's links are plain
// `<a href>`s, so moving between pages is a fresh page load (§15.13 — the
// owner: "on clicking next of navigation it just pulls whole compiled thing
// from server"). ./populate.ts turns lib/blog's posts into the band's props,
// ./words.ts reads the words.
//
// ── ROMANIAN ONLY (§5) — the stub's FOUR PHANTOM PAGES ARE GONE. This file
// sits under [locale], whose layout generates all five languages, so until
// today /en/blog/, /de/blog/, /fr/blog/ and /it/blog/ were exported too. A page
// may export its own `generateStaticParams`, and Next 16 runs it once for each
// language the layout generated and merges the result OVER that language
// (`{ ...parent, ...item }`, node_modules/next/dist/build/static-paths/app.js),
// then removes the duplicates (`filterUniqueParams`): returning `locale: 'ro'`
// every time leaves exactly one page, /ro/blog/. Returning NOTHING for the
// other four is not an option — under `output: 'export'` Next refuses an
// empty result (its build error E1454).
//
// KEEP-IN-SYNC with ./Blog.stories.tsx: this is an async Server Component the
// browser runner cannot render, so the twin there mounts the same band through
// the same ./populate.ts with `useTranslations`' words, and its plays pin what
// it renders; ../page-twins.test.ts holds the two sources together.

// No page beyond the ones named below is guessed — so `next dev` refuses
// /en/blog/ the way the export never writes it (G2 react, 2026-10-14).
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: BLOG_LOCALE }];
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: await blogPageTitle(1) };
}

export default async function BlogPage() {
  return <PostList {...populateBlogPage(1, await blogPageWords())} />;
}
