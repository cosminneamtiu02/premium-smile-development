import type { Metadata } from 'next';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { PostList } from '@/components/sections/PostList/PostList';
import { populateBlogPage } from './populate';
import { blogLocale, blogPageTitle, blogPageWords } from './words';

// /{locale}/blog/ — PAGE 1 of the blog's list (CLAUDE.md §15.39, the blog
// branch, 2026-10-11; reshaped in round 2, 2026-10-14): a centred hero — the
// page's <h1> over a three-line lead —, the articles as cards three to a row
// and six a page, the round previous/next arrows under the grid's right end,
// and the map under it all, the very band Home draws (the owner: "below all
// blog items on this page i want to have the map as it is reactive as an item
// now"). Page n lives at /{locale}/blog/page/n/ (./page/[page]/page.tsx), the
// same two bands. Every page is a complete document built ahead of time, and
// the pager's links are plain `<a href>`s, so moving between pages is a fresh
// page load (§15.13 — the owner: "on clicking next of navigation it just pulls
// whole compiled thing from server"). ./populate.ts turns lib/blog's posts
// into the band's props, ./words.ts reads the language and the words.
//
// THE HERO AND THE MAP ON EVERY PAGE OF THE LIST (the owner asked the planner
// to decide, round 2): the list's pages are one archive cut into pages, so
// they share one template — an <h1> on each (§9), and a visitor from a search
// can land on page 2 directly, where the hero still says where they are; the
// map is the closing band of every other page of the site, and the way to the
// clinic for a reader who arrived through an article. The map is `scaled`
// (§15.32): PostList wears THE BAND SCALE too, so on a laptop or a desktop the
// whole page grows and shrinks with the screen as one design, like Home.
//
// ── IN EVERY LANGUAGE (round 3, 2026-10-14 — the owner: "internationalise and
// add that blog on every language"). Every post carries its words in all five
// languages (lib/blog), so this page declares no `generateStaticParams` of its
// own: like the services, team and privacy pages it is written once for each
// language the [locale] layout generates — /ro/blog/, /en/blog/, /de/blog/,
// /fr/blog/ and /it/blog/ — and the language comes from the route, never from
// this file (./words.ts' ONE LANGUAGE, READ ONCE). Until round 3 it returned
// `locale: 'ro'`, which Next merged over each of the five and de-duplicated
// to one Romanian page.
//
// KEEP-IN-SYNC with ./Blog.stories.tsx: this is an async Server Component the
// browser runner cannot render, so the twin there mounts the same band through
// the same ./populate.ts with `useLocale`'s language and `useTranslations`'
// words, and its plays pin what it renders; ../page-twins.test.ts holds the
// two sources together.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await blogPageTitle(locale, 1) };
}

export default async function BlogPage() {
  const locale = await blogLocale();
  return (
    <>
      <PostList {...populateBlogPage(locale, 1, await blogPageWords(locale))} />
      <ClinicLocation scaled />
    </>
  );
}
