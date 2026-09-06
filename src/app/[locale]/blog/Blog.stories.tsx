import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useTranslations } from 'next-intl';
import ro from '@/messages/ro.json';

// Pages/Blog — the INTERIM STUB as it actually ships: one heading reusing the
// nav label, no new message keys. The real ro-only MDX pipeline · PostCard list
// · blog/[slug] pages arrive with the §14 Blog lane, and the owner authors that
// content (§15.17).
//
// KEEP-IN-SYNC with src/app/[locale]/blog/page.tsx: that page is an async
// Server Component (getTranslations from next-intl/server), unrenderable in the
// browser runner — the shell.test.tsx / Pages/NotFound precedent — so the twin
// below renders the same markup through the isomorphic `useTranslations`.
//
// THE STUB'S RECORDED §5 DEVIATION — four phantom non-ro blog pages emitted by
// generateStaticParams that nothing links — is argued in the page file itself
// and is not restated here. It changes nothing for this story: the blog is
// Romanian-only by §5, and pinning `ro` is both the house rule and the only
// locale this page is meant to have.
//
// Created on the owner's 2026-09-06 instruction that every page have its story.
// ONE story, Romanian: the DE variant arrives WITH the real page lane (§13's
// RO+DE page tier) — and here it may never arrive at all, for the §5 reason
// above.
//
// layout 'fullscreen': the stub ships no gutter, so the truthful picture is the
// heading flush against the edge, not a Storybook inset.

/** KEEP-IN-SYNC twin of src/app/[locale]/blog/page.tsx. */
function BlogPageBand(): ReactElement {
  const t = useTranslations('common');

  return <h1 className="font-display text-ink-strong">{t('nav.blog')}</h1>;
}

const meta = {
  title: 'Pages/Blog',
  component: BlogPageBand,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BlogPageBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: ro.common.nav.blog,
    });
    await expect(heading.tagName).toBe('H1');
  },
};
