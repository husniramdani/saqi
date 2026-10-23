import { blockById, farm07 } from '@saqi/shared';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { SectionIndex } from './LandingIcons';
import { landingPulses, landingScenarios, type LandingDecisionKey } from './workedExample';

interface Props {
  scenarioKey: LandingDecisionKey;
  onScenarioChange: (key: LandingDecisionKey) => void;
}

const KEYS: LandingDecisionKey[] = ['irrigate', 'skip', 'deficit', 'pulse'];
const CONFIDENCE_BARS = { high: 3, medium: 2, low: 1 } as const;

type Row = readonly [label: string, value: string];

/** The five reasons the reference narrates per decision, read off the engine's own numbers. */
function reasonRows(
  key: LandingDecisionKey,
  t: TFunction,
  fmt: (n: number, d?: number) => string,
): Row[] {
  const { decision, blockId } = landingScenarios[key];
  const block = blockById(farm07, blockId);
  const param = (code: string, name: string) =>
    Number(decision.reasons.find((reason) => reason.code === code)?.params[name] ?? 0);
  const paw: Row = [
    t(key === 'pulse' ? 'landing.decision.reasons.substrate' : 'landing.decision.reasons.paw'),
    `${fmt(decision.pawNow ?? 0)}%`,
  ];
  const et0: Row = [t('landing.decision.reasons.et0'), `${fmt(decision.et0Mm)} mm`];
  const crop: Row = [
    t('landing.decision.reasons.crop', { kc: fmt(block.kc, 2) }),
    `${fmt(decision.etcMm)} mm`,
  ];
  const projected: Row = [
    t('landing.decision.reasons.projected', { threshold: String(decision.threshold) }),
    `${fmt(decision.pawProjected ?? 0)}%`,
  ];
  const refill: Row = [
    t('landing.decision.reasons.refill', {
      target: String(decision.target),
      efficiency: String(Math.round(block.efficiency * 100)),
    }),
    `${fmt(param('REFILL_TO_TARGET', 'netMm'))} → ${fmt(param('REFILL_TO_TARGET', 'grossMm'))} mm`,
  ];
  switch (key) {
    case 'irrigate':
      return [paw, et0, crop, projected, refill];
    case 'skip':
      return [paw, et0, crop, projected, [t('landing.decision.reasons.hold'), t('decision.skip')]];
    case 'deficit':
      return [
        paw,
        crop,
        projected,
        refill,
        [t('landing.decision.reasons.budget'), `× ${fmt(param('BUDGET_DEFICIT', 'factor'), 2)}`],
      ];
    case 'pulse':
      return [
        paw,
        [
          t('landing.decision.reasons.greenhouse', { factor: String(block.et0Factor) }),
          `${fmt(decision.et0Mm * block.et0Factor)} mm`,
        ],
        crop,
        [t('landing.decision.reasons.noRefill', { threshold: String(decision.threshold) }), '—'],
        [
          t('landing.decision.reasons.split'),
          `${param('GREENHOUSE_PULSES', 'count')} × ${fmt(param('GREENHOUSE_PULSES', 'm3'))} m³`,
        ],
      ];
  }
}

export function DecisionSection({ scenarioKey, onScenarioChange }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const fmt = (n: number, digits = 1) => formatNumber(n, locale, digits);
  const scenario = landingScenarios[scenarioKey];
  const { decision } = scenario;
  const block = blockById(farm07, scenario.blockId);
  const area = fmt(block.areaHa, Number.isInteger(block.areaHa * 10) ? 1 : 2);
  const crop = t(`block.crop.${block.crop}`);
  const method = t(`block.method.${block.method}`);
  const meta =
    block.trees !== null
      ? t('landing.decision.meta.trees', { crop, area, trees: String(block.trees), method })
      : block.mode === 'pulse'
        ? t('landing.decision.meta.substrate', { crop, area, method })
        : t('landing.decision.meta.field', { crop, area, method });
  const factor = Number(
    decision.reasons.find((reason) => reason.code === 'BUDGET_DEFICIT')?.params['factor'] ?? 1,
  );
  const pulses = decision.reasons.find((reason) => reason.code === 'GREENHOUSE_PULSES')?.params;
  const sub = t(scenario.summaryKey, {
    litres: String(decision.litresPerTree ?? 0),
    saved: String(decision.savedVsFixedM3),
    pct: String(Math.round(factor * 100)),
    full: fmt(decision.volumeM3 / factor),
    count: String(pulses?.['count'] ?? 0),
    m3: fmt(Number(pulses?.['m3'] ?? 0)),
    minutes: String(landingPulses.minutes),
  });
  const bars = CONFIDENCE_BARS[decision.confidence];

  return (
    <section className="decide-sec paper-sec sec" id="decide">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <SectionIndex number="05" label={t('landing.decision.eyebrow')} />
            <h2 className="h2">{t('landing.decision.title')}</h2>
          </div>
          <p className="lead">{t('landing.decision.lead')}</p>
        </div>

        <div className="dec-grid">
          <div>
            <div className="dchips" role="group" aria-label={t('landing.decision.choose')}>
              {KEYS.map((key) => {
                const item = landingScenarios[key];
                const on = key === scenarioKey;
                return (
                  <button
                    key={key}
                    type="button"
                    className={on ? 'dchip on' : 'dchip'}
                    aria-pressed={on}
                    onClick={() => onScenarioChange(key)}
                  >
                    <span className="dk">{item.blockId}</span>
                    <span className="dchip-t">
                      {t(`decision.${item.decision.decision}`)}
                      <small>{t(`landing.decision.scenarios.${key}.hint`)}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <ol className="reasons" aria-live="polite">
              {reasonRows(scenarioKey, t, fmt).map(([label, value], index) => (
                <li key={`${scenarioKey}-${index}`} className="reason-row">
                  <span className="r-idx">{String(index + 1).padStart(2, '0')}</span>
                  <span className="r-label">{label}</span>
                  <span className="r-val" dir="ltr">
                    {value}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="dec-card inv" aria-label={t('landing.decision.recommendation')}>
            <div className="row-sb">
              <span className="lbl micro">
                {`${t(`landing.decision.when.${scenario.when}`)} · ${scenario.blockId}`}
              </span>
              <span className="chip ok mint">
                <span className="dot live" />
                {t('landing.decision.confidenceChip', {
                  level: t(`landing.decision.levels.${decision.confidence}`),
                })}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}>
                {block.name[locale]}
              </h3>
              <span className="lbl micro">{meta}</span>
            </div>
            <div className="dec-anim dec-word">{t(`decision.${decision.decision}`)}</div>
            <div className="dec-anim">
              <div className="num dec-vol">
                {decision.volumeM3 === 0 ? '0' : fmt(decision.volumeM3)}
                <i>m³</i>
              </div>
              <p className="dec-sub">{sub}</p>
            </div>
            <div className="dec-row">
              <span className="lbl micro">{t('landing.decision.window')}</span>
              <span
                className="mono"
                style={{ fontSize: 15 }}
                dir={scenario.window ? 'ltr' : undefined}
              >
                {scenario.window ? `${scenario.window} GST` : t('landing.decision.noIrrigation')}
              </span>
            </div>
            <div className="dec-row">
              <span className="lbl micro">{t('landing.decision.confidence')}</span>
              <span className="conf" aria-hidden="true">
                {[1, 2, 3].map((bar) => (
                  <span key={bar} className={bar <= bars ? 'on' : undefined} />
                ))}
              </span>
            </div>
          </aside>
        </div>

        <div className="formula">
          {(['taw', 'etc', 'volume'] as const).map((step) => (
            <div key={step}>
              <span className="lbl micro">{t(`landing.decision.formula.${step}`)}</span>
              <p className="formula-t">{t(`landing.decision.formula.${step}Text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
