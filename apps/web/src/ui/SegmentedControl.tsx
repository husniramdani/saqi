import { useRef, type KeyboardEvent } from 'react';
import { cx } from './cx';

interface Option<T extends string> {
  value: T;
  label: string;
  /** e.g. `lang="ar"` for a language name in its own script. */
  lang?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A tablist: ink marks the selected segment. Arrow keys move and select, following the
 * reading direction (in RTL, ArrowLeft goes to the next option); Home and End jump.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl =
      (e.currentTarget.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.dir) ===
      'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const last = options.length - 1;
    const next =
      e.key === forward
        ? index === last
          ? 0
          : index + 1
        : e.key === back
          ? index === 0
            ? last
            : index - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null;
    const option = next === null ? undefined : options[next];
    if (next === null || !option) return;
    e.preventDefault();
    onChange(option.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-full border border-border bg-surface-raised p-[3px]"
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              'inline-flex min-h-[38px] items-center rounded-full px-4 text-sm font-medium',
              selected ? 'bg-primary text-primary-foreground' : 'text-text-secondary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
