import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, setTheme, storedTheme } from './theme';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  applyTheme(storedTheme());
});

describe('theme', () => {
  it('defaults to night, and only a stored choice of day changes it', () => {
    expect(storedTheme()).toBe('night');
    setTheme('day');
    expect(storedTheme()).toBe('day');
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('persists night and re-points the tokens', () => {
    setTheme('day');
    setTheme('night');
    expect(storedTheme()).toBe('night');
    expect(document.documentElement.dataset['theme']).toBe('night');
  });

  it('still works when storage is blocked (Safari private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(storedTheme()).toBe('night');
    expect(() => setTheme('day')).not.toThrow();
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });
});
