import designMd from '../../../../../design.md?raw';

/** The story's colour excerpt comes from the real design.md source. */

// --- Scene 1: the design.md colour block -----------------------------------------------

export interface CodeLine {
  text: string;
  /** The hex value when the line is a colour token. */
  hex?: string;
  /** Water-scale tokens fly out of the code into the palette, then onto the map. */
  water?: boolean;
}

/** `colors:`, the first eight tokens, an ellipsis, then the water scale and `stale` (18 lines). */
export function colourExcerpt(source = designMd): CodeLine[] {
  const lines = source.split('\n');
  const start = lines.findIndex((l) => l.startsWith('colors:'));
  if (start === -1) return [];
  const tokens = lines.slice(start + 1).filter((l) => /^ {2}[\w-]+: '#[0-9A-Fa-f]{6,8}'/.test(l));
  const water = tokens.filter((l) => /^ {2}water-\d:/.test(l));
  const stale = tokens.find((l) => l.startsWith('  stale:'));
  const toLine = (text: string): CodeLine => {
    const hex = /'(#[0-9A-Fa-f]{6})/.exec(text)?.[1];
    return { text, ...(hex ? { hex } : {}), ...(/water-\d/.test(text) ? { water: true } : {}) };
  };
  return [
    { text: lines[start] ?? 'colors:' },
    ...tokens.slice(0, 8).map(toLine),
    { text: '  # …' },
    ...water.map(toLine),
    ...(stale ? [toLine(stale)] : []),
  ];
}
