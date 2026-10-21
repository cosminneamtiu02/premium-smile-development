import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clinic } from '../../src/lib/clinic/clinic';
import { absoluteUrl, siteOrigin } from '../../src/lib/site-origin/site-origin';

// lib/site-origin — the site's public origin, the base of every absolute
// address it hands to another program (the share links, the link-preview
// tags). In tests/unit/ and not beside the module for base-path.test.ts's
// reason: only this node project can flip an environment variable between
// cases. CLEARED first, so a shell that exported SITE_ORIGIN for a preview
// build cannot turn the default cases red.
//
// THE REFUSAL TABLES (the lane's review, 2026-10-20): most rows are a value or
// a path the URL parser MENDS into something else, so each was accepted — or
// resolved off the site — while the module read the text, or the parser's
// parts, instead of the parser's whole answer (the module's THE REFUSAL and
// THE ADDRESS IS READ). Every check in the module turns at least one row here
// red when it is taken out; the lane proved each on a copy.
beforeEach(() => {
  vi.stubEnv('SITE_ORIGIN', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** What `call` throws — the test fails, naming what came back, when it throws nothing. */
const thrownBy = (call: () => unknown): Error => {
  let returned: unknown;
  try {
    returned = call();
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error('threw something that is not an Error');
  }
  throw new Error(`threw nothing; returned ${JSON.stringify(returned)}`);
};

describe('siteOrigin — the two sources', () => {
  it('is lib/clinic’s url when no build names another', () => {
    expect(siteOrigin()).toBe(new URL(clinic.url).origin);
  });

  it('treats an empty SITE_ORIGIN as unset', () => {
    vi.stubEnv('SITE_ORIGIN', '');
    expect(siteOrigin()).toBe(new URL(clinic.url).origin);
  });

  it('is SITE_ORIGIN when a build sets it — a preview on the owner’s network', () => {
    vi.stubEnv('SITE_ORIGIN', 'http://192.168.0.142:3110');
    expect(siteOrigin()).toBe('http://192.168.0.142:3110');
  });

  it('writes the origin back as the URL parser does (a lower-case host, no trailing slash)', () => {
    vi.stubEnv('SITE_ORIGIN', 'HTTPS://Example.COM/');
    expect(siteOrigin()).toBe('https://example.com');
  });

  it('is read at CALL time, so one process sees whichever value is set', () => {
    vi.stubEnv('SITE_ORIGIN', 'https://a.example');
    expect(siteOrigin()).toBe('https://a.example');
    vi.stubEnv('SITE_ORIGIN', 'https://b.example');
    expect(siteOrigin()).toBe('https://b.example');
  });
});

describe('siteOrigin — an origin written as a browser prints it', () => {
  it.each([
    ['one slash at the end', 'https://example.com/', 'https://example.com'],
    [
      'a port that is not the scheme’s default',
      'https://example.com:8443',
      'https://example.com:8443',
    ],
    ['an IPv6 host', 'http://[::1]:3110', 'http://[::1]:3110'],
    [
      'an IPv6 host in capitals',
      'http://[FE80::1]:3110',
      'http://[fe80::1]:3110',
    ],
  ])('accepts %s', (_case, value, origin) => {
    vi.stubEnv('SITE_ORIGIN', value);
    expect(siteOrigin()).toBe(origin);
  });
});

describe('siteOrigin — the named refusal', () => {
  it.each([
    ['a path', 'https://example.com/ro/'],
    ['a query', 'https://example.com/?a=1'],
    ['an empty query', 'https://example.com/?'],
    ['a fragment', 'https://example.com/#top'],
    ['an empty fragment', 'https://example.com/#'],
    ['a dot segment', 'https://example.com/..'],
    ['two slashes at the end', 'https://example.com//'],
    ['an empty user name', 'https://@example.com'],
    ['another scheme', 'ftp://example.com'],
    ['no scheme', 'example.com'],
    ['no slashes after the scheme', 'https:example.com'],
    ['a space around it', ' https://example.com'],
    ['a line break after it', 'https://example.com\n'],
    ['a tab inside the host', 'https://exam\tple.com'],
    ['a host ending in a dot', 'https://example.com.'],
    ['a host ending in a dot, then a slash', 'https://example.com./'],
    ['a host ending in a dot, then a port', 'https://example.com.:8443'],
    ['an empty label inside the host', 'https://example..com'],
    ['an empty label at the start of the host', 'https://.example.com'],
    [
      'an address part with a leading zero (read as octal: 0142 is 98)',
      'http://192.168.0.0142:3110',
    ],
    ['the scheme’s default port written out', 'https://example.com:443'],
    ['an international domain in Unicode', 'https://bücher.example'],
    [
      'a Unicode letter that folds to an ASCII one (the Kelvin sign)',
      `https://${String.fromCodePoint(0x212a)}elvin.example`,
    ],
    ['nonsense', 'not a url'],
  ])('refuses an origin with %s, naming it', (_case, value) => {
    vi.stubEnv('SITE_ORIGIN', value);
    expect(() => siteOrigin()).toThrow(RangeError);
    expect(() => siteOrigin()).toThrow(JSON.stringify(value));
  });

  it.each([
    ['a user name and a password', 'https://alice:hunter2@example.com'],
    ['a user name alone', 'https://alice@example.com'],
    ['a password alone', 'https://:hunter2@example.com'],
  ])(
    'refuses an origin with %s, and never prints them — a refusal lands in a public CI log',
    (_case, value) => {
      vi.stubEnv('SITE_ORIGIN', value);
      const message = thrownBy(() => siteOrigin()).message;
      expect(message).toContain('which carries a user name or a password');
      expect(message).toContain('"https://…@example.com"');
      expect(message).not.toContain('alice');
      expect(message).not.toContain('hunter2');
    },
  );

  it('names SITE_ORIGIN as the source, and what a browser reads its value as', () => {
    vi.stubEnv('SITE_ORIGIN', 'http://192.168.0.0142:3110');
    const { message } = thrownBy(() => siteOrigin());
    expect(message).toContain('SITE_ORIGIN is "http://192.168.0.0142:3110"');
    expect(message).toContain('reads as the origin "http://192.168.0.98:3110"');
    expect(message).not.toContain('lib/clinic');
  });

  it('names lib/clinic’s url as the source when no build names another', () => {
    const saved = clinic.url;
    clinic.url = 'https://example.com:443';
    try {
      const { message } = thrownBy(() => siteOrigin());
      expect(message).toContain(
        `lib/clinic's url is "https://example.com:443"`,
      );
      expect(message).toContain(
        "write the site's origin as a browser prints it",
      );
      expect(message).not.toContain('SITE_ORIGIN');
    } finally {
      clinic.url = saved;
    }
  });

  it('hands on the URL parser’s own error as the cause', () => {
    vi.stubEnv('SITE_ORIGIN', 'not a url');
    expect(thrownBy(() => siteOrigin()).cause).toBeInstanceOf(TypeError);
  });
});

describe('absoluteUrl — a root-absolute path on the site’s origin', () => {
  it('puts the path on the origin', () => {
    vi.stubEnv('SITE_ORIGIN', 'https://example.com');
    expect(absoluteUrl('/ro/blog/x/')).toBe('https://example.com/ro/blog/x/');
    expect(absoluteUrl('/images/hero/lobby.jpg')).toBe(
      'https://example.com/images/hero/lobby.jpg',
    );
  });

  it('keeps a base path the caller already put in the path — the interim Pages shape, on lib/clinic’s origin unless a build names another', () => {
    expect(absoluteUrl('/premium-smile-development/ro/blog/x/')).toBe(
      `${new URL(clinic.url).origin}/premium-smile-development/ro/blog/x/`,
    );
    vi.stubEnv('SITE_ORIGIN', 'https://owner.github.io');
    expect(absoluteUrl('/premium-smile-development/ro/blog/x/')).toBe(
      'https://owner.github.io/premium-smile-development/ro/blog/x/',
    );
  });

  it.each([
    ['a relative path', 'ro/blog/x/'],
    ['an empty path', ''],
    ['a protocol-relative path', '//evil.example/x'],
    ['a protocol-relative path naming the site’s own host', '//example.com/x'],
    [
      'a backslash, which the parser reads as a second slash',
      '/\\evil.example/x',
    ],
    ['a tab, which the parser drops', '/\t/evil.example/x'],
    ['a line feed, which the parser drops', '/\n/evil.example/x'],
    ['a user name on the site’s own host', '/\\user@example.com/x'],
    ['a password on the site’s own host', '/\\:pw@example.com/x'],
    ['a host the parser cannot read', '/\\'],
    [
      'a backslash naming the site’s own host, which the parser re-reads',
      '/\\example.com/ro/blog/x/',
    ],
    ['a backslash inside the path', '/ro\\blog/'],
    ['a tab inside the path', '/ro/\tblog/'],
    ['a line feed inside the path', '/ro/\nblog/'],
    ['a carriage return inside the path', '/ro/\rblog/'],
  ])('refuses %s, naming it', (_case, path) => {
    vi.stubEnv('SITE_ORIGIN', 'https://example.com');
    expect(() => absoluteUrl(path)).toThrow(RangeError);
    expect(() => absoluteUrl(path)).toThrow(JSON.stringify(path));
  });

  it('names the address a refused path would have reached', () => {
    vi.stubEnv('SITE_ORIGIN', 'https://example.com');
    expect(() => absoluteUrl('/\\evil.example/x')).toThrow(
      'which reaches "https://evil.example/x"',
    );
  });

  it('names what the parser re-reads a path as, even on the site’s own host', () => {
    vi.stubEnv('SITE_ORIGIN', 'https://example.com');
    expect(() => absoluteUrl('/\\example.com/ro/blog/x/')).toThrow(
      'which the parser re-reads as "https://example.com/ro/blog/x/"',
    );
  });

  it('hands on the URL parser’s own error as the cause', () => {
    vi.stubEnv('SITE_ORIGIN', 'https://example.com');
    expect(thrownBy(() => absoluteUrl('/\\')).cause).toBeInstanceOf(TypeError);
  });
});
