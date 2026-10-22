import { farm07 } from '@saqi/shared';
import { name, type } from '@saqi/tokens';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Arrow,
  Button,
  buttonClasses,
  Chip,
  DECISION_CHIP,
  EmptyState,
  ErrorState,
  Figure,
  Meter,
  MoistureSwatch,
  Panel,
  PillArrow,
  SegmentedControl,
  Skeleton,
  SourceDot,
  StaleTag,
  Stat,
  textLinkClasses,
  TimeTrack,
  Toggle,
} from '@/ui';
import { BlockList, FarmMap, MapLegend } from '@/features/farm-map';
import { scenarioDecisions, scenarioSchedule } from '@/features/farm-map/scenario';

// Dev-only review page (mounted at /dev/kitchen when import.meta.env.DEV). English only.

const SURFACES = [
  'background',
  'surface',
  'surface-raised',
  'surface-well',
  'border',
  'border-strong',
];
const INKS = ['text-primary', 'text-secondary', 'text-muted', 'accent', 'accent-text', 'focus'];
const STATUS = ['success', 'success-soft', 'warning', 'warning-soft', 'error', 'error-soft'];
const WATER = [0, 1, 2, 3, 4, 5, 6];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-border-strong py-12 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-light tracking-[-0.03em]">{title}</h2>
        {note ? <p className="text-sm text-text-secondary">{note}</p> : null}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Cell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-raised">
      <div className="flex flex-1 flex-wrap items-center justify-center gap-3">{children}</div>
      <span className="text-xs font-medium text-text-muted">{caption}</span>
    </div>
  );
}

function Swatches({ names }: { names: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {names.map((name) => (
        <div key={name} className="flex flex-col gap-1.5">
          <span
            className="h-16 rounded-md border border-border"
            style={{ background: `var(--color-${name})` }}
          />
          <span className="num text-xs font-medium">{name}</span>
        </div>
      ))}
    </div>
  );
}

export function Component() {
  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [view, setView] = useState<'map' | 'list'>('map');
  const [layer, setLayer] = useState(true);
  const [block, setBlock] = useState<string>('D-1');
  const [mapView, setMapView] = useState<'map' | 'list'>('map');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'night') root.dataset.theme = 'night';
    else delete root.dataset.theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);

  return (
    <div dir={dir} className="mx-auto max-w-[1280px] px-4 py-12 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-6 pb-10">
        <div className="flex flex-col gap-3">
          <span className="num text-sm text-accent-text">Read the soil.</span>
          <h1 className="text-[64px] leading-none font-light tracking-[-0.05em]">
            Kitchen <span className="text-accent-text">· {name}</span>
          </h1>
          <p className="max-w-[60ch] text-lg text-text-secondary">
            Every primitive in every state, straight from design.md. Flip the theme and the reading
            direction to check both.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SegmentedControl
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'night', label: 'Night' },
            ]}
          />
          <SegmentedControl
            label="Direction"
            value={dir}
            onChange={setDir}
            options={[
              { value: 'ltr', label: 'LTR' },
              { value: 'rtl', label: 'RTL' },
            ]}
          />
        </div>
      </header>

      <Section title="Colour" note="Every swatch reads its token, so it follows the theme.">
        <Swatches names={SURFACES} />
        <Swatches names={INKS} />
        <Swatches names={STATUS} />
      </Section>

      <Section
        title="Water"
        note="Plant-available water, dry → wet; darker always means wetter. Labels sit on ink tags, never on the fill."
      >
        <div className="grid grid-cols-7 gap-1">
          {WATER.map((step) => (
            <div
              key={step}
              className="flex h-20 items-end rounded-md p-2"
              style={{ background: `var(--color-water-${step})` }}
            >
              <span className="num rounded-sm bg-tag px-1.5 py-0.5 text-2xs text-tag-text">
                w{step}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          {[8, 30, 49, 68, 75, 84, 97].map((paw) => (
            <span key={paw} className="inline-flex items-center gap-2">
              <MoistureSwatch paw={paw} />
              <Figure value={paw} unit="%" precision={0} size="sm" />
            </span>
          ))}
          <span className="inline-flex items-center gap-2">
            <MoistureSwatch paw={null} /> no data
          </span>
        </div>
      </Section>

      <Section
        title="Type"
        note="Geist for words, Geist Mono for numbers. Labels never below 12.5 px."
      >
        <div className="flex flex-col">
          {[...type.scale].reverse().map((step) => (
            <div
              key={step.label}
              className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-4 border-b border-border py-3"
            >
              <span className="num text-xs text-text-muted">
                {step.label} · {step.size}
              </span>
              <span
                className="truncate"
                style={{
                  fontSize: step.size,
                  lineHeight: step.lineHeight,
                  fontWeight: parseFloat(step.size) > 40 ? 300 : 400,
                }}
              >
                Water what tonight needs
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Actions" note="One accent pill per view. Every target at least 44 px.">
        <div className="grid gap-3 md:grid-cols-3">
          <Cell caption="Primary pill · accent">
            <Button variant="accent" arrow>
              See tonight’s plan
            </Button>
          </Cell>
          <Cell caption="Ink pill · text link">
            <Button arrow>Open cockpit</Button>
            <a href="#how" className={textLinkClasses}>
              How it decides
            </a>
          </Cell>
          <Cell caption="Ghost · loading · disabled">
            <Button variant="ghost">Log irrigation</Button>
            <Button loading>Saving</Button>
            <Button variant="ghost" disabled>
              Disabled
            </Button>
          </Cell>
          <Cell caption="Link styled as a pill">
            <a href="#plan" className={buttonClasses({ variant: 'ink', arrow: true })}>
              View D-1 <PillArrow variant="ink" />
            </a>
          </Cell>
          <Cell caption="Field size · 56 px">
            <Button variant="accent" size="field">
              Mark done
            </Button>
          </Cell>
          <Cell caption="Orbit button · icon">
            <Button variant="accent" size="icon" aria-label="Open D-1">
              <Arrow />
            </Button>
          </Cell>
        </div>
      </Section>

      <Section title="Status" note="Colour is never alone: every state carries a word.">
        <div className="grid gap-3 md:grid-cols-3">
          <Cell caption="Decision chips">
            {(['irrigate', 'deficit', 'skip', 'pulse'] as const).map((d) => (
              <Chip key={d} variant={DECISION_CHIP[d]}>
                {d[0]?.toUpperCase()}
                {d.slice(1)}
              </Chip>
            ))}
          </Cell>
          <Cell caption="Status chips">
            <Chip variant="warn">Tight</Chip>
            <Chip variant="warn">Check sensor</Chip>
            <Chip variant="error">Over</Chip>
            <StaleTag hours={9} />
          </Cell>
          <Cell caption="Source dots">
            <div className="flex flex-col gap-3">
              <SourceDot source="live">Live · Open-Meteo</SourceDot>
              <SourceDot source="sim">Simulated sensors</SourceDot>
              <SourceDot source="off">Offline · stale</SourceDot>
            </div>
          </Cell>
        </div>
      </Section>

      <Section title="Figures and data" note="Mono value, unit small in text-muted beside it.">
        <div className="grid gap-3 md:grid-cols-3">
          <Cell caption="Figure sizes · accent = tonight">
            <div className="flex flex-col items-center gap-3">
              <Figure value={245.9} unit="m³" size="lg" />
              <Figure value={90.4} unit="m³" size="md" accent />
              <Figure value={68} unit="%" size="sm" />
            </div>
          </Cell>
          <Cell caption="Stat with delta">
            <Stat label="Saved vs fixed" value={62} unit="m³" precision={0} delta={-4} />
            <Stat label="ET₀ tomorrow" value={5.8} unit="mm" />
          </Cell>
          <Cell caption="Budget meter · tick at 97 %">
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <Figure value={98} unit="%" precision={0} size="md" />
                <Chip variant="warn">Tight</Chip>
              </div>
              <Meter
                value={0.98}
                mark={0.97}
                label="Projected 98 percent of the monthly allocation"
              />
            </div>
          </Cell>
          <Cell caption="Time track · 22:00 → 05:00 GST, 1 tick = 1 h">
            <div className="flex w-full flex-col gap-2">
              <div className="num flex justify-between text-2xs text-text-secondary">
                <span>22:00</span>
                <span>05:00</span>
              </div>
              <TimeTrack
                hours={7}
                bars={[{ from: 0, to: 3.02 / 7, label: 'D-1, 22:00 to 01:01, 90.4 m³' }]}
              />
              <TimeTrack
                hours={7}
                bars={[{ from: 3.02 / 7, to: 6.47 / 7, label: 'F-1, 01:01 to 04:28, 155.5 m³' }]}
              />
            </div>
          </Cell>
          <Cell caption="Segmented control · toggle">
            <SegmentedControl
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: 'map', label: 'Map' },
                { value: 'list', label: 'List' },
              ]}
            />
            <Toggle label="Show pipes" checked={layer} onChange={setLayer} />
          </Cell>
          <Cell caption="Language switch (own scripts)">
            <SegmentedControl
              label="Language"
              value="en"
              onChange={() => undefined}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'ar', label: 'ع', lang: 'ar' },
                { value: 'ur', label: 'ار', lang: 'ur' },
              ]}
            />
          </Cell>
        </div>
      </Section>

      <Section
        title="Farm map"
        note="The demo night: D-1 and F-1 watered tonight, D-3's 60 cm sensor stale. Hover or Tab through the blocks; arrows move, Enter selects."
      >
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-raised">
          <div className="flex items-center justify-between gap-3">
            <span className="text-md font-semibold">
              Farm 07 · selected <span className="num">{block}</span>
            </span>
            <SegmentedControl
              label="View"
              value={mapView}
              onChange={setMapView}
              options={[
                { value: 'map', label: 'Map' },
                { value: 'list', label: 'List' },
              ]}
            />
          </div>
          {mapView === 'map' ? (
            <FarmMap
              farm={farm07}
              decisions={scenarioDecisions}
              schedule={scenarioSchedule}
              selectedId={block}
              onSelect={setBlock}
            />
          ) : (
            <BlockList
              farm={farm07}
              decisions={scenarioDecisions}
              schedule={scenarioSchedule}
              onSelect={setBlock}
            />
          )}
          <MapLegend />
        </div>
      </Section>

      <Section
        title="Panel and states"
        note="Every data panel: loading, empty, error with retry, stale."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Panel
            title="Tonight’s plan"
            meta="Updated 21:04 GST"
            actions={<Chip variant="solid">2 blocks</Chip>}
          >
            <div className="flex gap-10">
              <Stat label="Planned tonight" value={245.9} unit="m³" size="lg" accent />
              <Stat label="Saved vs fixed" value={62} unit="m³" precision={0} size="lg" />
            </div>
          </Panel>
          <Panel title="Loading" meta="skeleton">
            <div className="flex flex-col gap-3">
              <Skeleton block={44} inline="60%" />
              <Skeleton block={12} />
              <Skeleton block={12} inline="80%" />
            </div>
          </Panel>
          <Panel title="Empty">
            <EmptyState title="No irrigation needed tonight.">
              Saves 112 m³ against a fixed schedule.
            </EmptyState>
          </Panel>
          <Panel title="Error">
            <ErrorState message="Couldn’t load tonight’s plan." onRetry={() => undefined} />
          </Panel>
        </div>
      </Section>
    </div>
  );
}
