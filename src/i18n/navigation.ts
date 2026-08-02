import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware navigation primitives. Sections/pages use these instead of
// next/link · next/navigation so every href carries the locale prefix (§5).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
