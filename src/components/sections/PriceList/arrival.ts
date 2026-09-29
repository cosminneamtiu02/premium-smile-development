// sections/PriceList/arrival — THE KEYBOARD'S STAMP, as three constants: the
// data attribute the band's island writes on a category card the KEYBOARD
// jumped to, and the one value it carries. No React, no JSX, no directive and
// no import — and that emptiness is the whole reason this is a file of its own.
//
// ── WHAT THE STAMP IS FOR (owner 2026-09-29: "when you click on the menu om an
// item, it takes you to the item, but it also highlights it with a dark
// border. not the shadow, but a dark border. i want that removed."). A card a
// pointer jumped to wears no focus ring; a card the keyboard jumped to keeps
// it, because the ring is the only thing that tells a keyboard visitor where
// focus went. The browsers cannot be asked which arrival it was — WebKit
// counts a mouse press on a menu link as a `:focus-visible` arrival, which is
// the very ring the owner saw — so the island tells the two apart itself and
// stamps the keyboard's (PriceMenu.tsx's THE RING IS THE KEYBOARD'S), and the
// card's own class hides the ring wherever the stamp is absent
// (CategoryCard.tsx's paragraph of the same name).
//
// ── WHY A FILE OF ITS OWN. Those two readers sit on the two sides of the
// band's one client boundary: the CLASS that answers the attribute lives in
// CategoryCard.tsx, a server component, and the WRITE lives in ./PriceMenu,
// the island. Neither can host the pair for the other. A value the island
// imported from CategoryCard.tsx would pull that whole module — the card, its
// heading, its rows — into the client graph; a value exported by the island
// reaches a server component as a client reference, not as the string it was
// (PriceList.tsx's ONE ISLAND, THE MENU CARD, on PRICE_MENU_ID — the same
// reason, met once before). So the pair lives in a third module that is
// neither: plain constants, the same bytes on both sides of the boundary, the
// attribute spelled once. CategoryCard ties its class to them with a
// `satisfies` (ui/Card's idiom for CARD_CURRENT_ATTRIBUTE: Tailwind reads
// class names from source text, so the class must stay a literal, and the
// compiler keeps the literal honest); PriceMenu writes them.

/** The data attribute's own key, the form Tailwind's `data-[…]` variant
 *  spells (`not-data-[arrival=keyboard]:…`). */
export const ARRIVAL_KEY = 'arrival';

/** The attribute the island stamps on a card the KEYBOARD jumped to. */
export const ARRIVAL_ATTRIBUTE = `data-${ARRIVAL_KEY}` as const;

/** Its one value. */
export const ARRIVAL_BY_KEYBOARD = 'keyboard';
