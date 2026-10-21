import path from 'node:path';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import sharp from 'sharp';
import type { Locale } from '@/i18n/locales';
import type { ImagePath } from '@/lib/image-path/image-path';
import {
  articlePost,
  articlePreview,
  articleWordsFrom,
  type ArticleWords,
} from './populate';

// app/[locale]/blog/[slug]/words.ts — the words of a blog article's page, in
// the page's language — the server half of ./populate.ts' seam. The mapping
// of keys to words is ./populate.ts' `articleWordsFrom`, which the
// Pages/BlogArticle twin calls too with `useTranslations`' translators, so
// the two cannot drift (../../page-twins.test.ts holds both to it). Two
// namespaces, like the list's: the article's own `blog` words and, from
// `common`, the site's carousel roledescriptions the gallery speaks.
//
// The language is a PARAMETER: ./page.tsx reads its [locale] segment, narrows
// it once with ./populate.ts' `articleLocale` and hands the same `Locale` to
// these two functions and to `populateArticle` (./populate.ts' ONE LANGUAGE,
// READ ONCE), so the article and the words around it are always one language.
// next-intl's request config lets the explicit locale win over the route's
// (i18n/request.ts, §15.16); on the page's own route the two are the same
// language anyway — an article is written in every language since
// 2026-10-15 (lib/blog-article's EVERY LANGUAGE, IN ONE FILE).

/** The page's words in `locale` — the route's language. */
export async function articleWords(locale: Locale): Promise<ArticleWords> {
  return articleWordsFrom(
    await getTranslations({ locale, namespace: 'blog' }),
    await getTranslations({ locale, namespace: 'common' }),
  );
}

/**
 * The tab's title in `locale`: „Cum îți alegi periuța de dinți — Premium
 * Smile" — the post's own title in that language, then the clinic, so no two
 * articles share a title and none is the bare site name (SC 2.4.2, the doctor
 * page's and the list's idiom). The description and the link-preview tags
 * are `articleMetadata`'s, below; hreflang and the canonical address stay the
 * SEO work of BACKLOG.md entry 10.
 * @throws RangeError naming the slug when no post has it (./populate.ts).
 */
export async function articleTitle(
  locale: Locale,
  slug: string,
): Promise<string> {
  const common = await getTranslations({ locale, namespace: 'common' });
  return `${articlePost(locale, slug).title} — ${common('siteName')}`;
}

/** The picture formats a preview card may name, by file extension — PARTIAL,
 *  so an extension it does not list reads `undefined` to the type checker
 *  too, and the card then names no type (2026-10-21, round 3 of the Opus
 *  reviews). */
const IMAGE_TYPES: Readonly<Partial<Record<string, string>>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * A picture's size in pixels, read off its file in public/ at BUILD time —
 * the size a preview card is told, so it can lay out the large card before
 * the picture arrives (a card told nothing may draw none the first time).
 * @throws Error naming the file when it cannot be read or has no size.
 */
async function pictureSize(
  src: ImagePath,
): Promise<Readonly<{ width: number; height: number }>> {
  const file = path.join(process.cwd(), 'public', src);
  const { width, height } = await sharp(file).metadata();
  if (!width || !height) {
    throw new Error(`blog article preview: ${file} has no pixel size`);
  }
  return { width, height };
}

/**
 * The article page's metadata in `locale`: the tab's title (`articleTitle`),
 * the post's summary as the description, and the LINK-PREVIEW TAGS a
 * messenger or a social network reads to draw the card when the page's
 * address is shared — Open Graph's and the large-picture Twitter/X card's:
 * the post's title, its summary, the page's address, and its cover
 * photograph — the article's first, largest picture — by its absolute
 * address, with its size, its type and, when it has one, its alt
 * (./populate.ts' THE PREVIEW). The owner, 2026-10-17: "if possible on share
 * to also preload the "hero" of the article and to display first large
 * picture and also title of it … this is a mandatory feature". Every address
 * is built on lib/site-origin's origin, so a preview points where the shared
 * link does.
 * @throws RangeError naming the slug when no post has it (./populate.ts).
 */
export async function articleMetadata(
  locale: Locale,
  slug: string,
): Promise<Metadata> {
  const preview = articlePreview(locale, slug);
  const common = await getTranslations({ locale, namespace: 'common' });
  const { width, height } = await pictureSize(preview.image.src);
  const type = IMAGE_TYPES[path.extname(preview.image.src).toLowerCase()];
  const alt = preview.image.alt === '' ? {} : { alt: preview.image.alt };
  return {
    title: await articleTitle(locale, slug),
    description: preview.description,
    openGraph: {
      type: 'article',
      siteName: common('siteName'),
      locale: preview.locale,
      alternateLocale: [...preview.alternateLocales],
      url: preview.url,
      title: preview.title,
      description: preview.description,
      publishedTime: preview.publishedTime,
      authors: [preview.author],
      tags: [...preview.tags],
      images: [
        {
          url: preview.image.url,
          width,
          height,
          ...(type === undefined ? {} : { type }),
          ...alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: preview.title,
      description: preview.description,
      images: [{ url: preview.image.url, ...alt }],
    },
  };
}
