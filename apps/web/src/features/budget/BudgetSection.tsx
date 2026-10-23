import type { Budget, BlockDecision, BudgetStatus } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '@/i18n/format';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { Chip, Figure, Meter, type ChipVariant } from '@/ui';

export const BUDGET_CHIP: Record<BudgetStatus, ChipVariant> = {
  ok: 'ok',
  tight: 'warn',
  over: 'error',
};

/** Monthly water budget: projected share of the allocation, the 97 % tight line, and why cuts happened. */
export function BudgetSection({
  budget,
  decisions,
}: {
  budget: Budget;
  decisions: BlockDecision[];
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const share = budget.allocationM3 > 0 ? budget.projectedAfterPlanM3 / budget.allocationM3 : 0;
  const month = new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${budget.month}-01T00:00:00Z`));
  // Each cut block at its own share: the guard cuts tiers by different factors (0.7, 0.85).
  const cuts = decisions.flatMap((d) => {
    const factor = d.reasons.find((r) => r.code === 'BUDGET_DEFICIT')?.params['factor'];
    return typeof factor === 'number'
      ? [`${d.blockId} ${formatNumber(factor * 100, locale, 0)}%`]
      : [];
  });
  const overPct =
    budget.allocationM3 > 0 ? Math.max(0, (budget.projectedM3 / budget.allocationM3 - 1) * 100) : 0;
  // Under 1 % a whole number reads "heading 0% over"; one decimal keeps the reason visible.
  const over = formatNumber(overPct, locale, overPct < 1 ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium text-text-muted">{t('today.budget', { month })}</h3>
        <Chip variant={BUDGET_CHIP[budget.status]}>{t(`today.budgetStatus.${budget.status}`)}</Chip>
      </div>
      <Figure value={share * 100} unit="%" precision={0} size="lg" />
      <Meter
        value={share}
        mark={0.97}
        label={t('today.budgetMeter', { pct: Math.round(share * 100) })}
      />
      <div className="flex justify-between text-xs">
        <span className="num text-text-primary">
          {t('today.budgetUsed', {
            used: formatNumber(budget.projectedAfterPlanM3, locale, 0),
            allocation: formatNumber(budget.allocationM3, locale, 0),
          })}
        </span>
        <span className="text-text-muted">{t('today.budgetProjected')}</span>
      </div>
      {cuts.length > 0 ? (
        <p className="text-sm text-text-secondary">
          {t('today.deficitNote', {
            over,
            count: cuts.length,
            cuts: new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(cuts),
          })}
        </p>
      ) : null}
    </div>
  );
}
