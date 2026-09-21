import { describe, expect, it, vi } from 'vitest';
import { heroSlides, type HeroSlideEntry } from '@/lib/hero-slides/hero-slides';
import { populateHero } from './populate';

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
    id: 'calm',
    picture: { src: '/images/demo/hero-calm.jpg' },
    words: {
      ro: { alt: 'Cabinet', title: 'O clinică modernă' },
      en: { alt: 'Room', title: 'A modern practice' },
      de: { alt: 'Raum', title: 'Eine moderne Klinik' },
      fr: { alt: 'Salle', title: 'Un cabinet moderne' },
      it: { alt: 'Sala', title: 'Uno studio moderno' },
    },
  },
  {
    id: 'team',
    picture: { src: '/images/demo/hero-team.jpg' },
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
    expect(slides.map((slide) => slide.id)).toEqual(['calm', 'team']);
    expect(slides.map((slide) => slide.src)).toEqual([
      '/images/demo/hero-calm.jpg',
      '/images/demo/hero-team.jpg',
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
