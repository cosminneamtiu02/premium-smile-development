'use client';

import type { MouseEvent, ReactElement } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button/Button';
import { useContactModal } from './useContactModal';

// sections/ContactModal — the opener (owner-approved N2 composition contract,
// board .claude/plans/contact-modal-n2-contract.plan.md, D1).
//
// A ui/Button whose press flips the shared switch, and NOTHING else: it holds
// no state, renders no dialog and knows nothing about what the panel contains.
// That is what lets the Header's Contact button, the NavMenu panel's Contact
// item and any future in-content call to action each render one of these while
// the page still has exactly ONE dialog (the provider renders it). The fixed
// corner disc is deliberately NOT in that list: by contract (board D8/Q5) it
// stays a direct tel: link and never becomes a trigger.
//
// ── §8.1 HOLDS HERE TOO, at the section tier that is allowed to call t():
// this file does not. The LABEL is the consumer's, passed as children — the
// Header will hand it t('actions.contact'), the string it already shows on its
// interim phone link — so no new message key exists for a control whose word
// depends entirely on where it sits. Nothing Romanian lives in this file.
//
// ── WHY `asChild` AND `aria-haspopup` ARE OMITTED FROM THE PROPS. ui/Button's
// asChild turns some other element into the button; an opener must be a real
// <button>, because it performs an action in place rather than going anywhere
// (§9: real <button>/<a href>, never the wrong one wearing the other's
// clothes). Making that a TYPE error rather than a review note is the §6.3
// pattern applied to a behaviour instead of a name — and the props ORDER below
// is the other half of it: `{...rest}` is spread FIRST and the owned props are
// written after it, so a spread object (`{...someProps}`, which the compiler
// checks loosely) cannot smuggle `asChild` or a different popup token past
// them. Written the other way round, the type ban holds only for callers who
// spell the prop out literally.
//
// 'use client': it attaches a click handler and reads a context, both of which
// exist only in the browser (§16).

export type ContactModalTriggerProps = Omit<
  ButtonProps,
  'asChild' | 'aria-haspopup'
>;

export function ContactModalTrigger({
  onClick,
  children,
  ...rest
}: ContactModalTriggerProps): ReactElement {
  const { open } = useContactModal();

  return (
    <Button
      {...rest}
      // Owned props LAST — see the header note: this is what makes the ban
      // above unbypassable, not a style preference.
      asChild={false}
      // aria-haspopup="dialog" declares WHAT the press summons. How (or
      // whether) a given screen reader verbalizes the token varies — it is
      // valid ARIA 1.2, not a guaranteed announcement — so it is a hint, and
      // the reliable signal remains the platform's own: showModal() moves
      // focus into a dialog the browser exposes as modal, which every screen
      // reader announces. It is not aria-expanded: that belongs to a
      // disclosure whose content lives next to the control (NavMenu's burger);
      // a modal replaces the page's focus context instead.
      aria-haspopup="dialog"
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        // The consumer's handler is called before the switch flips, and is
        // never swallowed: a page may want to do something of its own on the
        // same press and should not have to choose. The ORDER is not
        // observable from the outside — React batches the state update, so the
        // dialog is not open yet inside either callback — so it is documented
        // intent rather than a tested contract. Nothing here reads the event
        // afterwards, so even a stopPropagation() in there leaves the opening
        // intact: the switch is ours, not the DOM's.
        onClick?.(event);
        open();
      }}
    >
      {children}
    </Button>
  );
}
