import type { Block, BlockDecision, Farm } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber, intlLocale } from '@/i18n/format';
import { cx } from '@/ui';
import { byRisk } from './risk';
import { SelectedBlockRailDetail } from './SelectedBlockRailDetail';

/** Crop marks from design/dashboard.html: palm, greenhouse tunnel, fodder grass. */
const CROP_ICON = {
  palm: 'M8 15V7M8 7Q5 3.5 1.5 5M8 7Q11 3.5 14.5 5M8 7Q8 3.5 10.5 1.5M8 7Q6.5 4 4.5 2',
  house: 'M2 13V9a6 6 0 0 1 12 0v4M2 13h12M6 13V8.5M10 13V8.5',
  grass: 'M4 14C4 10 3 7 2 5M8 14V3M12 14c0-4 1-7 2-9M6 14c0-3-.5-5-1.5-6.5M10 14c0-3 .5-5 1.5-6.5',
} as const;

const cropIcon = (block: Block | undefined) =>
  block?.crop === 'date_palm'
    ? CROP_ICON.palm
    : block?.mode === 'pulse'
      ? CROP_ICON.house
      : CROP_ICON.grass;

/**
 * Left rail (design/dashboard.html "Blocks"): every block, riskiest first, with its crop, area,
 * method and water now. The selected block opens to show why: projected water, each simulated
 * sensor, tonight's figures and the last 14 days. Opening the open row again closes it.
 */
export function BlockRail({
  farm,
  decisions,
  selectedId,
  onSelect,
}: {
  farm: Farm;
  decisions: BlockDecision[];
  selectedId?: string | null | undefined;
  onSelect: (blockId: string | null) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const hectares = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  return (
    <ul>
      {byRisk(decisions).map((d) => {
        const open = d.blockId === selectedId;
        const panelId = `rail-${d.blockId}`;
        const block = farm.blocks.find((b) => b.id === d.blockId);
        return (
          <li key={d.blockId} className={cx('blk', open && 'open')}>
            <button
              type="button"
              className="blk-h"
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              onClick={() => onSelect(open ? null : d.blockId)}
            >
              <span className="crop" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d={cropIcon(block)} className="ic" />
                </svg>
              </span>
              <span className="blk-n">
                <b>
                  {d.blockId} · {block?.name[locale] ?? d.blockId}
                </b>
                {block ? (
                  <span>
                    {[
                      t(`block.crop.${block.crop}`),
                      /\bcoco\b/.test(block.variety) ? t('rail.coco') : null,
                      t('block.area', { ha: hectares.format(block.areaHa) }),
                      t(`block.method.${block.method}`),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                ) : null}
              </span>
              {d.pawNow === null ? (
                <span className="lbl">{t('state.noData')}</span>
              ) : (
                <span className={cx('num blk-v', d.pawNow < d.threshold && 'low')}>
                  {formatNumber(d.pawNow, locale)}
                  <i>%</i>
                </span>
              )}
              <svg className="chev" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 6L8 10.5 12.5 6" className="ic" />
              </svg>
            </button>
            {open ? (
              <SelectedBlockRailDetail
                id={panelId}
                decision={d}
                sensors={farm.sensors.filter((s) => s.blockId === d.blockId)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
