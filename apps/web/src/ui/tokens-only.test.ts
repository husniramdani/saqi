import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// design.md: colours come only from tokens. A hex literal in a primitive is a bypass.
// (Vitest runs from apps/web; under jsdom import.meta.url is not a file URL.)
describe('ui primitives use tokens only', () => {
  const dir = join(process.cwd(), 'src/ui');
  const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));

  it('finds the primitives', () => {
    expect(files).toContain('Button.tsx');
  });

  it.each(files)('%s has no hex colours', (file) => {
    expect(readFileSync(join(dir, file), 'utf8')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
