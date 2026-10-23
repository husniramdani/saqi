import { farm07, type BlockDecision } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { SectionIndex } from './LandingIcons';
import { FarmMap } from './LandingMapArtwork';
import { landingDecisions, landingNightBars, landingScenarios } from './workedExample';

interface Props {
  view: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
}

const decisionById = new Map(landingDecisions.map((decision) => [decision.blockId, decision]));
const isStale = (decision: BlockDecision) =>
  decision.reasons.some((reason) => reason.code === 'SENSOR_STALE');
const CHIP: Record<BlockDecision['decision'], string> = {
  irrigate: 'chip solid',
  deficit: 'chip solid',
  skip: 'chip ok mint',
  pulse: 'chip',
};
const SCENARIO_WINDOW = new Map<string, string>(
  Object.values(landingScenarios).map((scenario) => [scenario.blockId, scenario.window]),
);

export function FarmSection({ view, onViewChange }: Props) {
  const { t } = useTranslation();
  const [first, second] = landingNightBars;
  return (
    <section className="wrap" id="tonight" style={{ paddingBottom: 'clamp(72px, 9vw, 128px)' }}>
      <div className="sec-head">
        <div>
          <SectionIndex number="04" label={t('landing.farm.eyebrow')} />
          <h2 className="h2">{t('landing.farm.title')}</h2>
        </div>
        <p className="lead">
          <span className="day-only">{t('landing.farm.lead')}</span>
          <span className="night-only">{t('landing.farm.leadNight')}</span>
        </p>
      </div>

      <div className="farm-panel">
        <div className="farm-top">
          <div className="badges">
            <Badge value={String(farm07.blocks.length)} label={t('landing.farm.metrics.blocks')} />
            <Badge
              value={`${farm07.pumpCapacityM3h} m³/h`}
              label={t('landing.farm.metrics.pump')}
            />
            <Badge
              value={`${farm07.nightWindow.start.slice(0, 2)}–${farm07.nightWindow.end.slice(0, 2)}`}
              label={t('landing.farm.metrics.window')}
            />
            <Badge
              value={String(farm07.sources.length)}
              label={t('landing.farm.metrics.sources')}
            />
          </div>
          <div className="seg" role="group" aria-label={t('landing.farm.views.label')}>
            <button
              type="button"
              className={view === 'map' ? 'on' : undefined}
              aria-pressed={view === 'map'}
              onClick={() => onViewChange('map')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 3.5h5v4H2zM9 3.5h5v4H9zM2 9h5v4H2zM9 9h5v4H9z" className="ic" />
              </svg>
              {t('landing.farm.views.map')}
            </button>
            <button
              type="button"
              className={view === 'list' ? 'on' : undefined}
              aria-pressed={view === 'list'}
              onClick={() => onViewChange('list')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.5M2.5 8h.5M2.5 12h.5" className="ic" />
              </svg>
              {t('landing.farm.views.list')}
            </button>
          </div>
        </div>

        {view === 'map' ? (
          <div className="farm-view">
            <FarmMap />
          </div>
        ) : null}
        {/* The table is the map's accessible alternative: always present, shown in List view. */}
        <div className={view === 'list' ? 'farm-view tbl-box' : 'sr-only'}>
          <FarmTable />
        </div>

        <div className="farm-foot">
          <div className="farm-faded" aria-hidden="true">
            FARM 07
          </div>
          <div className="tonight-card inv">
            <span className="num">{`№${landingNightBars.length}`}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="tc-title micro">{t('landing.farm.noteTitle')}</span>
              <p className="tc-body">
                {t('landing.farm.note', {
                  first: first?.blockId,
                  second: second?.blockId,
                  at: second?.start,
                  pump: String(farm07.pumpCapacityM3h),
                })}
              </p>
            </div>
          </div>
          <div className="legend">
            <div className="scale" role="img" aria-label={t('landing.farm.legend.water')}>
              <span className="lbl micro lg-dry">{t('landing.farm.legend.dry')}</span>
              {[0, 1, 2, 3, 4, 5, 6].map((step) => (
                <span key={step} className={`s sw${step}`} />
              ))}
              <span className="lbl micro lg-wet">{t('landing.farm.legend.wet')}</span>
            </div>
            <div className="scale">
              <span className="lg-hatch" />
              <span className="lbl day-only">{t('landing.farm.legend.stale')}</span>
              <span className="micro night-only">{t('landing.farm.legend.staleShort')}</span>
            </div>
            <div className="scale">
              <span className="lg-flow" />
              <span className="lbl micro">{t('landing.farm.legend.flow')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ value, label }: { value: string; label: string }) {
  return (
    <div className="badge">
      <b>
        <bdi dir="ltr">{value}</bdi>
      </b>
      <span>{label}</span>
    </div>
  );
}

function FarmTable() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <table className="tbl">
      <caption className="lbl micro tbl-cap">{t('landing.farm.table.caption')}</caption>
      <thead>
        <tr>
          <th scope="col">{t('landing.farm.table.block')}</th>
          <th scope="col">{t('landing.farm.table.crop')}</th>
          <th scope="col">{t('landing.farm.table.water')}</th>
          <th scope="col">{t('landing.farm.table.decision')}</th>
          <th scope="col">{t('landing.farm.table.volume')}</th>
          <th scope="col">{t('landing.farm.table.window')}</th>
        </tr>
      </thead>
      <tbody>
        {farm07.blocks.map((block) => {
          const decision = decisionById.get(block.id);
          if (!decision) return null;
          const stale = isStale(decision);
          const paw =
            decision.pawNow === null ? '—' : `${formatNumber(decision.pawNow, locale, 1)}%`;
          const window =
            SCENARIO_WINDOW.get(block.id) ??
            (decision.decision === 'pulse' ? landingScenarios.pulse.window : '');
          return (
            <tr key={block.id}>
              <td>
                <span className="mono">{block.id}</span>
                {` · ${block.name[locale]}`}
              </td>
              <td>{t(`block.crop.${block.crop}`)}</td>
              <td className="mono" data-label={t('landing.farm.table.water')}>
                {stale ? t('landing.farm.table.freshOnly', { paw }) : paw}
              </td>
              <td>
                <span className={stale ? 'chip warn ember' : CHIP[decision.decision]}>
                  {stale ? t('landing.farm.table.checkSensor') : t(`decision.${decision.decision}`)}
                </span>
              </td>
              <td className="mono" data-label={t('landing.farm.table.volume')}>
                {decision.volumeM3 > 0 ? (
                  <span dir="ltr">{`${formatNumber(decision.volumeM3, locale, 1)} m³`}</span>
                ) : (
                  t('landing.farm.table.saves', { volume: String(decision.savedVsFixedM3) })
                )}
              </td>
              <td className="mono" data-label={t('landing.farm.table.window')}>
                <span dir="ltr">{window || '—'}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
