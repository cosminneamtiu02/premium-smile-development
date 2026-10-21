import { spelled, whyUnfinished } from '../visible-text/visible-text';

// lib/share — THE SHARE LINKS of an article: the three addresses that hand a
// page to Facebook, to WhatsApp and to an e-mail, built from the page's own
// address and the words the page wraps it in. React-free MECHANICS (CLAUDE.md
// §4's foundation ring, fenced by tests/unit/lib-react-free.test.ts): pure
// string work, no DOM, no state — the article route builds the three hrefs at
// BUILD time and sections/ShareLinks prints them as plain links. Built on the
// article page's lane (CLAUDE.md §15.39 round 4), 2026-10-14.
//
// ── WHAT THE OWNER ASKED (2026-10-14, verbatim: "the 4 share buttons above
// the image in the top right as in example, those would be the rop button
// buttons with adjacent svgs in the button which on hover tutn lilla and at
// base are black"), and his answer to which four: Facebook · WhatsApp ·
// E-mail · Copy link. The first three are LINKS, built here. The fourth copies
// the address — sections/ShareLinks' CopyLinkButton, one of the two client
// islands the article page adds (the gallery's carousel, sections/CardCarousel,
// is the other; CLAUDE.md §16): it needs the address and nothing from this
// file.
// And on 2026-10-17, verbatim: "also on share add i18n text for check out
// this article from bla bla … for email obviusly add a subject, all
// internationalised starting from current page language, this is a mandatory
// feature". So a share says something around the address, in the PAGE'S
// language: a MESSAGE („Citește acest articol de la Premium Smile: <titlu>")
// that opens the WhatsApp text and the e-mail's body, and a SUBJECT („Un
// articol de la Premium Smile: <titlu>") for the e-mail. Both arrive FINISHED
// (§8.1 — the page's words, `blog.article.share.message` / `.subject`); this
// module only places them. The picture and the title a receiver's preview
// card shows are the page's own link-preview tags (the route's metadata),
// never part of a link.
//
// ── PLAIN LINKS, NO PLUGIN (§12). Facebook's own buttons are social plugins
// of the kind the EU Court of Justice judged in Fashion ID (C-40/17, the Like
// button): embedded, they make every visitor's browser send its address and
// details to Facebook as the page loads, clicked or not — consent ground, and
// §2 allows no consent banner. A link loads nothing and sends nothing until
// the visitor clicks it, and then the visitor goes to Facebook, or opens
// WhatsApp or the mail app, by choice. A link is also static HTML, the same
// for every visitor (§16), and works with no JavaScript.
//   facebook  https://www.facebook.com/sharer/sharer.php?u=<the address>
//             Facebook's sharer takes the address alone: the card it shows
//             is read from the page's own link-preview (Open Graph) tags.
//   whatsapp  https://api.whatsapp.com/send?text=<the message, a line break,
//             the address>
//             WhatsApp's click-to-chat link with no number: the visitor picks
//             the chat, and the message arrives already written — the address
//             on its own line, which WhatsApp turns into the preview card.
//   email     mailto:?subject=<the subject>&body=<the message, a blank line,
//             the address>
//             no recipient (RFC 6068 allows none): the visitor's mail app
//             opens a new message for the visitor to address.
//
// ── WHATSAPP'S OWN ADDRESS, NOT ITS SHORT ONE (2026-10-20, measured with
// curl as a desktop browser, an iPhone and an Android phone — the same answer
// for each). The short form, https://wa.me/?text=…, answers with a 302 to
// api.whatsapp.com — the address above — and its Location REWRITES the text:
// a narrow no-break space (U+202F) and a no-break space (U+00A0) come back as
// plain spaces, an emoji and U+2028 as U+FFFD (the replacement character),
// while ș and ț, the quotation marks „ ” « » ’ and %2B %26 %23 %0A survive.
// The site's own words meet it: the French message and three French titles
// carry U+202F before their colon. The address above answers 200 itself and
// hands every one of those characters on to web.whatsapp.com intact (its own
// landing page PREVIEWS the text with those spaces plain and an emoji as
// U+FFFD; what it hands on is the original). A phone should lose nothing by
// it: api.whatsapp.com names the WhatsApp app and WhatsApp
// Business for every path ("*") in its app-site association
// (/.well-known/apple-app-site-association), and the same two apps in its
// Android asset links, as wa.me does in both — so a phone with the app opens
// this link in the app, as it did the short one (read from those files; no
// phone was tried — BACKLOG.md entry 2 books the check).
//
// ── EVERY VALUE THROUGH encodeURIComponent. A space becomes %20, which all
// three read as a space. URLSearchParams would write it as "+", and in a
// mailto: link a "+" cannot be told from a real plus (RFC 6068 §5 asks for
// %20), so it is not used. Romanian letters travel as UTF-8, „ț" as %C8%9B.
// THE LINE BREAKS: the e-mail's body breaks its lines with CR LF, %0D%0A —
// RFC 6068 §5: "line breaks in the body of a message MUST be encoded with
// %0D%0A"; WhatsApp's text takes a plain line feed, %0A.
// THE MAIL APP'S DECODING (recorded 2026-10-20): the mailto: carries its words
// as UTF-8, percent-encoded — RFC 6068 §2's way, and the only one it allows
// in a body (MIME encoded words are barred there); the RFC's own registration
// (§8.1) warns that the interoperability of such links "might be somewhat
// lower" than that of links in US-ASCII alone. A mail app that decodes them
// with the system's code page instead — reported for older classic Outlook on
// Windows — would show „CiteÈ™te" (a Western Windows, code page 1252) or
// „CiteČ™te" (a Romanian one, 1250) for „Citește". Nothing here can tell which
// app opens the link: there, Copy link is the visitor's fallback.
//
// ── THE REFUSALS, each naming the rule it breaks. The ADDRESS must be an
// ABSOLUTE http(s) URL with no white space at its start or end and no user
// name or password in it, or a RangeError: a relative address means nothing
// once it leaves this site, a javascript: or data: address must never become
// a link, and a user name or a password would be handed, as is, to whoever
// receives the link (lib/site-origin refuses them for the article route
// already; this function keeps its own word). It is shared as the URL parser
// writes it back (its `href`: the host in lower case, a bare domain with its
// slash, an empty user-info part dropped), so one page is always one link.
// The SUBJECT and the MESSAGE must each be FINISHED text — lib/visible-text's
// rule, asked through its `whyUnfinished`, which says which condition failed
// (round 2 of that module's review, 2026-10-21: until then this file spelled
// two of the conditions again by hand): a string, WELL-FORMED, since
// encodeURIComponent cannot encode a lone surrogate; that SHOWS something —
// not empty, and not white space and invisible characters alone (until round
// 1 of that review a `trim()` asked this, and a zero-width space, a soft
// hyphen or a Hangul filler alone passed it, an e-mail with a subject that
// shows nothing); with no white space at its start or end. And it must stand
// on ONE line with no control character in it — nothing of Unicode's Cc, Zl
// or Zp: a line feed, a carriage return, U+2028, U+2029, U+0085, a tab, a
// vertical tab, a form feed, a NUL (the rule refused CR and LF alone until
// 2026-10-20). Each is a TypeError naming the subject or the message and the
// rule: an e-mail with no subject and a message that is only an address are
// a caller's bug, and a line break or a control character would split or
// garble what the receiver reads. The one-line rule keeps a set of its OWN
// (LINE_BREAK_OR_CONTROL), never the shared one: it refuses what splits or
// garbles one line, and
// lib/visible-text's set of characters that show nothing would refuse far
// more — the no-break space and the U+202F that French typography puts in a
// share's words. A refusal quotes the value as lib/visible-text's `spelled`
// writes it — in double quotes, every character that shows nothing but the
// plain space by its code point, `\u{202F}`, a lone surrogate the same way,
// `\u{D800}` — so a trailing U+202F, French typography's, cannot vanish from
// the message, nor a zero-width space the blank rule refused. Until that
// review this file quoted with its own set — JSON.stringify's quoting, the
// spaces and controls JSON leaves, U+FEFF, in JSON's lower case (`\u202f`) —
// and left the format characters raw (U+200B, U+00AD, the bidi marks), which
// no rule here could refuse then: the blank rule now does.
//
// The address is the caller's: the article route passes the page's absolute
// URL, built on lib/site-origin's origin — lib/clinic's `url`, the
// placeholder domain until the owner sets it (BACKLOG.md entry 7), unless a
// build names another (SITE_ORIGIN), so until then the links share that.

/** The three share links of one page. */
export type ShareHrefs = Readonly<{
  facebook: string;
  whatsapp: string;
  email: string;
}>;

/** What a share says around the address, finished in the page's language
 *  (§8.1 — the header's WHAT THE OWNER ASKED). */
export type ShareText = Readonly<{
  /** The e-mail's subject line — „Un articol de la Premium Smile: …". */
  subject: string;
  /** The sentence the WhatsApp text and the e-mail's body open with —
   *  „Citește acest articol de la Premium Smile: …". */
  message: string;
}>;

/** What a one-line text must not hold (the header's THE REFUSALS): a line
 *  break or a control character — Unicode's Cc (the C0 and C1 controls: a
 *  line feed, a carriage return, a tab, a NUL, U+0085 …), Zl (U+2028) and
 *  Zp (U+2029). This rule's own set, never lib/visible-text's: that one
 *  refuses the no-break spaces French typography writes. */
const LINE_BREAK_OR_CONTROL = /[\p{Cc}\p{Zl}\p{Zp}]/u;

/** The address as it is shared — its `href` — or a RangeError naming the rule it breaks (the header's THE REFUSALS). */
function sharedAddress(url: string): string {
  const refuse = (rule: string): never => {
    throw new RangeError(
      `shareHrefs: the address ${rule}, got ${spelled(url)}`,
    );
  };
  if (url.trim() !== url) {
    return refuse('has white space at its start or end');
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return refuse('is not an absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return refuse('is not an http(s) address');
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return refuse('carries a user name or a password');
  }
  return parsed.href;
}

/** One of the two words a share says, or a TypeError naming it and the rule it breaks (the header's THE REFUSALS). */
function sharedText(field: keyof ShareText, value: string): string {
  // FINISHED text first — lib/visible-text's own rule and its own reason,
  // never re-spelled here: a string, well-formed, showing something, with no
  // white space at an end.
  const unfinished = whyUnfinished(value);
  if (unfinished !== undefined) {
    throw new TypeError(
      `shareHrefs: the ${field} must be visible text, trimmed: ${unfinished}`,
    );
  }
  if (LINE_BREAK_OR_CONTROL.test(value)) {
    throw new TypeError(
      `shareHrefs: the ${field} holds a line break or a control character, got ${spelled(value)}`,
    );
  }
  return value;
}

/**
 * Facebook's, WhatsApp's and the e-mail share link for the page at `url`,
 * saying `text` around it (the header's PLAIN LINKS). Throws a RangeError
 * naming the rule it breaks unless `url` is an absolute http(s) URL with no
 * white space around it and no user name or password, and a TypeError naming
 * the subject or the message, and the rule, when either is no finished text
 * (lib/visible-text's rule — not well-formed, showing nothing, or untrimmed)
 * or holds a line break or a control character — the address judged first.
 */
export function shareHrefs(url: string, text: ShareText): ShareHrefs {
  const address = sharedAddress(url);
  const subject = sharedText('subject', text.subject);
  const message = sharedText('message', text.message);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(address)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${message}\n${address}`)}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\r\n\r\n${address}`)}`,
  };
}
