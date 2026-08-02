import type { Decorator, Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import { locales, nativeNames } from '../src/i18n/locales';
import de from '../src/messages/de.json';
import en from '../src/messages/en.json';
import fr from '../src/messages/fr.json';
import it from '../src/messages/it.json';
import ro from '../src/messages/ro.json';
import '../src/styles/globals.css';
import './preview-fonts.css';

// ─── Pseudo-locale (§8.9): accented + ~40% expanded strings. Untransformed
// text while pseudo is active = hardcoded string = bug. ICU {args} and <tags>
// pass through untouched so messages still parse.
const ACCENT: Record<string, string> = {
  a: 'á',
  e: 'é',
  i: 'í',
  o: 'ó',
  u: 'ú',
  y: 'ý',
  c: 'ç',
  n: 'ñ',
  s: 'š',
  t: 'ť',
  z: 'ž',
  A: 'Á',
  E: 'É',
  I: 'Í',
  O: 'Ó',
  U: 'Ú',
  Y: 'Ý',
  C: 'Ç',
  N: 'Ñ',
  S: 'Š',
  T: 'Ť',
  Z: 'Ž',
};

function pseudoString(value: string): string {
  const accented = value
    .split(/(\{[^}]*\}|<[^>]*>)/)
    .map((part) =>
      part.startsWith('{') || part.startsWith('<')
        ? part
        : part.replace(/[a-zA-Z]/g, (ch) => ACCENT[ch] ?? ch),
    )
    .join('');
  const padding = '·'.repeat(Math.max(2, Math.ceil(value.length * 0.4)));
  return `${accented} ${padding}`;
}

type Messages = { [key: string]: string | Messages };

function pseudoMessages(node: Messages): Messages {
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [
      key,
      typeof value === 'string' ? pseudoString(value) : pseudoMessages(value),
    ]),
  );
}

const MESSAGES: Record<string, Messages> = {
  ro,
  en,
  de,
  fr,
  it,
  pseudo: pseudoMessages(ro),
};

const withIntlAndTheme: Decorator = (Story, context) => {
  const selected = (context.globals.locale as string) ?? 'ro';
  const locale = selected === 'pseudo' ? 'ro' : selected;
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[selected]}
      timeZone="Europe/Bucharest"
    >
      {/* Font variables come from preview-fonts.css (:root) — same files,
          Storybook-local loading; see that file's header comment. */}
      <div className="bg-page font-body text-ink">
        <Story />
      </div>
    </NextIntlClientProvider>
  );
};

const preview: Preview = {
  decorators: [withIntlAndTheme],

  globalTypes: {
    locale: {
      description: 'Locale for translated content (§8.9)',
      toolbar: {
        icon: 'globe',
        // Derived from the locale manifest — the toolbar can never drift from
        // the routed locales.
        items: [
          ...locales.map((l) => ({ value: l, title: nativeNames[l] })),
          { value: 'pseudo', title: 'Pseudo (∼40% + accents)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    // Story/demo values default to Romanian, diacritics-bearing (§15.7)
    locale: 'ro',
  },

  parameters: {
    // Zero violations is a merge gate (§9, §13): the vitest addon turns every
    // axe violation into a test failure, not just a panel warning.
    a11y: { test: 'error' },

    viewport: {
      // The named test viewports (§7) + the 320px accessibility stress width.
      options: {
        stress320: {
          name: 'Stress 320',
          styles: { width: '320px', height: '568px' },
        },
        smartphone: {
          name: 'Smartphone 390',
          styles: { width: '390px', height: '844px' },
        },
        tablet: {
          name: 'Tablet 768',
          styles: { width: '768px', height: '1024px' },
        },
        notebook: {
          name: 'Notebook 1280',
          styles: { width: '1280px', height: '800px' },
        },
        laptop: {
          name: 'Laptop 1536',
          styles: { width: '1536px', height: '864px' },
        },
        desktop: {
          name: 'Desktop 1920',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },
  },
};

export default preview;
