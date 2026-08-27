import { useState } from 'react';
import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Phone } from '@/assets/glyphs/Phone';
import { Button } from '../Button/Button';
import { GlyphButton } from '../GlyphButton/GlyphButton';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';
import { TextButton } from '../TextButton/TextButton';
import { Modal, type ModalProps } from './Modal';

// The thirteen stories ARE the declared visual manifest for this lane (contract
// board .claude/plans/modal-atom-contract.plan.md §2/§4, owner-approved
// fb-261), so the export NAMES are load-bearing: renaming one renames its
// baseline file. Four carry the 'stress-320' tag, which makes the visual net
// also sample them at the 320px accessibility width (§13 UI-tier opt-in) —
// the phone rendering is this atom's headline adaptability proof, since a 320px
// viewport leaves the md panel exactly 288px wide.
//
// EVERY story except OpenAndClose starts OPEN: an open modal is what the a11y
// addon must audit and what the snapshot must photograph. They open through one
// small demo host (below) because the atom is CONTROLLED by contract (D11) —
// it never flips its own state, so a story without a host would be a picture of
// a permanently frozen panel that no ✕ could close.
//
// Copy is Romanian with diacritics (§15.7) and strictly factual — no
// superlatives, no promotions, no result guarantees (CMSR advertising rules for
// dental practices, in force since 2025-07-01). DE-longest and pseudo-locale
// are the dedicated stress variants. Nothing here calls t(): stories pass
// finished strings exactly as a section will (§8.1), `closeLabel` included —
// it is required and has no default (D10 → B).
//
// The stories compose OTHER ATOMS (Heading, Text, Button, TextButton,
// GlyphButton, the Phone glyph) — legal and deliberate: an atom story may
// compose atoms, it may never import a section (§4 dependency direction). That
// is why AboveTheShell builds STAND-INS for the shell's fixed layers instead of
// importing Header/FloatingActions.

/**
 * The consumer in miniature: the parent owns the switch, hands `open` down and
 * listens for `onClose` (D11/D15). The trigger stays visible behind the modal
 * so the canvas can reopen it after a close — the only way to exercise the ✕,
 * Esc and the backdrop by hand from a story.
 */
function ModalDemo({
  initialOpen = true,
  ...props
}: ModalProps & { initialOpen?: boolean }): ReactElement {
  const [open, setOpen] = useState(initialOpen);
  // The story's own `open`/`onClose` args ride in through `props` and are
  // overridden right here — the switch belongs to this host, not to the args.
  return (
    <>
      <Button onClick={() => setOpen(true)}>Deschide modalul</Button>
      <Modal {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const DEFAULT_TITLE_ID = 'modal-story-default-title';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  args: {
    open: true,
    onClose: () => {},
    closeLabel: 'Închide',
    width: 'md',
    height: 'auto',
    dimBackdrop: true,
    closeOnBackdropClick: true,
    'aria-labelledby': DEFAULT_TITLE_ID,
    header: (
      <Heading asChild>
        <h2 id={DEFAULT_TITLE_ID}>Programează o consultație</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>
          Sunați la clinică în timpul programului: Luni – Vineri, 09:00 – 19:00.
        </Text>
        <Text>Strada Exemplu nr. 1, București.</Text>
      </div>
    ),
  },
  argTypes: {
    open: {
      control: false,
      description:
        'Controlled visibility: true → showModal(), false → close(). The demo host owns it in the canvas — the atom never flips its own state (D11)',
    },
    onClose: {
      control: false,
      description:
        'Fires EXACTLY ONCE per close, whichever path took it — the ✕, Esc, or a press on the backdrop. The parent sets `open` to false in response',
    },
    header: {
      control: false,
      description:
        'The top bar’s populable region, left of the ✕: any aligned elements — a heading, a glyph + heading, a secondary control. Omitted → the bar still renders, ✕ only (see NoHeader)',
    },
    children: {
      control: false,
      description:
        'The content container — scrolls internally when the panel hits its height cap (see FixedHeightScrolling)',
    },
    width: {
      control: 'radio',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description:
        'Panel width cap, rem-based; fluid below it (viewport minus 1rem margins). sm 24rem · md 32rem · lg 42rem · xl 56rem · full = the whole viewport minus margins',
    },
    height: {
      control: 'radio',
      options: ['auto', 'sm', 'md', 'lg', 'full'],
      description:
        'auto = fits content (capped by the viewport); sm 20rem · md 28rem · lg 36rem fixed, each still capped; full fills the viewport minus margins',
    },
    dimBackdrop: {
      control: 'boolean',
      description:
        'Paint the LOCKED scrim (--color-scrim, black 0.55 — the same token as the mobile menu’s sheet) behind the panel',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description:
        'A pointer press that starts AND ends on the backdrop closes the modal. Esc closes regardless of this flag — the keyboard exit is never optional',
    },
    closeLabel: {
      control: 'text',
      description:
        "REQUIRED, no default — the ✕’s spoken name (§6.3): already-translated text from whoever renders the modal (a section passes t('close'), a story its fixture). Nothing Romanian lives inside the atom (D10 → B)",
    },
    initialFocusRef: {
      control: false,
      description:
        'The element that receives focus when the modal opens — e.g. the phone link in ContactModal. Absent → the dialog itself (the name is announced, no control shows a ring)',
    },
    className: {
      control: false,
      description:
        'Merged LAST onto the root <dialog> = the panel itself (§6.8, D9) — placement and one-off sizing, never restyling the internals',
    },
  },
  render: ({ ...args }) => <ModalDemo {...args} />,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default panel: md width, height from the content. At 1280 it sits at its
 * 32rem cap with 1.5rem padding (@md); at 320 it is 288px wide with 1rem
 * padding — the same component, no media query anywhere (§6.5).
 */
export const Default: Story = {
  tags: ['stress-320'],
};

/** The smallest step (24rem): a one-line acknowledgement, nothing more. */
export const Compact: Story = {
  args: {
    width: 'sm',
    'aria-labelledby': 'modal-story-compact-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-compact-title">Număr copiat</h2>
      </Heading>
    ),
    children: (
      <Text>Numărul de telefon a fost copiat în memoria dispozitivului.</Text>
    ),
  },
};

/**
 * 42rem — the step where @2xl fires and the padding reaches 2rem. The hours
 * ride in a description list, the shape the Footer already uses for them.
 */
export const Wide: Story = {
  args: {
    width: 'lg',
    'aria-labelledby': 'modal-story-wide-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-wide-title">Program și localizare</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-4">
        <Text>
          Cabinetul lucrează cu programare. Sunați în timpul programului pentru
          o consultație sau pentru informații despre tratamentele efectuate.
        </Text>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <Text as="dt">Luni – Joi</Text>
          <Text as="dd">09:00 – 19:00</Text>
          <Text as="dt">Vineri</Text>
          <Text as="dd">09:00 – 17:00</Text>
          <Text as="dt">Sâmbătă</Text>
          <Text as="dd" tone="muted">
            Închis
          </Text>
          <Text as="dt">Duminică</Text>
          <Text as="dd" tone="muted">
            Închis
          </Text>
        </dl>
        <Text tone="muted">
          Strada Exemplu nr. 1, București. Accesul se face din curtea
          interioară.
        </Text>
      </div>
    ),
  },
};

/** 56rem — the widest capped step, for content that needs room to breathe. */
export const ExtraLarge: Story = {
  args: {
    width: 'xl',
    'aria-labelledby': 'modal-story-xl-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-xl-title">Informații despre tratamente</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>
          Consultația inițială include examinarea clinică și discutarea
          opțiunilor de tratament. Durata estimată este de 30 – 45 de minute.
        </Text>
        <Text>
          Igienizarea profesională se realizează cu ultrasunete și air-flow.
          Recomandarea privind frecvența se stabilește la consultație.
        </Text>
        <Text tone="muted">
          Costurile și etapele fiecărui tratament se comunică înainte de
          începerea acestuia.
        </Text>
      </div>
    ),
  },
};

/** Both steps at their maximum: the panel fills the viewport minus its margins. */
export const FullScreen: Story = {
  args: {
    width: 'full',
    height: 'full',
    'aria-labelledby': 'modal-story-full-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-full-title">Formular de contact telefonic</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>
          Sunați la clinică în timpul programului: Luni – Vineri, 09:00 – 19:00.
        </Text>
        <Text tone="muted">
          În afara programului, lăsați un mesaj și veți fi contactat în
          următoarea zi lucrătoare.
        </Text>
      </div>
    ),
  },
};

/**
 * The fixed-height case: the CONTENT scrolls inside the panel while the top bar
 * and the ✕ stay exactly where they were — the reason the bar and the body are
 * two containers instead of one scrolling box.
 */
export const FixedHeightScrolling: Story = {
  tags: ['stress-320'],
  args: {
    width: 'md',
    height: 'md',
    'aria-labelledby': 'modal-story-scroll-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-scroll-title">Pregătirea pentru consultație</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>
          Aduceți documentele medicale anterioare, dacă există: radiografii,
          scrisori medicale, lista tratamentelor efectuate.
        </Text>
        <Text>
          Anunțați medicul dacă urmați un tratament medicamentos sau dacă aveți
          alergii cunoscute.
        </Text>
        <Text>
          Consultația inițială include examinarea clinică și discutarea
          opțiunilor de tratament. Durata estimată este de 30 – 45 de minute.
        </Text>
        <Text>
          Igienizarea profesională se realizează cu ultrasunete și air-flow;
          frecvența se stabilește împreună cu medicul.
        </Text>
        <Text>
          Pentru copii, prima vizită este una de acomodare: examinare, sfaturi
          de igienă și, dacă este cazul, programarea unui tratament.
        </Text>
        <Text>
          Programările se pot muta telefonic cu cel puțin 24 de ore înainte.
        </Text>
        <Text tone="muted">
          Strada Exemplu nr. 1, București. Accesul se face din curtea
          interioară, etajul 1.
        </Text>
      </div>
    ),
  },
};

/**
 * No `header` at all: the bar still renders, with the ✕ alone at its usual
 * corner, and the dialog takes its name from `aria-label` instead of a heading.
 */
export const NoHeader: Story = {
  args: {
    header: undefined,
    'aria-labelledby': undefined,
    'aria-label': 'Contact',
    children: (
      <div className="flex flex-col gap-3">
        <Text>Telefon: 0721 000 000</Text>
        <Text tone="muted">Luni – Vineri, 09:00 – 19:00.</Text>
      </div>
    ),
  },
};

/**
 * The slot holding more than a heading: a glyph, the title and an interactive
 * control — which sits BEFORE the ✕ in DOM order, so it is also first in Tab
 * order. The ✕ never leaves its corner, however the slot wraps.
 */
export const HeaderWithActions: Story = {
  args: {
    'aria-labelledby': 'modal-story-actions-title',
    header: (
      <>
        <Phone size="sm" className="text-ink-muted" />
        <Heading asChild>
          <h2 id="modal-story-actions-title">Contactați clinica</h2>
        </Heading>
        <TextButton>Copiază numărul</TextButton>
      </>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>Telefon: 0721 000 000</Text>
        <Text tone="muted">
          Apelurile primite în afara programului sunt returnate în ziua
          lucrătoare următoare.
        </Text>
      </div>
    ),
  },
};

/**
 * `dimBackdrop={false}`: the page stays lit behind the panel. This is the case
 * the border and `shadow-xl` exist for — without them a white panel would melt
 * into the off-white page.
 */
export const Undimmed: Story = {
  args: {
    dimBackdrop: false,
    'aria-labelledby': 'modal-story-undimmed-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-undimmed-title">Fără estompare</h2>
      </Heading>
    ),
    children: (
      <Text>
        Fundalul rămâne vizibil, însă pagina nu poate fi folosită cât timp
        fereastra este deschisă.
      </Text>
    ),
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col items-start gap-3">
        <Heading asChild>
          <h2>Pagina din spate</h2>
        </Heading>
        <Text>
          Cabinetul lucrează cu programare. Sunați în timpul programului pentru
          o consultație sau pentru informații despre tratamentele efectuate.
        </Text>
        <Text tone="muted">
          Strada Exemplu nr. 1, București. Luni – Vineri, 09:00 – 19:00.
        </Text>
        <Story />
      </div>
    ),
  ],
};

/**
 * D13, made visible: STAND-INS for the shell's fixed layers, carrying the real
 * z-map numbers — the top bar at z-50, the call disc and the language pill at
 * z-40 — with the modal open over all three. `showModal()` puts the dialog in
 * the TOP LAYER, which no z-index on the page can out-bid, so the atom itself
 * carries no z-* class at all. Stand-ins, never the real sections: a UI story
 * may compose atoms and nothing above them (§4).
 */
export const AboveTheShell: Story = {
  args: {
    'aria-labelledby': 'modal-story-shell-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-shell-title">Peste toate straturile</h2>
      </Heading>
    ),
    children: (
      <Text>
        Bara de sus și butoanele fixe rămân sub estompare cât timp fereastra
        este deschisă.
      </Text>
    ),
  },
  decorators: [
    (Story) => (
      <div className="min-h-[24rem] pt-20">
        <div className="fixed inset-x-0 top-0 z-50 flex min-h-14 items-center justify-center border-b border-line-subtle bg-surface px-4">
          <Text tone="muted">bara de sus (z-50)</Text>
        </div>
        <GlyphButton
          aria-label="Sună clinica"
          className="fixed bottom-4 right-4 z-40"
        >
          <Phone />
        </GlyphButton>
        <Button
          variant="outline"
          className="fixed bottom-4 left-4 z-40 rounded-full"
        >
          Română
        </Button>
        <Story />
      </div>
    ),
  ],
};

/**
 * The hands-on story — the only one that starts CLOSED, so its 1280 baseline is
 * the trigger button alone. Click it and the panel opens; the ✕, Esc and a
 * press on the scrim each close it, and focus lands back on the button with its
 * ring visible (the platform's own focus return, D3). Every control above is
 * live here, so the whole prop surface can be exercised by hand from this one
 * story.
 */
export const OpenAndClose: Story = {
  args: {
    'aria-labelledby': 'modal-story-open-close-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-open-close-title">Programează o consultație</h2>
      </Heading>
    ),
  },
  render: ({ ...args }) => <ModalDemo {...args} initialOpen={false} />,
};

/**
 * DE is the longest locale (§8.4, ≈ +30–35% over EN) and its compounds are the
 * hardest single words on the site: at 288px they must WRAP, never overflow,
 * and the ✕ must not move. `closeLabel` travels with the language — the atom
 * holds no default (D10 → B).
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: {
    closeLabel: 'Schließen',
    // The panel's contents are German inside an otherwise Romanian document —
    // `lang` rides through `rest` onto the root <dialog>, so a screen reader
    // switches voice for exactly this subtree (SC 3.1.2). A section does the
    // same thing the moment it renders one locale's modal on another's page.
    lang: 'de',
    'aria-labelledby': 'modal-story-de-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-de-title">Terminvereinbarung und Öffnungszeiten</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>
          Rufen Sie uns während der Öffnungszeiten an: Montag – Freitag, 09:00 –
          19:00 Uhr.
        </Text>
        <Text>
          Bringen Sie bitte Ihre Behandlungskostenübernahmebestätigung mit.
        </Text>
        <Text tone="muted">Beispielstraße 1, Bukarest.</Text>
      </div>
    ),
  },
};

/**
 * Pseudo-locale (~40% expansion, accents) — a hardcoded stress fixture, the
 * house pattern (§8.9, §15.7): stories do not run the message provider, so the
 * expansion is written out here rather than generated.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: {
    closeLabel: 'Íñçhídé ~~~',
    'aria-labelledby': 'modal-story-pseudo-title',
    header: (
      <Heading asChild>
        <h2 id="modal-story-pseudo-title">Prógrámèáž ó çóñšúltáțíé ······</h2>
      </Heading>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <Text>
          Šúñáțí lá çlíñíçă îñ tímpúl prógrámúlúí: Lúñí – Víñérí, 09:00 – 19:00.
          ··················
        </Text>
        <Text>Štrádá Éxémplú ñr. 1, Búçúréští. ··········</Text>
      </div>
    ),
  },
};
