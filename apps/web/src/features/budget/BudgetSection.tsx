import type { Budget, BlockDecision, BudgetStatus } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber, intlLocale } from '@/i18n/format';

export const BUDGET_CHIP: Record<BudgetStatus, string> = {
  ok: 'chip ok',
  tight: 'chip warn',
  over: 'chip warn',
};

/** The month counts as tight from 97 % of the allocation (the meter's tick). */
const TIGHT = 0.97;

/**
 * Monthly water budget (design/dashboard.html Water tab): projected share of the allocation,
 * the 97 % tight line, and why cuts happened.
 */
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
  const pct = Math.round(share * 100);
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
    <section className="sect">
      <div className="sect-h">
        <h3 className="lbl">{t('today.budget', { month })}</h3>
        <span className={BUDGET_CHIP[budget.status]}>
          {t(`today.budgetStatus.${budget.status}`)}
        </span>
      </div>
      <span className="num budget-pct">
        {formatNumber(pct, locale, 0)}
        <i>%</i>
      </span>
      <div
        className="meter"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t('today.budgetMeter', { pct })}
      >
        <span
          className="meter-fill"
          data-meter-fill
          style={{ inlineSize: `${Math.min(100, share * 100)}%` }}
        />
        <span className="meter-tick" style={{ insetInlineStart: `${TIGHT * 100}%` }} />
      </div>
      <div className="sect-row">
        <span className="m budget-used">
          {t('today.budgetUsed', {
            used: formatNumber(budget.projectedAfterPlanM3, locale, 0),
            allocation: formatNumber(budget.allocationM3, locale, 0),
          })}
        </span>
        <span className="lbl">{t('today.budgetProjected')}</span>
      </div>
      {cuts.length > 0 ? (
        <p>
          {t('today.deficitNote', {
            over,
            count: cuts.length,
            cuts: new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(cuts),
          })}
        </p>
      ) : null}
    </section>
  );
}
