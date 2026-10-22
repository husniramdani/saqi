/**
 * design.md → tokens. Pure functions: parse the YAML front matter, validate it against the
 * Stylebase v1 schema plus Saqi's own readability rules, and emit CSS and TypeScript.
 * The CLI in scripts/build.ts does the file I/O.
 */
import { Ajv } from 'ajv';
import { parse } from 'yaml';
import schema from '../schema/stylebase-v1.json' with { type: 'json' };

type Colors = Record<string, string>;
interface ScaleStep {
  label: string;
  size: string;
  lineHeight: string;
}
interface FontDef {
  family: string;
  weight: number;
  use: string;
}
export interface DesignDoc {
  name: string;
  colors: Colors;
  typography: { headline: FontDef; body: FontDef; mono?: FontDef; scale: ScaleStep[] };
  spacing: { base: number; scale: number[]; unit: string };
  rounded: Record<string, string>;
  'x-stylebase'?: {
    themes?: { night?: { colors?: Colors; elevation?: Record<string, string> } };
    elevation?: Record<string, string>;
    fonts?: { arabic?: string; google?: string };
    motion?: {
      durations: Record<string, number>;
      eases: Record<string, string>;
      stagger: Record<string, number>;
    };
    'ai-rules'?: { always?: string[]; never?: string[] };
  };
}

export class DesignError extends Error {
  constructor(readonly problems: string[]) {
    super(`design.md is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

export function frontMatter(markdown: string): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match?.[1]) throw new DesignError(['no YAML front matter (--- … ---) at the top']);
  return parse(match[1]);
}

// ── WCAG contrast ───────────────────────────────────────────────────────────

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance of an opaque #RRGGBB colour. */
export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, minimum ratio]: Saqi's readability rules, checked in every theme. */
export const CONTRAST_RULES: [string, string, number][] = [
  ['text-primary', 'background', 7],
  ['text-primary', 'surface', 7],
  ['text-secondary', 'background', 4.5],
  ['text-secondary', 'surface', 4.5],
  ['text-muted', 'background', 4.5],
  ['text-muted', 'surface', 4.5],
  ['accent-text', 'background', 4.5],
  ['accent-text', 'surface', 4.5],
  ['accent-foreground', 'accent', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['success', 'background', 4.5],
  ['error', 'background', 4.5],
  ['info', 'background', 4.5],
  ['tag-text', 'tag', 4.5],
  ['inverse-text', 'inverse', 4.5],
  ['inverse-accent', 'inverse', 4.5],
  // Non-text UI (WCAG 1.4.11): the focus ring must stand out from the page.
  ['focus', 'background', 3],
];

const WATER = ['water-0', 'water-1', 'water-2', 'water-3', 'water-4', 'water-5', 'water-6'];

function checkTheme(theme: string, colors: Colors): string[] {
  const problems: string[] = [];
  for (const [fg, bg, min] of CONTRAST_RULES) {
    const a = colors[fg];
    const b = colors[bg];
    if (!a || !b) {
      problems.push(`${theme}: missing colour ${a ? bg : fg} (needed for ${fg} on ${bg})`);
      continue;
    }
    const ratio = contrast(a, b);
    if (ratio < min) {
      problems.push(
        `${theme}: ${fg} ${a} on ${bg} ${b} is ${ratio.toFixed(2)} : 1, needs ${min} : 1`,
      );
    }
  }
  const water = WATER.map((k) => colors[k]);
  if (water.some((c) => !c)) {
    problems.push(`${theme}: needs every water step water-0 … water-6`);
  } else {
    // Darker always means wetter: lightness must run one way, so the scale reads in greyscale.
    const lum = (water as string[]).map(luminance);
    const steps = lum.slice(1).map((l, i) => l - (lum[i] ?? 0));
    if (!steps.every((d) => d < 0) && !steps.every((d) => d > 0)) {
      problems.push(`${theme}: water-0 … water-6 must be ordered by lightness`);
    }
  }
  return problems;
}

// ── Validation ──────────────────────────────────────────────────────────────

const validateSchema = new Ajv({ allErrors: true, strict: false }).compile<DesignDoc>(schema);

export function validate(raw: unknown): DesignDoc {
  if (!validateSchema(raw)) {
    throw new DesignError(
      (validateSchema.errors ?? []).map(
        (e) => `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`,
      ),
    );
  }
  const doc = raw;
  const x = doc['x-stylebase'];
  const problems: string[] = [];
  if (!x) problems.push('x-stylebase is required (motion tokens and ai-rules live there)');
  if (!x?.motion) problems.push('x-stylebase.motion is required');
  if (doc.typography.scale.length < 8) problems.push('typography.scale needs at least 8 steps');
  problems.push(...checkTheme('day', doc.colors));

  const night = x?.themes?.night?.colors;
  if (night) {
    const missing = Object.keys(doc.colors).filter((k) => !(k in night));
    if (missing.length > 0) problems.push(`night: missing ${missing.join(', ')}`);
    problems.push(...checkTheme('night', { ...doc.colors, ...night }));
  }
  if (problems.length > 0) throw new DesignError(problems);
  return doc;
}

// ── Emitters ────────────────────────────────────────────────────────────────

const HEADER =
  '/* Generated from design.md by @saqi/tokens. Do not edit: run `pnpm design:check`. */';
const vars = (prefix: string, entries: Record<string, string>, indent = '  ') =>
  Object.entries(entries)
    .map(([k, v]) => `${indent}--${prefix}-${k}: ${v};`)
    .join('\n');

/**
 * Tailwind v4 `@theme static` (static: every variable is emitted even if no utility uses it, so SVG
 * fills, GSAP and JS can read any token through var()). Tailwind's default palette, type scale, radii and shadows are reset so
 * only design.md tokens exist (`bg-red-500` simply does not compile). Night re-points the same
 * variables under `[data-theme='night']`, so utilities never branch on theme.
 */
export function toCss(doc: DesignDoc): string {
  const x = doc['x-stylebase'] ?? {};
  const arabic = x.fonts?.arabic ?? 'IBM Plex Sans Arabic';
  const elevation = { ...(x.elevation ?? {}) };
  delete elevation['flat'];
  const scale = doc.typography.scale
    .map(
      (s) => `  --text-${s.label}: ${s.size};\n  --text-${s.label}--line-height: ${s.lineHeight};`,
    )
    .join('\n');
  const night = x.themes?.night;

  return `${HEADER}
@theme static {
  --color-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
${vars('color', doc.colors)}
  --font-sans: "${doc.typography.body.family}", "${arabic}", ui-sans-serif, sans-serif;
  --font-mono: "${doc.typography.mono?.family ?? doc.typography.body.family}", ui-monospace, monospace;
  --font-arabic: "${arabic}", "${doc.typography.body.family}", sans-serif;
${scale}
  --spacing: ${doc.spacing.base}${doc.spacing.unit};
${vars('radius', doc.rounded)}
${vars('shadow', elevation)}
}
${
  night
    ? `
[data-theme='night'] {
  color-scheme: dark;
${vars('color', night.colors ?? {})}
${vars('shadow', night.elevation ?? {})}
}
`
    : ''
}`;
}

const json = (value: unknown) => JSON.stringify(value, null, 2);

export function toTs(doc: DesignDoc): string {
  const x = doc['x-stylebase'] ?? {};
  const nightColors = { ...doc.colors, ...(x.themes?.night?.colors ?? {}) };
  const water = (c: Colors) => WATER.map((k) => c[k]);
  return `// Generated from design.md by @saqi/tokens. Do not edit: run \`pnpm design:check\`.
export const name = ${json(doc.name)};
export const colors = ${json(doc.colors)} as const;
export const nightColors = ${json(nightColors)} as const;
export type ColorToken = keyof typeof colors;
/** water-0 (dry) … water-6 (wet); step = min(6, floor(PAW / 100 × 7)). */
export const waterScale = ${json(water(doc.colors))} as const;
export const nightWaterScale = ${json(water(nightColors))} as const;
export const type = ${json(doc.typography)} as const;
export const spacing = ${json(doc.spacing)} as const;
export const radius = ${json(doc.rounded)} as const;
export const elevation = ${json({ day: x.elevation ?? {}, night: { ...x.elevation, ...x.themes?.night?.elevation } })} as const;
export const fonts = ${json(x.fonts ?? {})} as const;
export const motion = ${json(x.motion)} as const;
export const aiRules = ${json(x['ai-rules'] ?? {})} as const;
`;
}

export function toMotionTs(doc: DesignDoc): string {
  const m = doc['x-stylebase']?.motion;
  return `// Generated from design.md by @saqi/tokens. Do not edit: run \`pnpm design:check\`.
export const duration = ${json(m?.durations ?? {})} as const;
export const ease = ${json(m?.eases ?? {})} as const;
export const stagger = ${json(m?.stagger ?? {})} as const;
`;
}

export function compile(markdown: string) {
  const doc = validate(frontMatter(markdown));
  const night = doc['x-stylebase']?.themes?.night?.colors ?? {};
  return {
    doc,
    css: toCss(doc),
    ts: toTs(doc),
    motionTs: toMotionTs(doc),
    summary: `design.md valid · ${Object.keys(doc.colors).length} colours × ${Object.keys(night).length > 0 ? 2 : 1} themes · ${doc.typography.scale.length} type steps`,
  };
}
