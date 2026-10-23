import { cx } from './cx';

/** On/off switch (map layers). The 44 px target wraps the 40 × 24 track. */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-grid min-h-11 min-w-11 place-items-center rounded-full"
    >
      <SwitchTrack on={checked} />
    </button>
  );
}

/** The 40 × 24 switch track alone, for a control that carries its own label and state. */
export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex h-6 w-10 shrink-0 items-center rounded-full p-1',
        on ? 'justify-end bg-accent' : 'justify-start border border-border-strong bg-surface-well',
      )}
    >
      <span className={cx('size-4 rounded-full', on ? 'bg-accent-foreground' : 'bg-text-muted')} />
    </span>
  );
}
