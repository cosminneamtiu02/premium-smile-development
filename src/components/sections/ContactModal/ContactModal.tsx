'use client';

import { useId } from 'react';
import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button/Button';
import { Heading } from '@/components/ui/Heading/Heading';
import { Modal } from '@/components/ui/Modal/Modal';
import { Text } from '@/components/ui/Text/Text';
import { Phone } from '@/assets/glyphs/Phone';
import { clinic } from '@/lib/clinic';
import { useContactModal } from './useContactModal';

// sections/ContactModal — the panel itself: the site's one conversion goal
// (§1: the visitor calls the clinic) rendered as a dialog. Built to the
// owner-approved N2 composition contract, board
// .claude/plans/contact-modal-n2-contract.plan.md (2026-08-27), which picked
// exploration story 9 — a centred hero — and AMENDED by the owner on
// 2026-08-28 (chat) down to its three load-bearing lines: the title, the
// lead, the call control. The second label and the opening-hours block that
// the contract's D3 added under a hairline are gone; the Footer remains the
// one place on the site that prints the schedule (§10.5 puts it there for
// crawlers anyway), so nothing about the clinic's hours was lost, only its
// duplicate.
//
// ── NOT EXPORTED FOR PLACEMENT. ContactModalProvider renders this once, after
// its children (D1); consumers reach the dialog through ContactModalTrigger
// and useContactModal, never by placing it themselves. Two of them on a page
// would mean two focus returns and two scroll locks fighting over one visitor.
//
// ── WHAT THE ATOM ALREADY DOES, so this file does not (ui/Modal D1/D11/D13):
// the top layer, the inert page behind it, Escape, the focus return to
// whatever opened it, the scroll lock, the scrim and the backdrop press. This
// section supplies content, a name and the switch — nothing else.
//
// ── THE NEVER-SCROLL RULE, and how it is kept since the atom's rework
// (ui/Modal D16–D21, owner 2026-08-28). `scrollable={false}` is the whole of
// it: the atom then puts NO cap on the white box, so the box is exactly as
// tall as this composition and its body neither scrolls nor turns into a
// region with a tab stop. The visitor is never handed a card with a scrollbar
// down its middle. There is no `height` step either — a fixed height would
// reintroduce a box whose content can outgrow it, the same picture by another
// route. Since the 08-28 trim the box measures around 200px, so it is shorter
// than every viewport in the §7 set — including the 320×568 stress phone and
// the same phone held sideways (390px tall) — and the atom's full-viewport
// layer therefore has nothing to scroll either. The suite measures exactly
// that, in RO and DE.
//
// ── THE TITLE SITS IN THE BAR, CENTRED (owner, 2026-08-27, chat). It moved out
// of the body and into ui/Modal's `header` slot at the same RELATIVE position
// it had before — centred on the panel, not on the slot (the arithmetic is at
// the header prop below). Two things come with the move: the ~44px of empty
// bar the body-title layout paid for is reclaimed, so the panel is shorter at
// every width, and the dialog reads as a titled sheet rather than a poster.
// `aria-labelledby` is unaffected — the id travelled with the <h2>.
//
// ── THE READING ORDER IS THE ANSWER TO ONE QUESTION, in three lines and no
// more. „Probleme?" asks it, the lead says how to solve it, the green control
// does it. Everything is centred (the picture the owner picked) and the
// spacing is gap utilities only — the section owns the rhythm between its
// children, no atom carries an outer margin (§6.4).
//
// ── §8: every visible string is either t() from the `contact` namespace —
// which exists in all five message files, values authored by the owner — or
// data from lib/clinic.ts (§10.1: the same phone number the Footer prints and
// the JSON-LD will publish). Three keys carry the whole dialog now: heading,
// lead and close.
//
// 'use client' because the switch, the dialog's showModal() and the focus move
// are browser-time work (§16). The markup still pre-renders — closed, hidden,
// costing nothing until a trigger is pressed.

export function ContactModal(): ReactElement {
  const { isOpen, close } = useContactModal();
  const t = useTranslations('contact');
  // The <h2> below carries this id and the dialog points at it: one generated
  // string, so a page that ever renders the section twice (a story canvas
  // showing two states side by side) still names each dialog with its own
  // heading. useId is hydration-safe by construction — React generates the
  // same value on both sides (§16.2).
  const titleId = useId();

  return (
    <Modal
      open={isOpen}
      onClose={close}
      // md (32rem) — the middle step: a poster-shaped panel on a laptop, and
      // at 320px the same 288px card every step collapses to. NO `height`, see
      // the header note.
      width="md"
      // The owner's rule, in one prop (ui/Modal D16): the box is never capped,
      // so nothing inside this dialog ever scrolls — and at ~200px tall it is
      // shorter than every viewport this site is tested at, so the atom's
      // layer has nothing to scroll either (see the header note).
      scrollable={false}
      closeLabel={t('close')}
      aria-labelledby={titleId}
      // THE TITLE, in the atom's bar and centred on the PANEL — which is not
      // the same as centred in the slot, and the difference is the whole
      // reason this wrapper exists. ui/Modal's bar is
      // [slot flex-1][gap-3 = 12px][✕ size-11 = 44px], so the slot is 56px
      // narrower than the panel's content box and its centre sits 28px to the
      // inline-start of the panel's. `ps-14` (3.5rem = 56px) pads the
      // wrapper's content box on that side, moving ITS centre back by exactly
      // 56 / 2 = 28px — onto the panel's centre, i.e. the same relative
      // position the title had while it lived in the body.
      // Those two numbers are MIRRORED from ui/Modal's `barClasses` and the
      // ✕'s GlyphButton md size. If either ever changes, this padding follows;
      // it is recorded here rather than hidden so the coupling is findable
      // from both ends.
      // asChild so the ELEMENT is a real <h2> while the LOOK comes from the
      // atom (ui/Heading never picks a heading tag itself). h2 because the
      // page owns the one <h1> (§9: logical heading order) — a dialog summoned
      // from anywhere may not claim the document's top level. `text-center` on
      // the heading itself because the slot is `flex-wrap`: a long German
      // title wraps to two lines there, and both must stay centred.
      header={
        <div className="flex flex-1 justify-center ps-14">
          <Heading asChild>
            <h2 id={titleId} className="text-center">
              {t('heading')}
            </h2>
          </Heading>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* `text-center` PER PARAGRAPH, not once on the column: globals.css
            gives every <p> `text-align: start` in its base layer, and a
            declaration on the element beats a value inherited from the flex
            column — so a lead that wraps to two lines would sit ragged-left
            under a centred title. The Footer documents the same trap. §6.8:
            className is merged last by the atom, so this is a parent utility,
            never a restyle of ui/Text's internals. */}
        <Text className="text-center">{t('lead')}</Text>
        {/* THE ONE CONTROL. An <a href="tel:"> wearing Button's clothes: it
            NAVIGATES (the phone app opens), so it is an anchor, not a button
            (§9). The glyph is left and UNLABELLED — decorative, so the link's
            accessible name is exactly the visible number and SC 2.5.3 (Label
            in Name) holds by construction. E.164 in the href, the human
            format on screen: two fields of lib/clinic.ts on purpose (§10.1).
            `size="lg"` is a 3.5rem target, well past §9's 44px aim for the
            primary action, and the column's `items-center` keeps the control
            at its OWN width — a stretched green bar was the other candidate
            and is not what the owner picked. */}
        <Button asChild variant="solid" size="lg">
          <a href={`tel:${clinic.phone}`}>
            <Phone />
            {clinic.phoneDisplay}
          </a>
        </Button>
      </div>
    </Modal>
  );
}
