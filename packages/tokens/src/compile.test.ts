import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';
import { compile, contrast, DesignError, frontMatter, luminance, validate } from './compile';

const designMd = readFileSync(new URL('../../../design.md', import.meta.url), 'utf8');

/** design.md with one front-matter edit applied: `path` is a YAML key path, `value` undefined deletes. */
function edited(path: (string | number)[], value?: unknown): unknown {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(designMd)?.[1] ?? '';
  const yaml = parseDocument(fm);
  if (value === undefined) yaml.deleteIn(path);
  else yaml.setIn(path, value);
  return yaml.toJS();
}

const problemsOf = (raw: unknown) => {
  try {
    validate(raw);
    return [];
  } catch (err) {
    if (err instanceof DesignError) return err.problems;
    throw err;
  }
};

describe('validate', () => {
  it('accepts the real design.md in both themes', () => {
    expect(problemsOf(frontMatter(designMd))).toEqual([]);
  });

  it('rejects a missing required colour with a readable message', () => {
    const problems = problemsOf(edited(['colors', 'primary']));
    expect(problems.join('\n')).toMatch(/\/colors must have required property 'primary'/);
  });

  it('rejects text that falls below the readability contrast', () => {
    const problems = problemsOf(edited(['colors', 'text-muted'], '#B0B0B0'));
    expect(problems.some((p) => p.startsWith('day: text-muted #B0B0B0 on background'))).toBe(true);
  });

  it('checks the night theme on its own colours', () => {
    const problems = problemsOf(
      edited(['x-stylebase', 'themes', 'night', 'colors', 'text-secondary'], '#3A3A3A'),
    );
    expect(problems.some((p) => p.startsWith('night: text-secondary'))).toBe(true);
  });

  it('requires night to define every day colour', () => {
    const problems = problemsOf(edited(['x-stylebase', 'themes', 'night', 'colors', 'water-3']));
    expect(problems).toContain('night: missing water-3');
  });

  it('requires the water scale to be ordered by lightness', () => {
    const problems = problemsOf(edited(['colors', 'water-3'], '#EFE6D2'));
    expect(problems).toContain('day: water-0 … water-6 must be ordered by lightness');
  });

  it('requires x-stylebase.motion and at least 8 type steps', () => {
    expect(problemsOf(edited(['x-stylebase', 'motion']))).toContain(
      'x-stylebase.motion is required',
    );
    const fm = frontMatter(designMd) as { typography: { scale: unknown[] } };
    fm.typography.scale = fm.typography.scale.slice(0, 5);
    expect(problemsOf(fm)).toContain('typography.scale needs at least 8 steps');
  });

  it('refuses a file without front matter', () => {
    expect(() => frontMatter('# just a heading')).toThrow(DesignError);
  });
});

describe('contrast', () => {
  it('matches WCAG on known pairs', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBe(1);
    // design.md: ink on paper is 14.8 : 1
    expect(contrast('#16201B', '#F3F1EB')).toBeCloseTo(14.8, 1);
  });

  it('ignores alpha when computing luminance', () => {
    expect(luminance('#16201B24')).toBe(luminance('#16201B'));
  });
});

describe('compile', () => {
  const out = compile(designMd);

  it('emits a Tailwind theme with every token and Tailwind defaults reset', () => {
    expect(out.css).toContain('@theme static {');
    expect(out.css).toContain('--color-*: initial;');
    expect(out.css).toContain('--color-water-5: #3B8090;');
    expect(out.css).toContain('--color-accent-text: #A04709;');
    expect(out.css).toContain('--font-sans: "Geist", "IBM Plex Sans Arabic"');
    expect(out.css).toContain('--text-base: 14.5px;');
    expect(out.css).toContain('--text-base--line-height: 21px;');
    expect(out.css).toContain('--radius-lg: 20px;');
    expect(out.css).toContain('--shadow-raised: 0 1px 2px');
    expect(out.css).not.toContain('--shadow-flat');
  });

  it('re-points the same variables for night', () => {
    const night = out.css.slice(out.css.indexOf("[data-theme='night']"));
    expect(night).toContain('color-scheme: dark;');
    expect(night).toContain('--color-background: #111214;');
    expect(night).toContain('--color-water-6: #9AD1C4;');
    expect(night).toContain('--shadow-raised: 0 1px 2px rgba(0,0,0,.3)');
  });

  it('emits typed TS tokens and motion', () => {
    expect(out.ts).toContain('export const waterScale = [\n  "#EFE6D2"');
    expect(out.ts).toContain('export const nightColors');
    expect(out.motionTs).toContain('"tide": 1.6');
    expect(out.motionTs).toContain('"emphasized": "power3.inOut"');
    expect(out.summary).toBe('design.md valid · 49 colours × 2 themes · 11 type steps');
  });
});
