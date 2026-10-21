import { describe, expect, it, vi } from 'vitest';
import { createTranslator } from 'next-intl';
import { locales } from '@/i18n/locales';
import { posts as SITE_POSTS, postsIn } from '@/lib/blog/blog';
import { heroSlides, type HeroSlideEntry } from '@/lib/hero-slides/hero-slides';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { postCard } from '../blog/populate';
import {
  blogCarouselWordsFrom,
  populateBlogCarousel,
  populateHero,
} from './populate';

// populate — the page's whole arithmetic for the Hero, tested without
// rendering anything (the services page's ./populate.test.ts shape). The
// function is pure and next-intl-free by design, so this suite needs no
// provider, no DOM and no mock beyond a spy standing in for the ICU sentence.
//   · against a FIXTURE — does the mapping do what it says? Ids and order
//     through untouched, the right language picked, every slide named
//     through the caller's formatter exactly once with a 1-based index.
//   · against the REAL list — does the page really hand the band the whole
//     ring? The count is lib/hero-slides' own, pinned in tests/unit/
//     hero-slides-data.test.ts; repeating it here pins that nothing is
//     filtered or sliced on the way.
// Beside the module it tests (the lib-foldering convention); it runs in the
// `components` project, a real Chromium — harmless for a pure function.

const FIXTURE: readonly HeroSlideEntry[] = [
  {
    id: 'lobby',
    picture: { src: '/images/hero/lobby.jpg' },
    words: {
      ro: { alt: 'Cabinet', title: 'O clinică modernă' },
      en: { alt: 'Room', title: 'A modern practice' },
      de: { alt: 'Raum', title: 'Eine moderne Klinik' },
      fr: { alt: 'Salle', title: 'Un cabinet moderne' },
      it: { alt: 'Sala', title: 'Uno studio moderno' },
    },
  },
  {
    id: 'treatment-room',
    picture: { src: '/images/hero/treatment-room.jpg' },
    words: {
      ro: { alt: 'Echipa', title: 'O echipă care ascultă' },
      en: { alt: 'Team', title: 'A team that listens' },
      de: { alt: 'Team', title: 'Ein Team, das zuhört' },
      fr: { alt: 'Équipe', title: 'Une équipe à l’écoute' },
      it: { alt: 'Team', title: 'Un team che ascolta' },
    },
  },
];

describe('populateHero — against a fixture', () => {
  it('passes ids, pictures and order through untouched', () => {
    const slides = populateHero('ro', () => 'x', FIXTURE);
    expect(slides.map((slide) => slide.id)).toEqual([
      'lobby',
      'treatment-room',
    ]);
    expect(slides.map((slide) => slide.src)).toEqual([
      '/images/hero/lobby.jpg',
      '/images/hero/treatment-room.jpg',
    ]);
  });

  it('picks every word in the requested language and no other', () => {
    const de = populateHero('de', () => 'x', FIXTURE);
    expect(de[0]).toMatchObject({
      alt: 'Raum',
      title: 'Eine moderne Klinik',
    });
    const ro = populateHero('ro', () => 'x', FIXTURE);
    expect(ro[1]).toMatchObject({
      alt: 'Echipa',
      title: 'O echipă care ascultă',
    });
  });

  it('names every slide through the formatter, once, 1-based, with the total', () => {
    const formatLabel = vi.fn(
      (index: number, total: number) => `Imaginea ${index} din ${total}`,
    );
    const slides = populateHero('ro', formatLabel, FIXTURE);
    expect(formatLabel.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
    expect(slides.map((slide) => slide.label)).toEqual([
      'Imaginea 1 din 2',
      'Imaginea 2 din 2',
    ]);
  });
});

describe('populateHero — against the real ring', () => {
  it('hands the band every slide lib/hero-slides holds, in its order', () => {
    const slides = populateHero('en', (index, total) => `${index}/${total}`);
    expect(slides).toHaveLength(heroSlides.length);
    expect(slides.map((slide) => slide.id)).toEqual(
      heroSlides.map((slide) => slide.id),
    );
    expect(slides.at(-1)?.label).toBe(
      `${heroSlides.length}/${heroSlides.length}`,
    );
  });
});

// ── THE ARTICLES BAND — the walk from the blog's posts to sections/
// BlogCarousel's props, and the ONE mapping of its words (./populate.ts' THE
// ARTICLES BAND). Against the REAL posts and the REAL message files: the band
// shows every post, newest first, as the blog's own card, and every word it
// says exists in the language it is said in.

describe('blogCarouselWordsFrom — the band’s words through the REAL messages', () => {
  const wordsIn = (locale: 'ro' | 'de') => {
    const messages = locale === 'ro' ? ro : de;
    return blogCarouselWordsFrom(
      createTranslator({ locale, messages, namespace: 'home' }),
      createTranslator({ locale, messages, namespace: 'blog' }),
      createTranslator({ locale, messages, namespace: 'common' }),
    );
  };

  it('speaks Romanian — the band’s own words, the cards’ blog words and the site’s carousel roles', () => {
    const words = wordsIn('ro');
    expect(words.eyebrow).toBe(ro.home.articles.eyebrow);
    expect(words.title).toBe(ro.home.articles.title);
    expect(words.region).toBe(ro.home.articles.region);
    expect(words.previous).toBe(ro.home.articles.previous);
    expect(words.next).toBe(ro.home.articles.next);
    expect(words.picker).toBe(ro.home.articles.picker);
    expect(words.role).toBe(ro.common.carousel.role);
    expect(words.slideRole).toBe(ro.common.carousel.slideRole);
    expect(words.tags).toBe(ro.blog.tags);
    expect(words.readMore).toBe(ro.blog.card.readMore);
    expect(words.slide(3, 12)).toBe('Articolul 3 din 12');
    expect(words.readingTime(4)).toBe('4 min de citit');
  });

  it('speaks German too — every sentence its own', () => {
    const words = wordsIn('de');
    expect(words.title).toBe(de.home.articles.title);
    expect(words.slide(3, 12)).toBe('Artikel 3 von 12');
    expect(words.readingTime(4)).toBe('4 Min. Lesezeit');
  });
});

describe('populateBlogCarousel — every post, newest first, as the blog’s own card', () => {
  const words = blogCarouselWordsFrom(
    createTranslator({ locale: 'ro', messages: ro, namespace: 'home' }),
    createTranslator({ locale: 'ro', messages: ro, namespace: 'blog' }),
    createTranslator({ locale: 'ro', messages: ro, namespace: 'common' }),
  );

  it.each(locales)(
    '%s: hands the band every post in that language, in the list’s order, each the card the blog’s list prints',
    (locale) => {
      const band = populateBlogCarousel(locale, words);
      const posts = postsIn(locale, SITE_POSTS);
      expect(band.posts).toEqual(
        posts.map((post) => postCard(locale, post, words.readingTime)),
      );
      expect(band.posts.map((card) => card.slug)).toEqual(
        posts.map((post) => post.slug),
      );
    },
  );

  it('names every card — and its progress dot — „Articolul n din N", in order', () => {
    const band = populateBlogCarousel('ro', words);
    const total = band.posts.length;
    expect(total).toBeGreaterThan(1);
    expect(band.slideLabels).toEqual(
      band.posts.map((_, index) => `Articolul ${index + 1} din ${total}`),
    );
  });

  it('hands the band its words and the carousel its six labels', () => {
    const band = populateBlogCarousel('ro', words);
    expect(band.eyebrow).toBe(ro.home.articles.eyebrow);
    expect(band.title).toBe(ro.home.articles.title);
    expect(band.labels).toEqual({
      region: ro.home.articles.region,
      role: ro.common.carousel.role,
      slideRole: ro.common.carousel.slideRole,
      previous: ro.home.articles.previous,
      next: ro.home.articles.next,
      picker: ro.home.articles.picker,
    });
    expect(band.tagsLabel).toBe(ro.blog.tags);
    expect(band.readMore).toBe(ro.blog.card.readMore);
  });

  it('walks the list it is handed — an empty blog hands the band no posts', () => {
    const band = populateBlogCarousel('ro', words, []);
    expect(band.posts).toEqual([]);
    expect(band.slideLabels).toEqual([]);
  });
});
