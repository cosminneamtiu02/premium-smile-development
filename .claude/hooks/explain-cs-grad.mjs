#!/usr/bin/env node
// UserPromptSubmit hook — when the owner asks for an EXPLANATION, inject the
// standing explanation register (owner persona: fresh CS graduate, zero
// React/frontend-framework experience) as prompt context, so explanation
// depth is deterministic instead of depending on memory recall.
// Registered in .claude/settings.json; tested by ./explain-cs-grad.test.mjs.
//
// FAIL-OPEN BY DESIGN: any parse error, missing field, or non-match exits 0
// with no output — a broken hook must never block or delay a prompt.

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let prompt = '';
  try {
    prompt = String(JSON.parse(raw)?.prompt ?? '');
  } catch {
    process.exit(0);
  }

  // "Asking for an explanation" = understanding-seeking phrasings.
  // Deliberately NOT matched: "how do i ..." — a how-to request wants steps,
  // not a lecture. Extend the list here when a real prompt slips through, and
  // add the miss to the test file in the same edit.
  const EXPLANATION = new RegExp(
    [
      '\\bexplain\\b',
      '\\bwhy\\b',
      '\\bhow (does|is|are|did|would|come|can)\\b',
      '\\bhow do(?!\\s+i\\b)\\b',
      '\\bwhat (is|are|does|do|happens|means|happened)\\b',
      "\\bwhat'?s (the difference|going on|happening|this|that)\\b",
      '\\bwalk me through\\b',
      '\\bhelp me understand\\b',
      '\\bunderstand (why|how|what)\\b',
      '\\bdifference between\\b',
      '\\bclarify\\b',
      '\\belaborate\\b',
      '\\bteach me\\b',
      '\\bbreak (it|this|that) down\\b',
      '\\bin depth\\b',
      '\\bfrom zero\\b',
    ].join('|'),
    'i',
  );

  if (!EXPLANATION.test(prompt)) process.exit(0);

  // Plain stdout on exit 0 is added to the model's context for
  // UserPromptSubmit hooks.
  process.stdout.write(
    [
      '<explain-cs-grad-rule source="project UserPromptSubmit hook">',
      'This prompt asks for an explanation. Standing owner requirement',
      '(persona recalibrated 2026-08-16): explain as to a fresh CS graduate',
      'with NO React/frontend-framework experience.',
      '- Build a from-zero causal chain, not a summary of conclusions.',
      '- Define every React/Next.js/Tailwind/testing term at first use',
      '  (component, hook, hydration, island, portal, container query, ...).',
      '- Pair each abstraction with what it physically produces: JSX -> the',
      '  rendered DOM, a hook -> the runtime behavior, a build step -> the',
      '  emitted files.',
      '- Argue trade-offs explicitly: what was chosen, what the rejected',
      '  alternative was, and why.',
      '- Assume general CS fundamentals (data structures, HTTP, plain JS);',
      '  never assume framework knowledge.',
      '</explain-cs-grad-rule>',
    ].join('\n'),
  );
  process.exit(0);
});
