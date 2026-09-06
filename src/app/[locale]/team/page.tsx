import { getTranslations } from 'next-intl/server';

// INTERIM STUB — the real Team page arrives in its own Phase-4 lane (see
// MIGRATION_PLAYBOOK's Phase-4 order: TeamIntro · TeamMemberCard grid ·
// ClinicGallery). It exists so the shell's live nav has a resolvable target:
// the placeholder shell linked nothing, the real Header/Footer nav links every
// primary route, and CI's link check caught the difference (PR #69 — 11 broken
// internal links).
// No new message keys: the <h1> reuses the nav label the bar already renders.
// KEEP-IN-SYNC with ./Team.stories.tsx: this file is an async Server Component
// and cannot render in the browser runner, so the story twins its markup
// through `useTranslations` and pins it (owner, 2026-09-06).

export default async function TeamPage() {
  const t = await getTranslations('common');

  return <h1 className="font-display text-ink-strong">{t('nav.team')}</h1>;
}
