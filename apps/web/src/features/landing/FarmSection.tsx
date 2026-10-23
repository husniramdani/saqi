import { farm07 } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { Chip, DECISION_CHIP, SegmentedControl } from '@/ui';
import { LandingMapArtwork } from './LandingMapArtwork';
import { SectionIndex } from './TopSections';
import { landingDecisions, landingSchedule } from './workedExample';

interface Props {
  view: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
}

const decisionById = new Map(landingDecisions.map((decision) => [decision.blockId, decision]));

export function FarmSection({ view, onViewChange }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const options = [
    { value: 'map' as const, label: t('landing.farm.views.map') },
    { value: 'list' as const, label: t('landing.farm.views.list') },
  ];
  return (
    <section className="landing-wrap landing-section" id="tonight">
      <div className="landing-section-head">
        <div>
          <SectionIndex number="04" label={t('landing.farm.eyebrow')} />
          <h2>{t('landing.farm.title')}</h2>
        </div>
        <p>{t('landing.farm.lead')}</p>
      </div>
      <div className="landing-farm-panel">
        <div className="landing-farm-panel__top">
          <div className="landing-farm-metrics">
            <FarmMetric
              value={farm07.blocks.length.toString()}
              label={t('landing.farm.metrics.blocks')}
            />
            <FarmMetric
              value={`${farm07.pumpCapacityM3h} m³/h`}
              label={t('landing.farm.metrics.pump')}
            />
            <FarmMetric
              value={`${farm07.nightWindow.start.slice(0, 2)}–${farm07.nightWindow.end.slice(0, 2)}`}
              label={t('landing.farm.metrics.window')}
            />
            <FarmMetric
              value={farm07.sources.length.toString()}
              label={t('landing.farm.metrics.sources')}
            />
          </div>
          <SegmentedControl
            label={t('landing.farm.views.label')}
            options={options}
            value={view}
            onChange={onViewChange}
          />
        </div>
        {view === 'map' ? (
          <div className="landing-farm-map">
            <LandingMapArtwork variant="full" />
          </div>
        ) : null}
        <div className={view === 'map' ? 'sr-only' : 'landing-farm-table-wrap'}>
          <table className="landing-farm-table">
            <caption>{t('landing.farm.table.caption')}</caption>
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
                const runs = landingSchedule.filter((item) => item.blockId === block.id);
                const window =
                  runs.length > 0
                    ? runs[0]?.kind === 'pulse'
                      ? farm07.pulseTimes.join(' · ') + ' GST'
                      : block.id === 'D-1'
                        ? '22:00–01:01 GST'
                        : '01:01–04:28 GST'
                    : t('landing.farm.table.none');
                const amount =
                  decision.volumeM3 > 0
                    ? `${formatNumber(decision.volumeM3, locale, 1)} m³`
                    : t('landing.farm.table.saves', {
                        volume: formatNumber(decision.savedVsFixedM3, locale, 0),
                      });
                return (
                  <tr key={block.id}>
                    <td>
                      <span className="num">{block.id}</span> · {block.name[locale]}
                    </td>
                    <td>{t(`block.crop.${block.crop}`)}</td>
                    <td className="num">
                      {decision.pawNow === null
                        ? '—'
                        : `${formatNumber(decision.pawNow, locale, 1)}%`}
                    </td>
                    <td>
                      <Chip variant={DECISION_CHIP[decision.decision]}>
                        {block.id === 'D-3'
                          ? t('landing.farm.checkSensor')
                          : t(`decision.${decision.decision}`)}
                      </Chip>
                    </td>
                    <td className="num">{amount}</td>
                    <td className="num">{window}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="landing-farm-panel__foot">
          <aside className="landing-inverse landing-farm-note">
            <span className="num">№2</span>
            <div>
              <b>{t('landing.farm.noteTitle')}</b>
              <p>{t('landing.farm.note')}</p>
            </div>
          </aside>
          <div className="landing-map-legend">
            <div aria-label={t('landing.farm.legend.water')}>
              <span className="landing-label">{t('landing.farm.legend.dry')}</span>
              {Array.from({ length: 7 }, (_, index) => (
                <i key={index} style={{ background: `var(--color-water-${index})` }} />
              ))}
              <span className="landing-label">{t('landing.farm.legend.wet')}</span>
            </div>
            <div>
              <i className="landing-map-legend__stale" />
              <span className="landing-label">{t('landing.farm.legend.stale')}</span>
            </div>
            <div>
              <i className="landing-map-legend__flow" />
              <span className="landing-label">{t('landing.farm.legend.flow')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FarmMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="landing-farm-metric">
      <b className="num">{value}</b>
      <span>{label}</span>
    </div>
  );
}
