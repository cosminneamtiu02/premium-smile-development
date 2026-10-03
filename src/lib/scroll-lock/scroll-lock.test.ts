import { afterEach, describe, expect, it } from 'vitest';
import { lockScroll } from './scroll-lock';

// Runs in the `components` project (real chromium, vitest.config.ts) because it
// touches document.documentElement — there is no React in here at all, which is
// exactly the point of a plain helper module (contract board D7 → A).

const root = document.documentElement;

afterEach(() => {
  root.style.overflow = '';
});

describe('lockScroll — save, hide, restore', () => {
  it('hides the document scrollbar while locked', () => {
    lockScroll();
    expect(root.style.overflow).toBe('hidden');
  });

  it('restores the value it found (empty = the stylesheet decides again)', () => {
    const unlock = lockScroll();
    unlock();
    expect(root.style.overflow).toBe('');
  });

  it('restores a PRE-EXISTING inline value instead of clearing it', () => {
    root.style.overflow = 'scroll';
    const unlock = lockScroll();
    expect(root.style.overflow).toBe('hidden');
    unlock();
    expect(root.style.overflow).toBe('scroll');
  });

  it('is LIFO-safe: the inner unlock restores the OUTER lock, not the page', () => {
    // The real scenario (board D7): the mobile menu is open and holds a lock,
    // and the modal opens from a button inside it. Whoever unlocks first must
    // never un-freeze the page for the one still open.
    const unlockOuter = lockScroll();
    const unlockInner = lockScroll();
    unlockInner();
    expect(root.style.overflow).toBe('hidden');
    unlockOuter();
    expect(root.style.overflow).toBe('');
  });

  it('ignores a second call to the same unlock (never clobbers a newer lock)', () => {
    const unlockOuter = lockScroll();
    unlockOuter();
    const unlockInner = lockScroll();
    unlockOuter();
    expect(root.style.overflow).toBe('hidden');
    unlockInner();
    expect(root.style.overflow).toBe('');
  });
});
