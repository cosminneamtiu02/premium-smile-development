#!/usr/bin/env node
// Tests for explain-cs-grad.mjs (UserPromptSubmit hook).
// Run: node .claude/hooks/explain-cs-grad.test.mjs → exit 1 on any failure.
// Plain node, zero deps: harness tooling must not depend on the app's
// test stack (vitest is browser-mode and Node-24-pinned; this must run
// anywhere the hook itself runs).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = join(
  dirname(fileURLToPath(import.meta.url)),
  'explain-cs-grad.mjs',
);

// Prompts that ARE explanation requests → the hook must inject the register.
const MUST_INJECT = [
  'explain how the freeze effect works',
  'why is the panel portaled to body?',
  'what is a hydration mismatch',
  'walk me through the container query decision',
  'help me understand aria-expanded',
  'whats the difference between server and client components',
  'how does the morph animation trigger',
  'can you clarify the stacking context part',
  'what does this error mean',
];

// Prompts that are INSTRUCTIONS or how-to requests → the hook must stay silent.
const MUST_STAY_SILENT = [
  'commit it',
  'build the footer section next',
  'run the visual tests and report',
  'how do i run storybook', // a how-to wants steps, not a lecture
  'fix the failing test',
  'create a pr into develop',
];

const run = (stdin) =>
  spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8' });

let failures = 0;
const check = (name, ok, detail = '') => {
  if (ok) return console.log(`ok   ${name}`);
  failures += 1;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
};

for (const prompt of MUST_INJECT) {
  const r = run(JSON.stringify({ prompt }));
  check(
    `injects on: "${prompt}"`,
    r.status === 0 && r.stdout.includes('explain-cs-grad-rule'),
    `status=${r.status} stdout=${JSON.stringify(r.stdout?.slice(0, 80))}`,
  );
}

for (const prompt of MUST_STAY_SILENT) {
  const r = run(JSON.stringify({ prompt }));
  check(
    `silent on: "${prompt}"`,
    r.status === 0 && r.stdout.trim() === '',
    `stdout=${JSON.stringify(r.stdout?.slice(0, 80))}`,
  );
}

// Fail-open guarantees: a broken payload must never block or pollute a prompt.
for (const [name, stdin] of [
  ['malformed JSON', '{nope'],
  ['missing prompt field', '{}'],
  ['empty stdin', ''],
]) {
  const r = run(stdin);
  check(
    `fail-open on ${name}`,
    r.status === 0 && r.stdout.trim() === '',
    `status=${r.status} stdout=${JSON.stringify(r.stdout?.slice(0, 80))}`,
  );
}

console.log(failures ? `\n${failures} failure(s)` : '\nall green');
process.exit(failures ? 1 : 0);
