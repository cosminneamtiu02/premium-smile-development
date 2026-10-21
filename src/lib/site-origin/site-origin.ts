import { clinic } from '../clinic/clinic';

// lib/site-origin — THE SITE'S PUBLIC ORIGIN, read in one place: the scheme
// and host every ABSOLUTE address the site hands to another program is built
// on — the article's share links (lib/share), the address its copy control
// copies, and the link-preview tags a messenger or a social network reads to
// draw the card (the article route's metadata: the page's address and its
// picture's). A page's own links never need it: they are root-absolute paths
// (i18n/href, lib/base-path). Built on the article page's lane (CLAUDE.md
// §15.39 round 4), 2026-10-17, when the owner made the preview card mandatory
// ("if possible on share to also preload the "hero" of the article and to
// display first large picture and also title of it … this is a mandatory
// feature"): a preview tag must name its picture by an absolute address, which
// no relative path can be.
//
// ── TWO SOURCES, ONE ANSWER. By default the origin is lib/clinic's `url` —
// the single source of the clinic's facts (§10.1), a PLACEHOLDER domain until
// the owner sets the production one (BACKLOG.md entry 7). A build may name
// another with the SITE_ORIGIN environment variable. The preview served on the
// owner's network does (so a phone on it can open a shared link and draw its
// card); the interim Pages host's production build (§15.2) could, but
// release.yml does not — it sets PAGES_BASE_PATH and NOINDEX alone, and
// BACKLOG.md entry 7 records the one-line lever. So once promoted, every share
// link, the copied address and the preview tags' page and picture addresses on
// that host name the placeholder origin under the base path — for an article,
// `https://example.com/premium-smile-development/ro/blog/<slug>/` (measured,
// 2026-10-20). The variable is an ORIGIN, nothing after it; the deployment's
// base path still comes from lib/base-path, never from here.
//
// ── READ AT CALL TIME, ON THE SERVER. Every caller runs at BUILD time in Node
// (the route's server components and metadata); the Pages/BlogArticle twin
// runs the same populator in Storybook's browser, where `process` may not
// exist — so the read is guarded, and there the answer is lib/clinic's. Not
// inlined into a browser bundle (next.config's `env`): no client island asks.
//
// ── THE REFUSAL, named. The value must already BE an origin as a browser
// prints it — http: or https:, the host, a port only when it is not the
// scheme's default, nothing after them but one slash at most — held against
// the URL parser's own answer and compared in ASCII case only
// (`HTTPS://Example.COM/` passes, as `https://example.com`). The parser's
// answer, never the text or the parser's parts alone, because the parser MENDS
// what it reads (measured, Node 24, 2026-10-20): `https:example.com`, a
// trailing `/?`, `/#` or `/..`, `https://@example.com` and a tab inside the
// host each came out as `https://example.com`, and
// `http://192.168.0.0142:3110` — one extra key on the owner's preview address
// — as `http://192.168.0.98:3110` (an address part with a leading zero reads
// as octal). A host ending in a dot is refused on its own: the parser keeps
// the dot, and `https://example.com.` is an origin of its own; so is a host
// with an empty label (`https://example..com`, which the parser keeps too).
// A refusal never prints a user name or a password the value carries: it
// lands in the build's log, which a public repository shows to anyone. Two
// consequences, refused on purpose and spelled out in the message: a default
// port written out (`https://example.com:443`) and a Unicode domain
// (`https://bücher.example` — write `https://xn--bcher-kva.example`), each of
// which a browser prints otherwise. A refusal is a RangeError naming its
// source (SITE_ORIGIN or lib/clinic's `url`), the value and what is wrong with
// it — its scheme, the dot, or the origin a browser reads it as; when the
// parser reads nothing, the parser's own error is its `cause` — so a mistyped
// build variable fails the build instead of shipping previews that point at
// another host. What no check can see is a placeholder: lib/clinic's
// `https://example.com` passes, and until the owner sets the production
// domain every address built without SITE_ORIGIN — the interim host's above
// among them — points at a domain that is not the clinic's.

/** SITE_ORIGIN as the build set it, or undefined — the guarded read (the header's READ AT CALL TIME). */
function configuredOrigin(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  const value = process.env.SITE_ORIGIN;
  return value === undefined || value === '' ? undefined : value;
}

/**
 * ASCII capitals to small letters and nothing else — the URL parser's own
 * case fold for a scheme and an ASCII host. A Unicode letter that folds to an
 * ASCII one (the Kelvin sign to `k`) stays itself, so the comparison refuses
 * it like any other Unicode host (the header's THE REFUSAL).
 */
const asciiLower = (text: string): string =>
  text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());

/**
 * The site's public origin — `https://example.com` — from SITE_ORIGIN when a
 * build sets it, else from lib/clinic's `url` (the header's TWO SOURCES).
 * @throws RangeError naming the source and the value unless the value is
 * already an http(s) origin as a browser prints it, nothing after it but one
 * slash at most (the header's THE REFUSAL); its `cause` is the URL parser's
 * own error when the parser reads nothing.
 */
export function siteOrigin(): string {
  const configured = configuredOrigin();
  const source = configured === undefined ? "lib/clinic's url" : 'SITE_ORIGIN';
  const value = configured ?? clinic.url;
  // What a refusal prints of the value: all of it, but a user name and a
  // password — a refusal lands in the build's log, and a public repository's
  // CI logs are public.
  let shown = JSON.stringify(value);
  const refuse = (finding: string, cause?: unknown): never => {
    throw new RangeError(
      `siteOrigin: write the site's origin as a browser prints it — http: or https:, the host (an international domain in its xn-- form, no empty label, no dot at its end), a port only when it is not the scheme's default, then nothing but one slash at most; ${source} is ${shown}, ${finding}`,
      cause === undefined ? undefined : { cause },
    );
  };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (error) {
    return refuse('which the URL parser cannot read', error);
  }
  if (parsed.username !== '' || parsed.password !== '') {
    shown = JSON.stringify(`${parsed.protocol}//…@${parsed.host}`);
    return refuse('which carries a user name or a password (not printed)');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return refuse(`whose scheme is ${parsed.protocol}`);
  }
  if (parsed.hostname.endsWith('.')) {
    return refuse('whose host ends in a dot');
  }
  if (parsed.hostname.startsWith('.') || parsed.hostname.includes('..')) {
    return refuse('whose host has an empty label');
  }
  const written = value.endsWith('/') ? value.slice(0, -1) : value;
  if (asciiLower(written) !== parsed.origin) {
    return refuse(
      `which a browser reads as the origin ${JSON.stringify(parsed.origin)}`,
    );
  }
  return parsed.origin;
}

/**
 * The absolute address of a root-absolute path on this site — the path as the
 * page would link it, the base path already in it (i18n/href's localeHref,
 * lib/base-path's withBasePath): `/ro/blog/x/` → `https://example.com/ro/blog/x/`.
 *
 * THE ADDRESS IS READ, NOT ONLY THE PATH. The path must start with ONE slash —
 * a relative one would land under whichever page resolves it, a `//host` one
 * on that host — and the address it resolves to must be on the site's origin
 * with no credentials, read off the URL parser's answer. The text alone cannot
 * promise it: for http(s) the parser reads a backslash as a slash and drops a
 * tab or a line break anywhere, so `/\evil.example/x` — and `//evil.example/x`
 * with a tab or a line feed between its two slashes — each passed a one-slash
 * text check and resolved to `https://evil.example/x`, and
 * `/\user@example.com/x` to the site's own host with a user name in it
 * (measured, Node 24, 2026-10-20). And a path the parser RE-READS is refused
 * even when it lands on the site — `/\example.com/x` reaches
 * `https://example.com/x` by a backslash read as a slash — because the rule is
 * the path as the page would link it: a backslash, a tab or a line break in
 * it is never that (G2, 2026-10-20). No caller writes such a path today — the
 * two callers pass localeHref's and withBasePath's — but the addresses this
 * builds leave the site, and PHASE4_SEO_PLAN.md plans the canonical and
 * hreflang links the same way.
 * @throws RangeError naming the path — with the address it would have reached,
 * or, when the parser reads no address, the parser's own error as its `cause`
 * — and siteOrigin()'s own RangeError when the origin itself is refused.
 */
export function absoluteUrl(path: string): string {
  const refuse = (finding: string, cause?: unknown): never => {
    throw new RangeError(
      `absoluteUrl: the path must be root-absolute — one leading slash as the URL parser reads it (a backslash counts as a slash, a tab or a line break is dropped) — and reach the site's origin with no credentials; got ${JSON.stringify(path)}${finding}`,
      cause === undefined ? undefined : { cause },
    );
  };
  if (!path.startsWith('/') || path.startsWith('//')) return refuse('');
  const origin = siteOrigin();
  let resolved: URL;
  try {
    resolved = new URL(path, `${origin}/`);
  } catch (error) {
    return refuse(', which the URL parser cannot read', error);
  }
  if (
    resolved.origin !== origin ||
    resolved.username !== '' ||
    resolved.password !== ''
  ) {
    return refuse(`, which reaches ${JSON.stringify(resolved.href)}`);
  }
  if (/[\\\t\n\r]/.test(path)) {
    return refuse(
      `, which the parser re-reads as ${JSON.stringify(resolved.href)}`,
    );
  }
  return resolved.href;
}
