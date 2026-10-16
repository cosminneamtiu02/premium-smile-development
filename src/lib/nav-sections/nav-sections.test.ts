import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n/locales';
import { priceCategories } from '@/lib/prices/prices';
import { PRIMARY_ROUTES } from '@/lib/routes/routes';
import { doctors } from '@/lib/team/team';
import { navSections, SECTIONED_PATHS } from './nav-sections';

// lib/nav-sections — the top bar's dropdown entries (CLAUDE.md §15.40). The
// module is a walk over two data lists; what these tests hold is the CONTRACT
// the Header and the two target pages rely on: the right routes carry a
// dropdown, every entry's id is the id its page prints, every label is in the
// page's language, and nothing is invented or dropped on the way.

describe('nav-sections — which routes carry a dropdown', () => {
  it('names exactly Servicii and Echipa, both real primary routes', () => {
    const paths = PRIMARY_ROUTES.map((route) => route.path);
    expect([...SECTIONED_PATHS]).toEqual(['/services', '/team']);
    for (const path of SECTIONED_PATHS) expect(paths).toContain(path);
  });

  it('gives Acasă and Blog none (owner: "blog and home should not have this")', () => {
    const sections = navSections('ro');
    expect(Object.keys(sections).sort()).toEqual(['/services', '/team']);
    expect(sections).not.toHaveProperty('/');
    expect(sections).not.toHaveProperty('/blog');
  });
});

describe('nav-sections — the entries', () => {
  it.each(locales)(
    '%s: Servicii lists every price category, in the tariff’s order, by its own id and name',
    (locale) => {
      expect(navSections(locale)['/services']).toEqual(
        priceCategories.map((category) => ({
          id: category.id,
          label: category.name[locale],
        })),
      );
    },
  );

  it.each(locales)(
    '%s: Echipa lists every doctor, in the Team page’s order, by id and name',
    (locale) => {
      expect(navSections(locale)['/team']).toEqual(
        doctors.map((doctor) => ({
          id: doctor.id,
          label: doctor.words[locale].name,
        })),
      );
    },
  );

  it('prints ids a fragment can carry: unique, kebab-case, never the # itself', () => {
    for (const path of SECTIONED_PATHS) {
      const ids = navSections('ro')[path].map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('never prints an empty label in any language', () => {
    for (const locale of locales) {
      for (const path of SECTIONED_PATHS) {
        for (const section of navSections(locale)[path]) {
          expect(section.label.trim()).not.toBe('');
        }
      }
    }
  });
});
