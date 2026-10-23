import { farm07 } from '@saqi/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutboxActions, useOutboxSyncing, type OutboxAction } from '@/api/outbox';
import { useOnline } from '@/app/useOnline';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst } from '@/i18n/format';
import { cx, Spinner } from '@/ui';

/**
 * The map's corner status (design/dashboard.html `.toast` / `.coord`): Field updates waiting on
 * this phone (and their sync), or else the forecast point. Dismissing hides one exact queue; any
 * change to it (an action added, sent or replaced) brings the status back, even at the same count.
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
  const queuedAt = oldest ? formatTimeGst(oldest.createdAt, locale).replace(' GST', '') : '';

  // One live region whose words change, so each change is announced.
  return (
    <div role="status" className={cx(view === 'point' ? 'coord' : 'glass toast')}>
      {view === 'point' ? (
        t('mapControls.outbox.point', {
          lat: formatNumber(farm07.lat, locale, 2),
          lon: formatNumber(farm07.lon, locale, 2),
        })
      ) : (
        <>
          <span className="toast-ic" aria-hidden="true">
            {view === 'syncing' ? (
              <Spinner />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 3v7M5 7l3 3 3-3M3 13h10" className="ic" />
              </svg>
            )}
          </span>
          <span className="toast-t">
            <b>
              {view === 'syncing'
                ? t('mapControls.outbox.syncing')
                : t('mapControls.outbox.waiting', { count: actions.length })}
            </b>
            <span>
              {t(online ? 'mapControls.outbox.saved' : 'mapControls.outbox.offline', {
                time: queuedAt,
              })}
            </span>
          </span>
          {view === 'queued' ? (
            <button
              type="button"
              aria-label={t('mapControls.outbox.dismiss')}
              onClick={() => setDismissed(signature)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" className="ic" />
              </svg>
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
