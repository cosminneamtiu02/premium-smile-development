'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ContactModal } from './ContactModal';
import { ContactModalContext } from './useContactModal';

// sections/ContactModal — the provider: the ONE `open` boolean of the site's
// one dialog, and the place that dialog is rendered (owner-approved N2
// composition contract, board .claude/plans/contact-modal-n2-contract.plan.md,
// D1).
//
// ── ONE DIALOG PER DOCUMENT, however many openers. The provider renders its
// children untouched and then <ContactModal /> ONCE, after them. That single
// placement is the whole point: the Header's Contact button, the NavMenu
// panel's Contact item and any future in-content call to action all flip the
// same switch, so there is one <dialog> element, one focus return and one
// scroll lock on the page — never three modals racing to open. The fixed
// corner disc is NOT one of them: by contract (board D8/Q5) it stays a direct
// tel: link.
//
// ── WHY IT RENDERS LAST, after {children}. The dialog is the platform's own
// top-layer element (ui/Modal D1/D13), so paint order does not decide what is
// on top — but DOM order still decides where the closed markup sits, and
// putting it after the page content keeps it out of every landmark and out of
// the reading order until it opens. It also means the shell can wrap the whole
// document in this provider without changing a single existing box: children
// come out exactly as they went in.
//
// ── 'use client' IS A NECESSITY, NOT A PREFERENCE (§16). This component owns
// the one piece of visitor-dependent state on the page — whether the dialog is
// showing — and useState only exists in the browser. The rest of the shell
// stays inert HTML: what hydrates is this island and the openers, and the
// dialog's own markup pre-renders CLOSED (hidden by the globals'
// `dialog:not([open])` rule), costing nothing until someone presses a trigger.
// §16.2's hydration-safety rule is satisfied by construction: `defaultOpen` is
// a prop, not a cookie or a browser reading, so the server and client agree on
// the first render.

export interface ContactModalProviderProps {
  /** The tree that may hold openers — rendered untouched, before the dialog. */
  children: ReactNode;
  /**
   * Start with the dialog already showing. STORIES AND TESTS ONLY: a page that
   * opened a modal on arrival would trap a visitor who came for the content
   * (and hide the very page they landed on). The shipped shell never sets it.
   * @default false
   */
  defaultOpen?: boolean;
}

export function ContactModalProvider({
  children,
  defaultOpen = false,
}: ContactModalProviderProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Stable identities: the callbacks are created once and never change. What
  // that buys is NOT fewer renders — every useContactModal() consumer
  // re-renders on each open and close, because `isOpen` lives in the context
  // VALUE and the value is new each time (the suite's stable-callbacks test
  // depends on exactly that re-render happening). It buys correct DEPENDENCY
  // CHAINS: a consumer may put `open`/`close` in a useCallback or useEffect
  // dependency array without that effect re-running on every dialog state
  // change. If render isolation is ever needed, the lever is splitting this
  // into two contexts — actions (stable forever) and state — not memoising
  // harder here. The setter form takes no dependency on the current value,
  // which is what lets the arrays stay empty.
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // The VALUE changes on every open/close (it carries isOpen), the callbacks
  // inside it do not — useMemo is what keeps that promise across the renders
  // where only a parent re-rendered.
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    // React 19's context-as-provider — `<Context value={…}>`, no `.Provider`
    // ceremony, the same generation of API changes that made `ref` a regular
    // prop (§6.8).
    <ContactModalContext value={value}>
      {children}
      <ContactModal />
    </ContactModalContext>
  );
}
