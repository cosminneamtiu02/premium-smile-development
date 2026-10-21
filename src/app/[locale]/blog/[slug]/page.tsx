import type { Metadata } from 'next';
import { PostPage } from '@/components/sections/PostPage/PostPage';
import { articles } from '@/lib/blog-article/blog-article';
import { articleLocale, populateArticle } from './populate';
import { articleMetadata, articleWords } from './words';

// /{locale}/blog/<slug>/ — ONE ARTICLE of the blog (CLAUDE.md §15.39 round 4,
// 2026-10-14; in every language since 2026-10-15). The owner, verbatim: "now
// i want also to have the individual blog page. the one with the articles. i
// have attatched an example of what i want aproximatloey. i want the heading
// centered. i wnat the "by x" where x is the doctor but in eyebrows style the
// 4 share buttons above the image in the top right as in example … the base
// article image bibg as in example. text and subheadings, so smaller headings
// of the articles and there will be another section like a carousell taht
// i'll implement later, for the moment jsut place a "placeholder" space … i
// will also want a section for some time of conclusion … and those pretty
// ,mmuch will be like the sections that will always be reused for the
// articles". His example is a real-estate blog's article: a centred title
// over „by …", a row with the share controls over a wide photograph, then a
// narrower column of paragraphs and small subheadings, and — his second
// screenshot — the closing quote over its author. The carousel came the same
// day ("for: Galeria foto vine în curând — place that caroussell"): the
// placeholder's place holds the gallery's cards.
//
// ONE BAND: sections/PostPage — the whole article, its header laying out the
// sections it composes — and then the shell's Footer. The map that closed the
// page from 2026-10-15, as it closes every page of the list (../page.tsx),
// LEFT the same day on the owner's word ("drop the map … the map at the
// bottom is to be completley dropped"): an article ends on its doctor's last
// word, and the Footer under it still carries the clinic's address, phone and
// hours on every page (§10.5). ./populate.ts turns the page's language, lib/
// blog's post, lib/blog-article's body, lib/share's addresses and lib/team's
// doctor into the band's props; ./words.ts reads the words. Every page is a
// complete document built ahead of time (§16): the article's words, its
// galleries' cards, its photos and their notes, the share links and the
// doctor are in the HTML. The scripts the article itself brings are the copy
// control's and each gallery carousel's — beside the small island ui/Image's
// optimizer brings with every picture (its ExportedImage is a client
// component), as on every page with a photograph, and the shell's own
// islands, the top bar's menus, the language switcher and the contact dialog
// among them (§16's list).
//
// ── ONE PAGE PER ARTICLE IN EVERY LANGUAGE, BUILT BY MULTIPLICATION (the
// doctor pages' precedent, ../../team/[slug]/page.tsx, and the list's
// numbered pages', ../page/[page]/page.tsx). Every article is written in all
// five languages (lib/blog-article's EVERY LANGUAGE, IN ONE FILE), and Next
// runs this segment's `generateStaticParams` once for each language the
// [locale] layout generated and merges the two, so the function below
// returns the SLUG alone and the export writes every article in all five —
// /ro/blog/<slug>/, /de/blog/<slug>/, … . Naming the locale here would be a
// second spelling of the manifest (until 2026-10-15 it named the one language
// the bodies were written in, and only Romanian pages were written). It names
// every article lib/blog-article ships — a post without a body gets no page
// (its card on the list opens the stand-in article meanwhile, lib/blog-
// article's THE STAND-IN) — and `dynamicParams = false`
// keeps any slug it did not name from being guessed: `next dev` answers it
// with the 404, and the export never writes it, so a static host serves the
// 404 dispatcher (§5). The list must never be EMPTY: under `output: 'export'`
// Next refuses an empty result by name (its build error E1454, „… returned an
// empty array from "generateStaticParams()" …"), so an article registry left
// empty fails the build — the folder goes with the last article.
//
// ── THE LANGUAGE, READ OFF THE ROUTE. The body and the metadata read the
// [locale] segment off `params`, beside the slug they need anyway, and narrow
// it once with ./populate.ts' `articleLocale` (a named error for anything
// else — unreachable on the built site, whose layout generates the five and
// no other); that one `Locale` then reaches the words, the post, the body,
// the doctor and the page's address alike (./populate.ts' ONE LANGUAGE, READ
// ONCE). The shell's language switcher and language banner keep a page's path
// across languages (CLAUDE.md §5): on an article they link the same article
// in the other language, which every language now has.
//
// KEEP-IN-SYNC with ./Article.stories.tsx: this is an async Server Component
// the browser runner cannot render, so the twin there mounts the same band
// through the same ./populate.ts with `useLocale`'s language and
// `useTranslations`' words, and its plays pin what it renders;
// ../../page-twins.test.ts holds the two sources together.

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  return articleMetadata(articleLocale(locale), slug);
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const language = articleLocale(locale);
  return (
    <PostPage
      {...populateArticle(language, slug, await articleWords(language))}
    />
  );
}
