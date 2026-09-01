import { createContext, useContext } from 'react';

// sections/ContactModal — the context and its hook: the ONE switch every
// opener on the page shares (owner-approved N2 composition contract, board
// .claude/plans/contact-modal-n2-contract.plan.md, D1).
//
// ── WHY A CONTEXT AT ALL, in a repo that has none yet.
// §14 says the contact "page" is a modal with no route of its own, reachable
// from the Header's Contact button, the NavMenu panel's Contact item and any
// future in-content call to action (never the fixed corner disc — board
// D8/Q5 keeps that a direct tel: link). Each of those is a different place in
// the tree, and all of them must open the SAME dialog: one <dialog> element
// per document, one focus return, one scroll lock. Passing an `open` boolean down from the shell would
// mean threading it through every section in between; a context passes it
// straight to the openers that ask for it, and nothing else re-renders.
//
// ── WHY THE CONTEXT LIVES HERE and not in the provider file.
// ContactModalProvider renders <ContactModal />, and ContactModal reads the
// context — so a context created in the provider's own module would make those
// two files import each other in a circle. This module imports nothing of the
// section's, which breaks the ring: the provider, the dialog and the trigger
// all depend on it, and it depends on none of them.
//
// ── NO 'use client' HERE, deliberately. This module renders nothing; it is
// pulled into the client graph by its three importers, which all carry the
// directive themselves. A Server Component reaching for it would fail loudly
// at build time ("createContext is not supported in Server Components") —
// which is the honest outcome for code that asks a server-rendered tree for a
// browser-time switch (§16).

export interface ContactModalContextValue {
  /** Whether the one dialog is currently showing. */
  isOpen: boolean;
  /** Show it. Stable across renders, so memoised openers never churn. */
  open: () => void;
  /** Hide it. The same stability guarantee. */
  close: () => void;
}

/**
 * `null` as the empty value, never a working-looking default: a default object
 * would let a trigger rendered outside the provider look fine, do nothing when
 * pressed, and leave no trace of why (the hook below turns that into a throw).
 */
const ContactModalContext = createContext<ContactModalContextValue | null>(
  null,
);

export { ContactModalContext };

/**
 * Read the shared switch. Throws — with the provider's name in the message —
 * when it is called outside a `<ContactModalProvider>`, because the only fix
 * is to wrap the tree in one, and a silent no-op button would send the reader
 * looking anywhere but there.
 */
export function useContactModal(): ContactModalContextValue {
  const value = useContext(ContactModalContext);
  if (!value) {
    throw new Error(
      'useContactModal must be used inside a <ContactModalProvider>. ' +
        'The shell wraps the page in one, and it renders the single ' +
        '<ContactModal /> itself — add the provider around the tree that ' +
        'holds this opener.',
    );
  }
  return value;
}
