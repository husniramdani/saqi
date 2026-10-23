import type { BlockDecision, ScheduleItem } from '@saqi/shared';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { fadeUpStagger, useGSAP, useMotion } from '@/motion';
import { useLocale } from '@/i18n';
import { ReasonText } from '@/i18n/ReasonText';
import { Chip, DECISION_CHIP, Figure, Panel } from '@/ui';
import { windowLabel } from '@/features/farm-map/window';

/** Tonight's decision as the headline, the volume, the window, and why, reason by reason. */
export function RecommendationCard({
  decision: d,
  schedule,
}: {
  decision: BlockDecision;
  schedule: ScheduleItem[];
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const window = windowLabel(d.blockId, schedule, locale);
  const reasons = useRef<HTMLOListElement>(null);
  const { reduced } = useMotion();
  const whyId = useId();
  // M7 · reasons rise in one after another when the card mounts or the decision changes.
  useGSAP(
    () => {
      if (reasons.current)
        fadeUpStagger(reasons.current.querySelectorAll('[data-reason]'), { reduced });
    },
    { dependencies: [d.blockId, d.decision, reduced] },
  );
  return (
    <Panel
      title={t('block.tonight')}
      actions={
        <Chip variant={d.confidence === 'low' ? 'warn' : 'outline'}>
          {t('block.confidence', { level: t(`confidence.${d.confidence}`) })}
        </Chip>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-light tracking-[-0.03em]">{t(`decision.${d.decision}`)}</p>
            <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <Figure value={d.volumeM3} unit="m³" size="lg" accent={d.volumeM3 > 0} />
            {d.litresPerTree === null || d.volumeM3 === 0 ? null : (
              <Figure value={d.litresPerTree} unit="L/tree" precision={0} size="md" />
            )}
          </div>
          {window ? <p className="num text-sm text-text-secondary">{window}</p> : null}
        </div>
        <div className="flex flex-col gap-2">
          <h3 id={whyId} className="text-xs font-medium text-text-muted">
            {t('block.why')}
          </h3>
          {d.reasons.length === 0 ? (
            <p className="text-text-secondary">{t('block.noReasons')}</p>
          ) : (
            <ol ref={reasons} aria-labelledby={whyId} className="flex flex-col">
              {d.reasons.map((r, i) => (
                <li
                  key={`${r.code}-${i}`}
                  data-reason={r.code}
                  className="border-t border-border py-2.5"
                >
                  <ReasonText reason={r} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Panel>
  );
}
