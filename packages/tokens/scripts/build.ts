/** pnpm design:check — validate ../../design.md and regenerate dist/. Exits 1 with readable errors. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DesignError, compile } from '../src/compile';

const root = new URL('../', import.meta.url);
try {
  const out = compile(readFileSync(new URL('../../design.md', root), 'utf8'));
  mkdirSync(new URL('dist/', root), { recursive: true });
  writeFileSync(new URL('dist/tokens.css', root), out.css);
  writeFileSync(new URL('dist/tokens.ts', root), out.ts);
  writeFileSync(new URL('dist/motion.ts', root), out.motionTs);
  console.log(out.summary);
} catch (err) {
  console.error(err instanceof DesignError ? err.message : err);
  process.exit(1);
}
