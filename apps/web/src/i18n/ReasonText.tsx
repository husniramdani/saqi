import type { Reason } from '@saqi/shared';
import { useTranslation } from 'react-i18next';

/** Renders an engine reason (code + params) in the active language. */
export function ReasonText({ reason }: { reason: Reason }) {
  const { t } = useTranslation();
  if (reason.code === 'SENSOR_STALE') {
    // People know a sensor by its depth, not by its internal ID ("D-3-60", "G-1-S").
    const cm = /-(\d+)$/.exec(String(reason.params['sensorId']))?.[1];
    const sensor = cm ? `\u2066${cm} cm\u2069` : t('reason.substrate');
    return <>{t('reason.SENSOR_STALE', { ...reason.params, sensor })}</>;
  }
  return <>{t(`reason.${reason.code}`, reason.params)}</>;
}
