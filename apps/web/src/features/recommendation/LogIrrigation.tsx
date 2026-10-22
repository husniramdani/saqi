import { gstDate, type Block } from '@saqi/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLogEvent } from '@/api/queries';
import { useLocale } from '@/i18n';
import { formatM3, formatTimeGst } from '@/i18n/format';
import { Button } from '@/ui';
import { buildManualEvent } from './manualEvent';

const input =
  'min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-text-primary placeholder:text-text-muted';

/** "Log manual irrigation": a small disclosure form, validated with the API's schema, saved optimistically. */
export function LogIrrigation({ block }: { block: Block }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const ids = useId();
  const log = useLogEvent(block.id);
  const [open, setOpen] = useState(false);
  const [today] = useState(() => gstDate(new Date()));
  const [volume, setVolume] = useState('');
  const [time, setTime] = useState('06:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState<'volumeM3' | 'startedAt' | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const built = buildManualEvent({
      date: today,
      time,
      volumeM3: Number(volume),
      flowM3h: block.flowM3h,
      note,
    });
    if (!built.ok) {
      setError(built.field);
      return;
    }
    setError(null);
    log.mutate(built.event, {
      onSuccess: () => {
        setOpen(false);
        setVolume('');
        setNote('');
      },
    });
  };

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button variant="ghost" onClick={() => setOpen(true)} aria-expanded={false}>
          {t('block.log.open')}
        </Button>
        {log.isSuccess ? (
          <p role="status" className="text-sm text-success">
            {t('block.log.saved', {
              m3: formatM3(log.data.volumeM3, locale),
              time: formatTimeGst(log.data.startedAt, locale),
            })}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-md border border-border bg-surface-raised p-4"
    >
      <h3 className="text-md font-semibold">{t('block.log.title')}</h3>
      <div className="grid grid-cols-2 gap-3">
        <label
          className="flex flex-col gap-1.5 text-xs font-medium text-text-muted"
          htmlFor={`${ids}-v`}
        >
          {t('block.log.volume')}
          <input
            id={`${ids}-v`}
            className={`${input} num`}
            type="number"
            inputMode="decimal"
            min={0.1}
            max={500}
            step={0.1}
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            aria-invalid={error === 'volumeM3'}
            aria-describedby={error === 'volumeM3' ? `${ids}-err` : undefined}
            required
          />
        </label>
        <label
          className="flex flex-col gap-1.5 text-xs font-medium text-text-muted"
          htmlFor={`${ids}-t`}
        >
          {t('block.log.start')}
          <input
            id={`${ids}-t`}
            className={`${input} num`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>
      </div>
      <label
        className="flex flex-col gap-1.5 text-xs font-medium text-text-muted"
        htmlFor={`${ids}-n`}
      >
        {t('block.log.note')}
        <textarea
          id={`${ids}-n`}
          className={`${input} py-2`}
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {error === 'volumeM3' ? (
        <p id={`${ids}-err`} role="alert" className="text-sm text-error">
          {t('block.log.volumeError')}
        </p>
      ) : null}
      {log.isError ? (
        <p role="alert" className="text-sm text-error">
          {log.error.message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" variant="accent" loading={log.isPending}>
          {t('block.log.submit')}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {t('block.log.cancel')}
        </Button>
      </div>
    </form>
  );
}
