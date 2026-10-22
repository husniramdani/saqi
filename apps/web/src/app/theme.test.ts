import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, setTheme, storedTheme } from './theme';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  applyTheme('day');
});

describe('theme', () => {
  it('defaults to day', () => {
    expect(storedTheme()).toBe('day');
  });

  it('persists night and re-points the tokens', () => {
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
    expect(storedTheme()).toBe('day');
    expect(() => setTheme('night')).not.toThrow();
    expect(document.documentElement.dataset['theme']).toBe('night');
  });
});
