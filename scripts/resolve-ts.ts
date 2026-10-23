/**
 * Lets Node's built-in type stripping load the workspace packages (`@saqi/shared`), which export
 * TypeScript source written for bundler resolution: relative imports without an extension.
 * A relative import Node can't find is retried with `.ts`; everything else resolves as usual.
 * Usage: node --import ./scripts/resolve-ts.ts scripts/smoke.ts
 */
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      const relative = specifier.startsWith('./') || specifier.startsWith('../');
      if (!relative || /\.[cm]?[jt]sx?$/.test(specifier)) throw err;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
