import { gstDate, type IrrigationEvent } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatDateGst, formatTimeGst } from '@/i18n/format';
import { EmptyState, Figure } from '@/ui';

// One line per cell: on a phone the box scrolls sideways instead of doubling every row. The
// header row stays put while the box scrolls (separate borders, so its rule sticks with it).
const th =
  'sticky top-0 z-[1] border-b border-border bg-surface py-2 pe-4 text-start text-xs font-medium whitespace-nowrap text-text-muted';
const td = 'border-b border-border py-2.5 pe-4 align-middle whitespace-nowrap';

/** Past irrigation, newest first (the API sorts). Manual logs are marked as such. */
export function EventsTable({ events }: { events: IrrigationEvent[] }) {
  const { t } = useTranslation();
  const locale = useLocale();
  if (events.length === 0) return <EmptyState title={t('block.noEvents')} />;
  return (
    // A scroll box keyboard users can reach and scroll (arrow keys), named for screen readers.
    <div
      role="region"
      aria-label={t('block.irrigationEvents')}
      tabIndex={0}
      className="max-h-96 overflow-auto rounded-sm"
    >
      <table className="w-full min-w-[420px] border-separate border-spacing-0">
        <thead>
          <tr>
            {(['date', 'start', 'duration', 'volume', 'source'] as const).map((c) => (
              <th key={c} scope="col" className={th}>
                {t(`block.eventCols.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className={td}>{formatDateGst(gstDate(e.startedAt), locale)}</td>
              {/* `num` (LTR, mono) wraps the value, never the cell: on the cell it would turn
                  `text-align: start` into left in Arabic, away from its header. */}
              <td className={td}>
                <span className="num">{formatTimeGst(e.startedAt, locale)}</span>
              </td>
              {/* Mono and tabular, but in the reading direction: "171 دقيقة" keeps its order. */}
              <td className={`${td} font-mono text-text-secondary tabular-nums`}>
                {t('block.minutes', {
                  min: Math.round((Date.parse(e.endedAt) - Date.parse(e.startedAt)) / 60_000),
                })}
              </td>
              <td className={td}>
                <Figure value={e.volumeM3} unit="m³" size="sm" />
              </td>
              <td className={`${td} text-text-secondary`}>{t(`block.source.${e.source}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
