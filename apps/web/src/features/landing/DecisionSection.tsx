import { blockById, farm07 } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { ReasonText } from '@/i18n/ReasonText';
import { useLocale } from '@/i18n';
import { Chip, Figure } from '@/ui';
import { SectionIndex } from './TopSections';
import { landingScenarios, type LandingDecisionKey } from './workedExample';

interface Props {
  scenarioKey: LandingDecisionKey;
  onScenarioChange: (key: LandingDecisionKey) => void;
}

const KEYS: LandingDecisionKey[] = ['irrigate', 'skip', 'deficit', 'pulse'];

export function DecisionSection({ scenarioKey, onScenarioChange }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const scenario = landingScenarios[scenarioKey];
  const decision = scenario.decision;
  const block = blockById(farm07, scenario.blockId);
  return (
    <section className="landing-decision landing-section" id="decide">
      <div className="landing-wrap">
        <div className="landing-section-head">
          <div>
            <SectionIndex number="05" label={t('landing.decision.eyebrow')} />
            <h2>{t('landing.decision.title')}</h2>
          </div>
          <p>{t('landing.decision.lead')}</p>
        </div>
        <div className="landing-decision__grid">
          <div>
            <div
              className="landing-decision__choices"
              role="group"
              aria-label={t('landing.decision.choose')}
            >
              {KEYS.map((key) => {
                const item = landingScenarios[key];
                const selected = key === scenarioKey;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onScenarioChange(key)}
                  >
                    <span className="num">{item.blockId}</span>
                    <span>
                      <b>{t(`decision.${item.decision.decision}`)}</b>
                      <small>{t(`landing.decision.scenarios.${key}.hint`)}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <ol className="landing-reasons" aria-live="polite">
              {decision.reasons.map((reason, index) => (
                <li key={`${reason.code}-${index}`}>
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <ReasonText reason={reason} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <aside
            className="landing-inverse landing-recommendation"
            aria-label={t('landing.decision.recommendation')}
            aria-live="polite"
          >
            <div className="landing-row">
              <span className="landing-label">
                {t(`landing.${scenario.when}`)} · <span className="num">{scenario.blockId}</span>
              </span>
              <Chip variant={decision.confidence === 'low' ? 'warn' : 'ok'}>
                {t(`confidence.${decision.confidence}`)}
              </Chip>
            </div>
            <div>
              <h3>{block.name[locale]}</h3>
              <span className="landing-label">
                {t(`block.crop.${block.crop}`)} · {t('block.area', { ha: block.areaHa })}
              </span>
            </div>
            <strong className="landing-recommendation__word">
              {t(`decision.${decision.decision}`)}
            </strong>
            <div>
              <Figure value={decision.volumeM3} unit="m³" precision={1} size="xl" accent />
              <p>{t(scenario.summaryKey, { saved: decision.savedVsFixedM3 })}</p>
            </div>
            <div className="landing-recommendation__row">
              <span className="landing-label">{t('landing.decision.window')}</span>
              <span className="num">
                {scenarioKey === 'skip' ? t('landing.farm.table.none') : scenario.window}
              </span>
            </div>
            <div className="landing-recommendation__row">
              <span className="landing-label">{t('landing.decision.confidence')}</span>
              <span>{t(`confidence.${decision.confidence}`)}</span>
            </div>
          </aside>
        </div>
        <div className="landing-formula">
          <div>
            <span className="landing-label">{t('landing.decision.formula.taw')}</span>
            <code>TAW = (FC − WP) × root depth</code>
          </div>
          <div>
            <span className="landing-label">{t('landing.decision.formula.etc')}</span>
            <code>ETc = Kc × ET₀ × factor</code>
          </div>
          <div>
            <span className="landing-label">{t('landing.decision.formula.volume')}</span>
            <code>m³ = gross mm × ha × 10 × wetted</code>
          </div>
        </div>
      </div>
    </section>
  );
}
