import { afterEach, describe, expect, it, vi } from 'vitest';
import { listenForEscape, listenForPageExit } from './overlay-dismiss';

// Runs in the `components` project (real Chromium) because it listens on the
// real document and window — there is no React in the module, which is the
// point (CLAUDE.md §15.15's consolidation, fired by the top bar's dropdowns).

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const press = (key: string, target: EventTarget = document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

const pageEvent = (type: 'pagehide' | 'pageshow', persisted: boolean) =>
  window.dispatchEvent(new PageTransitionEvent(type, { persisted }));

describe('listenForEscape', () => {
  it('calls back on Escape pressed anywhere in the document', () => {
    const onEscape = vi.fn();
    cleanups.push(listenForEscape(onEscape));
    const inner = document.createElement('button');
    document.body.append(inner);
    press('Escape', inner);
    inner.remove();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('ignores every other key', () => {
    const onEscape = vi.fn();
    cleanups.push(listenForEscape(onEscape));
    for (const key of ['Enter', ' ', 'Tab', 'Esc', 'ArrowDown']) press(key);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('stops listening once its cleanup runs', () => {
    const onEscape = vi.fn();
    const stop = listenForEscape(onEscape);
    stop();
    press('Escape');
    expect(onEscape).not.toHaveBeenCalled();
  });
});

describe('listenForPageExit', () => {
  it('reports EVERY departure as a leave — persisted or not', () => {
    const onExit = vi.fn();
    cleanups.push(listenForPageExit(onExit));
    pageEvent('pagehide', false);
    pageEvent('pagehide', true);
    expect(onExit.mock.calls).toEqual([['leave'], ['leave']]);
  });

  it('reports a back/forward-cache restore, and only that, as a restore', () => {
    const onExit = vi.fn();
    cleanups.push(listenForPageExit(onExit));
    pageEvent('pageshow', false);
    expect(onExit).not.toHaveBeenCalled();
    pageEvent('pageshow', true);
    expect(onExit.mock.calls).toEqual([['restore']]);
  });

  it('stops listening once its cleanup runs', () => {
    const onExit = vi.fn();
    const stop = listenForPageExit(onExit);
    stop();
    pageEvent('pagehide', false);
    pageEvent('pageshow', true);
    expect(onExit).not.toHaveBeenCalled();
  });
});
