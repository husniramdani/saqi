import { farm07 } from '@saqi/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutboxActions, useOutboxSyncing, type OutboxAction } from '@/api/outbox';
import { useOnline } from '@/app/useOnline';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst } from '@/i18n/format';
import { cx, Spinner } from '@/ui';

const chip =
  'flex min-h-11 w-max max-w-full items-center gap-2 rounded-md border border-border bg-overlay px-3 py-1.5 text-xs text-text-secondary shadow-floating';

/**
 * The map's corner status: Field actions waiting on this phone (and their sync), or else the
 * forecast point. Dismissing hides one exact queue; any change to it (an action added, sent or
 * replaced) brings the status back, even at the same count.
 */
export function OutboxStatus() {
  const { t } = useTranslation();
  const locale = useLocale();
  const actions = useOutboxActions();
  const syncing = useOutboxSyncing();
  const online = useOnline();
  const signature = actions.map((a) => a.id).join(' ');
  const [dismissed, setDismissed] = useState<string | null>(null);

  const queued = actions.length > 0;
  const view =
    queued && syncing ? 'syncing' : queued && dismissed !== signature ? 'queued' : 'point';
  const oldest = actions.reduce<OutboxAction | undefined>(
    (a, b) => (a && a.createdAt <= b.createdAt ? a : b),
    undefined,
  );

  // One live region whose words change, so each change is announced.
  return (
    <div role="status" className={cx(chip, view === 'queued' && 'py-1 pe-1')}>
      {view === 'syncing' ? (
        <>
          <Spinner />
          <span className="text-text-primary">{t('mapControls.outbox.syncing')}</span>
        </>
      ) : view === 'queued' && oldest ? (
        <>
          <span className="flex flex-col">
            <span className="font-medium text-text-primary">
              {t('mapControls.outbox.saved', { count: actions.length })}
            </span>
            <span>
              {online ? null : `${t('mapControls.outbox.offline')} · `}
              {t('mapControls.outbox.oldest', { time: formatTimeGst(oldest.createdAt, locale) })}
            </span>
          </span>
          <button
            type="button"
            aria-label={t('mapControls.outbox.dismiss')}
            onClick={() => setDismissed(signature)}
            className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-well hover:text-text-primary"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </>
      ) : (
        t('mapControls.outbox.point', {
          lat: formatNumber(farm07.lat, locale, 2),
          lon: formatNumber(farm07.lon, locale, 2),
        })
      )}
    </div>
  );
}
