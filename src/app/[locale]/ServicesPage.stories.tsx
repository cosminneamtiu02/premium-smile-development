import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useFormatter, useTranslations } from 'next-intl';
import { expect, within } from 'storybook/test';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { CTABanner } from '@/components/sections/CTABanner/CTABanner';
import { ServiceCard } from '@/components/sections/ServiceCard/ServiceCard';
import { Container } from '@/components/ui/Container/Container';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { SERVICE_TIERS } from '@/lib/services';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';

// THE SERVICES PAGE as one picture — §13's page-tier story: the REAL sections
// and atoms, with mock messages supplied by the preview decorator, and the
// `Pages/*` title prefix routing it to all six widths (320 · 390 · 768 · 1280 ·
// 1536 · 1920 — tests/visual/stories.spec.ts) in Romanian AND German, which is
// the whole §13 page matrix. What only an assembly can show is here: the three
// cards as a ROW (the @3xl grid step measured against the real gutter clamp,
// not a story ground), whether their price rows land on one baseline, and how
// the closing CTA band's raised ground meets the list band above it.
//
// ── IT RENDERS THE ASSEMBLY, NOT THE PAGE COMPONENT. The page's default export
// is a plain sync composition (no params, no server APIs — the setRequestLocale
// idiom ended with the 16.3.4 rootParams transport), but the MODULE stays
// un-importable here: services/page.tsx's generateMetadata pulls
// next-intl/server + lib/seo at module level, none of which exist in the browser
// Storybook renders in. So this story composes the same band in the same order —
// the page file's whole body — and the two are kept in step by eye and by this
// comment rather than by the compiler. That is the standing trade-off §13
// already accepts for page stories ("render the real sections with mock
// messages"); what it buys is that every string, token and container step below
// is the shipped one.
// The page's JSON-LD <script> is deliberately NOT mirrored: it renders no box,
// so it cannot show up in a frame, and its shape is pinned where shapes belong —
// tests/unit/seo.test.ts.
// The from-price assembly below is the same three lines the page runs. It does
// NOT make this the third consumer that §4's N≥3 row would promote (see the page
// header's "THE PRICE-LINE TWIN"): that trigger counts SHIPPED consumers, and a
// page story is by construction a mirror of one of them.
//
// ── THE TWO WRAPPERS ARE THE SHELL, standing in exactly as far as it matters:
//   · ContactModalProvider — the CTA is a ContactModalTrigger, which THROWS
//     outside it by design. The dialog stays CLOSED (no `defaultOpen`, no play
//     presses it), so it contributes no pixels to these six frames; its own
//     states are storied in ContactModal.stories.tsx.
//   · <main> — the landmark app/[locale]/layout.tsx wraps {children} in. It is
//     full-bleed there (bands own their gutters by composing ui/Container), so
//     it carries no classes here either.
// Header, Footer and FloatingActions are deliberately ABSENT: they are the
// shell's bands, storied in their own files, and including them would make every
// Services baseline move whenever the bar or the footer changes.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE with per-story `globals` — the visual
// runner opens stories by URL with no toolbar state, so an unpinned German story
// would photograph Romanian. The pin also stamps `<html lang>`, which is what
// gives `hyphens: auto` its dictionary (§15.14) — and German is where that
// matters: "Professionelle Zahnreinigung" has to fit inside a grid track.
//
// layout 'fullscreen': two full-bleed bands whose grounds must meet edge to
// edge. Storybook's default 1rem padding would inset both and put the seam this
// frame exists to show inside a border.

const Page = (): ReactElement => {
  const t = useTranslations('services');
  const format = useFormatter();

  const services = SERVICE_TIERS.map((tier) => ({
    key: tier.key,
    name: t(`tiers.${tier.key}.name`),
    description: t(`tiers.${tier.key}.description`),
    priceLabel: t('priceFrom', {
      price: format.number(tier.priceRon, {
        style: 'currency',
        currency: 'RON',
        maximumFractionDigits: 0,
      }),
    }),
  }));

  return (
    <ContactModalProvider>
      <main>
        <section aria-labelledby="services-title" className="py-20">
          <Container className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('intro.eyebrow')}</Eyebrow>
              <Heading size="section" asChild>
                <h1 id="services-title">{t('title')}</h1>
              </Heading>
            </div>

            <Text tone="muted" className="max-w-2xl">
              {t('intro.text')}
            </Text>

            <ul role="list" className="grid gap-6 @3xl:grid-cols-3">
              {services.map((service) => (
                <li key={service.key}>
                  <ServiceCard
                    className="h-full"
                    level={2}
                    name={service.name}
                    description={service.description}
                    priceLabel={service.priceLabel}
                  />
                </li>
              ))}
            </ul>

            <Text tone="muted" className="max-w-2xl">
              {t('disclaimer')}
            </Text>
          </Container>
        </section>

        <CTABanner />
      </main>
    </ContactModalProvider>
  );
};

const meta = {
  title: 'Pages/Services',
  parameters: { layout: 'fullscreen' },
  render: () => <Page />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The play function's `canvas` — Testing Library's queries bound to the story
 * root, which is exactly what `within()` returns. */
type Canvas = ReturnType<typeof within>;

/**
 * ONE h1 per page (§9), a heading order that never skips a rung, and two
 * DISTINCTLY named regions — the assertions that exist only at this tier,
 * because each band is individually correct and can still add up to a page with
 * two h1s or two identically-named landmarks.
 */
const expectPageOutline = async (
  canvas: Canvas,
  messages: typeof ro,
  locale: 'ro' | 'de',
): Promise<void> => {
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  await expect(canvas.getAllByRole('region')).toHaveLength(2);

  // Each landmark named by its own band's title, read back as the accessibility
  // tree computes it (the aria-labelledby pairs).
  canvas.getByRole('region', { name: messages.services.title });
  canvas.getByRole('region', { name: messages.common.cta.title });

  canvas.getByRole('heading', { level: 1, name: messages.services.title });
  canvas.getByRole('heading', { level: 2, name: messages.common.cta.title });
  // The cards sit DIRECTLY under the page's h1 — there is no h2 above the list
  // — so they are h2s themselves and the outline steps down by one (axe's
  // heading-order rule, §9). Four level-2 headings in total: three tier names,
  // whose count tracks lib/services.ts rather than a hand-written grid, plus
  // the closing CTA question. On Home the identical cards are h3s, because
  // there the teaser's own h2 sits above them.
  for (const tier of SERVICE_TIERS) {
    canvas.getByRole('heading', {
      level: 2,
      name: messages.services.tiers[tier.key].name,
    });
  }
  await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(
    SERVICE_TIERS.length + 1,
  );
  await expect(canvas.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  await expect(canvas.getAllByRole('article')).toHaveLength(
    SERVICE_TIERS.length,
  );
  // The list is a real list: screen readers announce "list, 3 items".
  await expect(canvas.getAllByRole('listitem')).toHaveLength(
    SERVICE_TIERS.length,
  );

  // THE PAGE-SIDE PRICE PIN (G2 ts MEDIUM, S3). The band body above is a
  // hand-kept mirror of services/page.tsx, so a drift in the PAGE's own Intl
  // option bag or ICU wiring would keep every gate green while the shipped
  // page changed — the mirror is what the baselines photograph. Recomputing
  // the line the way the page must (same message, same options — the
  // ServicesTeaser.test.tsx recipe) pins the one value a visitor would notice
  // first. CLDR's no-break space is normalized exactly as Testing Library's
  // matcher normalizes DOM text, so the comparison cannot flake on U+00A0.
  for (const tier of SERVICE_TIERS) {
    const price = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0,
    }).format(tier.priceRon);
    canvas.getByText(
      messages.services.priceFrom.replace('{price}', price).replace(/ /g, ' '),
    );
  }
};

/**
 * THE PAGE, Romanian (§15.7) — what a visitor of /ro/services sees: the mono
 * kicker over the page title, the transparent-pricing promise, the three
 * sourced tiers with their from-prices, the disclaimer, and the closing
 * question on the raised ground.
 */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas, canvasElement }) => {
    await expectPageOutline(canvas, ro, 'ro');
    // §7: nothing may require horizontal scrolling, at any sampled width — and
    // this story is sampled at the 320px accessibility stress width too.
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};

/**
 * THE PAGE IN GERMAN — the longest language (§8.4: ≈ +30–35% over English) and
 * the second half of §13's page matrix. The card's own German stress is proven
 * next door; what this frame adds is the CUMULATIVE effect: a longer title, a
 * longer intro, three longer cards in one grid row, and a disclaimer that runs
 * to two lines where Romanian's runs to one.
 */
export const German: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas, canvasElement }) => {
    await expectPageOutline(canvas, de, 'de');
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
