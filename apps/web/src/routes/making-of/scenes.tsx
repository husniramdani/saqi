import { blockById, farm07 } from '@saqi/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FarmMap } from '@/features/farm-map';
import { useLocale } from '@/i18n';
import { formatM3, formatNumber } from '@/i18n/format';
import { ReasonText } from '@/i18n/ReasonText';
import { Chip, DECISION_CHIP, textLinkClasses } from '@/ui';
import { d1Formula, miniMapDecisions, storyDecisions } from '@/features/landing/workedExample';
import type { TestStats } from '@/features/test-stats/data';

/**
 * The five scenes as plain, readable sections. Motion (storyMotion.ts) only adds to them: with
 * no JS, reduced motion or a phone, every word, number and picture is already on the page.
 * Pinned-only layout (stacked cards, the map over the water scale) waits for `data-story="pinned"`.
 */

function Scene({
  n,
  title,
  body,
  children,
}: {
  n: number;
  title: string;
  body: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      data-scene={n}
      aria-labelledby={`scene-${n}`}
      className="grid items-center gap-10 py-16 md:min-h-svh md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16 md:py-0"
    >
      <div className="flex flex-col gap-5">
        <span className="num text-sm text-accent-text">{String(n).padStart(2, '0')}</span>
        <h2
          id={`scene-${n}`}
          data-split
          className="text-[40px] leading-[1.05] font-light tracking-[-0.03em] md:text-[64px]"
        >
          {title}
        </h2>
        <div className="max-w-[44ch] text-lg text-text-secondary">{body}</div>
      </div>
      {children ? <div data-visual>{children}</div> : null}
    </section>
  );
}

/** The seven water-scale steps, dry (0) to wet (6), as the map paints them. */
const WATER_STEPS = [0, 1, 2, 3, 4, 5, 6] as const;

export function DesignScene() {
  const { t } = useTranslation();
  return (
    <Scene n={1} title={t('makingOf.scene1.title')} body={t('makingOf.scene1.body')}>
      <div className="grid gap-8 group-data-[story=pinned]:[&>*]:[grid-area:1/1]">
        <figure className="flex flex-col gap-3 self-center">
          <div
            data-palette
            className="flex gap-2"
            role="img"
            aria-label={t('makingOf.scene1.palette')}
          >
            {WATER_STEPS.map((step) => (
              <span
                key={step}
                data-swatch
                className="h-16 flex-1 rounded-md border border-border-strong"
                style={{ backgroundColor: `var(--color-water-${step})` }}
              />
            ))}
          </div>
          <div
            data-scale-label
            aria-hidden="true"
            className="flex justify-between gap-4 text-sm text-text-muted"
          >
            <span>{t('makingOf.scene1.dry')}</span>
            <span>{t('makingOf.scene1.wet')}</span>
          </div>
          <figcaption data-scale-label className="text-sm text-text-secondary">
            {t('makingOf.scene1.caption')}
          </figcaption>
        </figure>
        <div
          data-mini-map
          inert
          aria-hidden="true"
          className="self-center group-data-[story=pinned]:opacity-0"
        >
          <FarmMap
            farm={farm07}
            decisions={miniMapDecisions()}
            schedule={[]}
            onSelect={() => undefined}
          />
        </div>
      </div>
    </Scene>
  );
}

/** One formula term: its name above, its D-1 value below (the value counts up when pinned). */
function Term({ label, value, digits }: { label: string; value: number; digits: number }) {
  const locale = useLocale();
  const shown = formatNumber(value, locale, digits);
  return (
    <span data-term className="inline-flex flex-col items-center gap-1">
      {/* The label follows its own script; the arithmetic around it stays left to right. */}
      <span dir="auto" className="max-w-[16ch] text-center text-sm text-text-muted">
        {label}
      </span>
      <span
        className="num text-2xl text-text-primary"
        data-count={value}
        data-digits={digits}
        data-final={shown}
      >
        {shown}
      </span>
    </span>
  );
}

const Op = ({ children }: { children: ReactNode }) => (
  <span data-term className="num self-end pb-1 text-2xl text-text-muted">
    {children}
  </span>
);

export function WaterScene() {
  const { t } = useTranslation();
  const locale = useLocale();
  const f = d1Formula;
  const term = (key: string) => t(`makingOf.scene2.terms.${key}`);
  return (
    <Scene
      n={2}
      title={t('makingOf.scene2.title')}
      body={
        <>
          <p>{t('makingOf.scene2.body')}</p>
          <p className="mt-3 text-sm text-text-secondary">{t('makingOf.scene2.note')}</p>
        </>
      }
    >
      <figure className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 shadow-raised">
        {/* Arithmetic reads left to right in every locale. */}
        <div dir="ltr" className="flex flex-wrap items-end gap-x-3 gap-y-5">
          <Op>(</Op>
          <Term label={term('target')} value={f.target} digits={0} />
          <Op>−</Op>
          <Term label={term('projected')} value={f.projected} digits={2} />
          <Op>) / 100 ×</Op>
          <Term label={term('taw')} value={f.taw} digits={0} />
          <Op>÷</Op>
          <Term label={term('efficiency')} value={f.efficiency} digits={2} />
          <Op>×</Op>
          <Term label={term('area')} value={f.area} digits={1} />
          <Op>× 10 ×</Op>
          <Term label={term('wetted')} value={f.wetted} digits={2} />
        </div>
        <p data-term className="flex items-baseline gap-3 border-t border-border pt-5">
          <span className="text-text-secondary">{term('volume')}</span>
          <span
            className="num text-[44px] leading-none font-light text-accent-text"
            data-count={f.volume}
            data-digits={1}
            data-final={formatNumber(f.volume, locale)}
          >
            {formatNumber(f.volume, locale)}
          </span>
          <span className="num text-xl text-text-muted">m³</span>
        </p>
      </figure>
    </Scene>
  );
}

export function ReasonsScene() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <Scene n={3} title={t('makingOf.scene3.title')} body={t('makingOf.scene3.body')}>
      <ol className="grid gap-4 group-data-[story=pinned]:[&>*]:[grid-area:1/1]">
        {storyDecisions().map((d) => (
          <li
            key={d.blockId}
            data-card
            className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-raised"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="num text-sm text-text-muted">{d.blockId}</span>
                <span className="font-medium">{blockById(farm07, d.blockId).name[locale]}</span>
              </span>
              <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
            </div>
            <p className="num text-3xl font-light">{formatM3(d.volumeM3, locale)}</p>
            <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
              {d.reasons.map((r, i) => (
                <li key={`${r.code}-${i}`} data-reason>
                  <ReasonText reason={r} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Scene>
  );
}

export function TestsScene({ stats }: { stats: TestStats }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const items: { key: string; value: number | null }[] = [
    { key: 'engine', value: stats.engine },
    { key: 'api', value: stats.api },
    { key: 'web', value: stats.web },
    { key: 'e2e', value: stats.e2e || null },
  ];
  return (
    <Scene n={4} title={t('makingOf.scene4.title')} body={t('makingOf.scene4.body')}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        {items.map(({ key, value }) => {
          const shown = value === null ? '—' : formatNumber(value, locale, 0);
          return (
            <div key={key} data-stat className="flex flex-col gap-1 border-t border-border pt-3">
              <dt className="text-sm text-text-muted">{t(`makingOf.scene4.stats.${key}`)}</dt>
              <dd className="num text-[40px] leading-none font-light">
                <span
                  {...(value === null
                    ? {}
                    : { 'data-count': value, 'data-digits': 0, 'data-final': shown })}
                >
                  {shown}
                </span>
              </dd>
              {value === null ? (
                <dd className="text-xs text-text-secondary">{t('makingOf.scene4.pending')}</dd>
              ) : null}
            </div>
          );
        })}
      </dl>
    </Scene>
  );
}

/** The ending: the app itself, and the one person behind it. */
const LINKS: { key: string; href: string; external: boolean }[] = [
  { key: 'app', href: '/today', external: false },
  { key: 'author', href: 'https://github.com/husniramdani', external: true },
];

export function AuthorScene() {
  const { t } = useTranslation();
  return (
    <Scene n={5} title={t('makingOf.scene5.title')} body={t('makingOf.scene5.body')}>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {LINKS.map((l) => (
          <li key={l.key}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noreferrer" className={textLinkClasses}>
                {t(`makingOf.scene5.links.${l.key}`)}
              </a>
            ) : (
              <Link to={l.href} className={textLinkClasses}>
                {t(`makingOf.scene5.links.${l.key}`)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Scene>
  );
}
