import { getTranslations, setRequestLocale } from 'next-intl/server';

// INTERIM STUB — the real Blog index arrives in its own Phase-4 lane (see
// MIGRATION_PLAYBOOK's Phase-4 order: the ro-only MDX pipeline, PostCard list
// and blog/[slug] pages). It exists so the shell's live nav has a resolvable
// target: the placeholder shell linked nothing, the real Header/Footer nav
// links every primary route, and CI's link check caught the difference
// (PR #69 — 11 broken internal links).
// No new message keys: the <h1> reuses the nav label the bar already renders.
//
// ── DELIBERATE, INTERIM §5 DEVIATION, recorded so nobody reads it as a bug.
// §5 says the blog is ROMANIAN ONLY, and lib/routes.ts already enforces that
// where it is visible: `{ path: '/blog', key: 'nav.blog', locale: 'ro' }` keeps
// the item out of the other four locales' nav, so only /ro/blog/ is ever
// linked. This file, though, sits under [locale] and `output: 'export'`
// pre-renders every page for every locale in generateStaticParams — so four
// PHANTOM pages (/en/blog/, /de/blog/, /fr/blog/, /it/blog/) are emitted that
// nothing on the site points at. They are harmless while they last: the interim
// host is noindexed in full (§15.2, NOINDEX=1), so they cannot compete for
// search, and no visitor can reach them without typing the URL.
// The real Blog lane owns the fix — ro-only generation, whether by its own
// generateStaticParams or by a route shape outside [locale] — and retires this
// note along with the stub.

type Props = { params: Promise<{ locale: string }> };

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return <h1 className="font-display text-ink-strong">{t('nav.blog')}</h1>;
}
