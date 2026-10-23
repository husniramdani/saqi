import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import ar from './ar.json';
import en from './en.json';
import ur from './ur.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

type Ast = ReturnType<IntlMessageFormat['getAst']>;

/** ICU argument names, from the parsed message (a regex mistakes `{runs}` branches for args). */
function params(message: string): string[] {
  const names = new Set<string>();
  const walk = (nodes: Ast) => {
    for (const node of nodes) {
      if ('value' in node && node.type !== 0 && typeof node.value === 'string')
        names.add(node.value);
      if ('options' in node) for (const option of Object.values(node.options)) walk(option.value);
    }
  };
  walk(new IntlMessageFormat(message, 'en').getAst());
  return [...names].sort();
}

const english = flatten(en);
const locales = { ar: flatten(ar), ur: flatten(ur) };

describe.each(Object.entries(locales))('%s strings', (locale, strings) => {
  it('has every English key and nothing extra', () => {
    expect([...strings.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('uses the same ICU params as English', () => {
    const mismatched = [...english].filter(
      ([key, message]) => params(strings.get(key) ?? '').join() !== params(message).join(),
    );
    expect(mismatched.map(([key]) => key)).toEqual([]);
  });

  it('compiles and formats every message', () => {
    for (const [key, message] of strings) {
      const values = Object.fromEntries(params(message).map((p) => [p, 3]));
      expect(() => new IntlMessageFormat(message, locale).format(values), key).not.toThrow();
    }
  });

  it('is actually translated (only units, codes and the brand may stay English)', () => {
    const latin = [...strings].filter(
      ([, message]) => !/\p{Script_Extensions=Arabic}/u.test(message),
    );
    // ponytail: allowlist by key; a new all-Latin string must be added here on purpose.
    const allowed = new Set(['shell.brand', 'today.budgetUsed', 'field.context', 'map.utility.ro']);
    expect(latin.map(([key]) => key).filter((k) => !allowed.has(k))).toEqual([]);
  });
});
