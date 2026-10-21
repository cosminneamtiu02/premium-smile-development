import { describe, expect, expectTypeOf, it } from 'vitest';
import { shareHrefs, type ShareHrefs, type ShareText } from './share';

// lib/share — the three share links of an article, beside the module (the
// lib-foldering lane). share.ts's header argues every rule pinned here: plain
// links (no plugin, §12), WhatsApp's own address rather than its short one
// (2026-10-20), the page's own words around the address (the owner's
// 2026-10-17 "check out this article … for email … a subject"), every value
// through encodeURIComponent (%20, never "+"; CR LF in the e-mail's body), and
// the refusals, each naming the rule it breaks. Pure string work: it would run
// anywhere, and runs in the components project's Chromium only because that
// is where `src/**/*.test.ts` runs.

const ADDRESS = 'https://example.com/ro/blog/cum-iti-alegi-periuta-de-dinti/';
const TEXT: ShareText = {
  subject: 'Un articol de la Premium Smile: Cum îți alegi periuța de dinți',
  message:
    'Citește acest articol de la Premium Smile: Cum îți alegi periuța de dinți',
};

/** The value one query parameter of a share link carries, decoded. */
const param = (href: string, name: string): string | null =>
  new URL(href).searchParams.get(name);

describe('shareHrefs — the three links', () => {
  it('builds Facebook’s sharer, WhatsApp’s click-to-chat and a mailto: with no recipient', () => {
    // Written out by hand once, so the encoding itself is pinned: „î" is
    // %C3%AE and „ț" is %C8%9B in UTF-8, every space is %20, the WhatsApp
    // line break %0A and the e-mail's CR LF %0D%0A (RFC 6068 §5).
    const address =
      'https%3A%2F%2Fexample.com%2Fro%2Fblog%2Fcum-iti-alegi-periuta-de-dinti%2F';
    const title =
      'Cum%20%C3%AE%C8%9Bi%20alegi%20periu%C8%9Ba%20de%20din%C8%9Bi';
    expect(shareHrefs(ADDRESS, TEXT)).toEqual({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${address}`,
      whatsapp: `https://api.whatsapp.com/send?text=Cite%C8%99te%20acest%20articol%20de%20la%20Premium%20Smile%3A%20${title}%0A${address}`,
      email: `mailto:?subject=Un%20articol%20de%20la%20Premium%20Smile%3A%20${title}&body=Cite%C8%99te%20acest%20articol%20de%20la%20Premium%20Smile%3A%20${title}%0D%0A%0D%0A${address}`,
    });
  });

  it('builds the WhatsApp link on api.whatsapp.com/send — never wa.me, whose redirect rewrites the text', () => {
    // share.ts's WHATSAPP'S OWN ADDRESS: wa.me's 302 turned U+202F and U+00A0
    // into plain spaces and an emoji into U+FFFD (measured 2026-10-20), and
    // the French message puts U+202F before its colon. The link is WhatsApp's
    // own address, the text its one field, and every one of those characters
    // travels as its UTF-8 escapes and decodes back as it was written.
    const text: ShareText = {
      subject: 'Un article de Premium Smile\u202f: Le blanchiment dentaire',
      message:
        'Découvrez cet article de Premium Smile\u202f: Le blanchiment\u00a0dentaire 😀',
    };
    const href = shareHrefs(ADDRESS, text).whatsapp;
    const parsed = new URL(href);

    expect(`${parsed.origin}${parsed.pathname}`).toBe(
      'https://api.whatsapp.com/send',
    );
    expect([...parsed.searchParams.keys()]).toEqual(['text']);
    expect(href).toContain('Smile%E2%80%AF%3A'); // U+202F, then the colon
    expect(href).toContain('blanchiment%C2%A0dentaire'); // U+00A0
    expect(href).toContain('%F0%9F%98%80'); // the emoji, whole
    expect(param(href, 'text')).toBe(`${text.message}\n${ADDRESS}`);
  });

  it('hands every receiver exactly the page’s words and the address — decoded back, nothing lost', () => {
    const hrefs = shareHrefs(ADDRESS, TEXT);
    expect(param(hrefs.facebook, 'u')).toBe(ADDRESS);
    expect(param(hrefs.whatsapp, 'text')).toBe(`${TEXT.message}\n${ADDRESS}`);
    expect(param(hrefs.email, 'subject')).toBe(TEXT.subject);
    expect(param(hrefs.email, 'body')).toBe(
      `${TEXT.message}\r\n\r\n${ADDRESS}`,
    );
  });

  it('puts the address on a line of its own in the WhatsApp text and after a blank line in the e-mail', () => {
    const hrefs = shareHrefs(ADDRESS, TEXT);
    expect(param(hrefs.whatsapp, 'text')?.split('\n')).toEqual([
      TEXT.message,
      ADDRESS,
    ]);
    expect(param(hrefs.email, 'body')?.split('\r\n')).toEqual([
      TEXT.message,
      '',
      ADDRESS,
    ]);
  });

  it('encodes the characters a query string treats as its own, so the words can hold them', () => {
    const text: ShareText = {
      subject: 'Igienă + albire? Da & nu #1 = 2/2',
      message: 'Citește: igienă + albire? Da & nu #1 = 2/2',
    };
    const hrefs = shareHrefs(ADDRESS, text);

    expect(param(hrefs.email, 'subject')).toBe(text.subject);
    expect(param(hrefs.whatsapp, 'text')).toBe(`${text.message}\n${ADDRESS}`);
    for (const href of Object.values(hrefs)) {
      // No "+": it is what a FORM encoder (URLSearchParams) writes for a
      // space, and a mail client reads it as a literal plus (RFC 6068 §5),
      // so every space must be %20 and the words' own "+" %2B. No raw space
      // either (a URL holds none, and in plain text one ends the link), no
      // raw "#", which would cut the link short, and no raw line break,
      // which would end it.
      expect(href, href).not.toMatch(/[ +#\r\n]/);
    }
    // One "&" in the mailto: link — the one between its two fields.
    expect(hrefs.email.split('&')).toHaveLength(2);
    expect(hrefs.email).toContain('%2B');
    expect(hrefs.email).toContain('%26');
  });

  it('shares the address as the URL parser writes it back, so one page is one link', () => {
    expect(param(shareHrefs('HTTPS://Example.COM', TEXT).facebook, 'u')).toBe(
      'https://example.com/',
    );
    // An empty user-info part carries no name and no password: the parser
    // drops it, and the address is shared without it.
    expect(
      param(shareHrefs('https://@example.com/ro/blog/x/', TEXT).facebook, 'u'),
    ).toBe('https://example.com/ro/blog/x/');
  });

  it('accepts http as well as https (a local preview is http)', () => {
    expect(
      param(shareHrefs('http://localhost:3000/ro/blog/x/', TEXT).facebook, 'u'),
    ).toBe('http://localhost:3000/ro/blog/x/');
  });

  it('returns exactly the three links, typed as ShareHrefs, from a ShareText of exactly two words', () => {
    const hrefs = shareHrefs(ADDRESS, TEXT);
    expect(Object.keys(hrefs).sort()).toEqual([
      'email',
      'facebook',
      'whatsapp',
    ]);
    expectTypeOf(hrefs).toEqualTypeOf<ShareHrefs>();
    expectTypeOf<ShareHrefs>().toEqualTypeOf<
      Readonly<{ facebook: string; whatsapp: string; email: string }>
    >();
    expectTypeOf<ShareText>().toEqualTypeOf<
      Readonly<{ subject: string; message: string }>
    >();
  });
});

describe('shareHrefs — the refusals, each naming its rule', () => {
  /** One refused value: what the row is, the value, the rule its message
   *  names, and the value as the message quotes it. */
  type Refused = readonly [
    name: string,
    value: string,
    rule: string,
    quoted: string,
  ];

  /** A row whose value holds nothing lib/visible-text's `spelled` writes
   *  another way — no character that shows nothing but the plain space, no
   *  double quote, no backslash, no lone surrogate — so the message quotes it
   *  as it is, in double quotes. Every other row writes its quoted form by
   *  hand: each such character by its code point, upper-case and braced,
   *  pinned (share.ts's THE REFUSALS). */
  const refused = (name: string, value: string, rule: string): Refused => [
    name,
    value,
    rule,
    `"${value}"`,
  ];

  /** A refusal's message, as share.ts's THE REFUSALS words it. */
  const refusal = (what: string, rule: string, quoted: string): string =>
    `shareHrefs: the ${what} ${rule}, got ${quoted}`;

  const SPACED = 'has white space at its start or end';
  const NOT_ABSOLUTE = 'is not an absolute URL';
  const NOT_HTTP = 'is not an http(s) address';
  const CREDENTIALS = 'carries a user name or a password';

  const BAD_ADDRESSES: readonly Refused[] = [
    refused('an empty address', '', NOT_ABSOLUTE),
    refused(
      'a relative address',
      '/ro/blog/cum-iti-alegi-periuta-de-dinti/',
      NOT_ABSOLUTE,
    ),
    refused(
      'a protocol-relative address',
      '//example.com/ro/blog/x/',
      NOT_ABSOLUTE,
    ),
    refused(
      'an address with no scheme',
      'example.com/ro/blog/x/',
      NOT_ABSOLUTE,
    ),
    refused('a scheme with no host', 'https://', NOT_ABSOLUTE),
    refused('a mailto: address', 'mailto:clinica@example.com', NOT_HTTP),
    refused('a javascript: address', 'javascript:alert(1)', NOT_HTTP),
    refused('a data: address', 'data:text/html,x', NOT_HTTP),
    refused('an ftp: address', 'ftp://example.com/x/', NOT_HTTP),
    refused('a space before the address', ` ${ADDRESS}`, SPACED),
    refused('a space after the address', `${ADDRESS} `, SPACED),
    [
      'a no-break space (U+00A0) after the address',
      `${ADDRESS}\u00a0`,
      SPACED,
      `"${ADDRESS}\\u{00A0}"`,
    ],
    refused(
      'an address with a user name and a password',
      'https://user:secret@example.com/ro/blog/x/',
      CREDENTIALS,
    ),
    refused(
      'an address with a user name alone',
      'https://user@example.com/ro/blog/x/',
      CREDENTIALS,
    ),
    refused(
      'an address with a password alone',
      'https://:secret@example.com/ro/blog/x/',
      CREDENTIALS,
    ),
  ];

  it.each(BAD_ADDRESSES)(
    'refuses %s with a RangeError naming the rule',
    (_case, url, rule, quoted) => {
      expect(() => shareHrefs(url, TEXT)).toThrow(RangeError);
      expect(() => shareHrefs(url, TEXT)).toThrow(
        refusal('address', rule, quoted),
      );
    },
  );

  // The words are FINISHED text, lib/visible-text's rule, refused in its own
  // words — the condition its `whyUnfinished` names (share.ts's THE
  // REFUSALS); the one-line rule is this module's own.
  const UNFINISHED = 'must be visible text, trimmed:';
  const EMPTY = `${UNFINISHED} it shows nothing`;
  const SPACED_TEXT = `${UNFINISHED} it has white space at its start or end`;
  const MALFORMED = `${UNFINISHED} it is not well-formed (a lone surrogate)`;
  const BROKEN = 'holds a line break or a control character';

  const BAD_TEXT: readonly Refused[] = [
    refused('empty', '', EMPTY),
    refused('only spaces', '   ', EMPTY),
    ['only a narrow no-break space (U+202F)', '\u202f', EMPTY, '"\\u{202F}"'],
    // Characters that show nothing yet survive `trim()`, which asked this
    // until round 1 of lib/visible-text's review (2026-10-21): each passed
    // as a subject, an e-mail whose subject line shows nothing.
    ['only a zero-width space (U+200B)', '\u200b', EMPTY, '"\\u{200B}"'],
    ['only a soft hyphen (U+00AD)', '\u00ad', EMPTY, '"\\u{00AD}"'],
    ['only a Hangul filler (U+3164)', '\u3164', EMPTY, '"\\u{3164}"'],
    refused('a space before it', ` ${TEXT.subject}`, SPACED_TEXT),
    refused('a space after it', `${TEXT.subject} `, SPACED_TEXT),
    // French typography's narrow no-break space prints as nothing in a
    // message: the refusal writes its code point.
    [
      'a narrow no-break space (U+202F) after it',
      `${TEXT.subject}\u202f`,
      SPACED_TEXT,
      `"${TEXT.subject}\\u{202F}"`,
    ],
    [
      'a no-break space (U+00A0) before it',
      `\u00a0${TEXT.subject}`,
      SPACED_TEXT,
      `"\\u{00A0}${TEXT.subject}"`,
    ],
    [
      'a line feed inside it',
      'Un articol\nde la Premium Smile',
      BROKEN,
      '"Un articol\\u{000A}de la Premium Smile"',
    ],
    [
      'a carriage return inside it',
      'Un articol\rde la Premium Smile',
      BROKEN,
      '"Un articol\\u{000D}de la Premium Smile"',
    ],
    [
      'a line separator (U+2028) inside it',
      'Un articol\u2028de la Premium Smile',
      BROKEN,
      '"Un articol\\u{2028}de la Premium Smile"',
    ],
    [
      'a paragraph separator (U+2029) inside it',
      'Un articol\u2029de la Premium Smile',
      BROKEN,
      '"Un articol\\u{2029}de la Premium Smile"',
    ],
    [
      'a next line (U+0085) inside it',
      'Un articol\u0085de la Premium Smile',
      BROKEN,
      '"Un articol\\u{0085}de la Premium Smile"',
    ],
    [
      'a vertical tab inside it',
      'Un articol\u000bde la Premium Smile',
      BROKEN,
      '"Un articol\\u{000B}de la Premium Smile"',
    ],
    [
      'a form feed inside it',
      'Un articol\fde la Premium Smile',
      BROKEN,
      '"Un articol\\u{000C}de la Premium Smile"',
    ],
    [
      'a tab inside it',
      'Un articol\tde la Premium Smile',
      BROKEN,
      '"Un articol\\u{0009}de la Premium Smile"',
    ],
    [
      'a NUL inside it',
      'Un articol\u0000de la Premium Smile',
      BROKEN,
      '"Un articol\\u{0000}de la Premium Smile"',
    ],
    [
      'a lone surrogate (encodeURIComponent cannot encode it) — spelled in the one escape style, never JSON’s lower case',
      'Titlu \ud800',
      MALFORMED,
      '"Titlu \\u{D800}"',
    ],
  ];

  it.each(BAD_TEXT)(
    'refuses a subject that is %s with a TypeError naming the subject and the rule',
    (_case, subject, rule, quoted) => {
      expect(() => shareHrefs(ADDRESS, { ...TEXT, subject })).toThrow(
        TypeError,
      );
      expect(() => shareHrefs(ADDRESS, { ...TEXT, subject })).toThrow(
        refusal('subject', rule, quoted),
      );
    },
  );

  it.each(BAD_TEXT)(
    'refuses a message that is %s with a TypeError naming the message and the rule',
    (_case, message, rule, quoted) => {
      expect(() => shareHrefs(ADDRESS, { ...TEXT, message })).toThrow(
        TypeError,
      );
      expect(() => shareHrefs(ADDRESS, { ...TEXT, message })).toThrow(
        refusal('message', rule, quoted),
      );
    },
  );

  it('judges the address first, then the subject, then the message', () => {
    expect(() =>
      shareHrefs('/ro/blog/x/', { subject: '', message: '' }),
    ).toThrow(RangeError);
    expect(() => shareHrefs(ADDRESS, { subject: '', message: '' })).toThrow(
      /the subject/,
    );
  });
});
