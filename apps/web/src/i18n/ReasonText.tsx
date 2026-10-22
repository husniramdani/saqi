import type { Reason } from '@saqi/shared';
import { useTranslation } from 'react-i18next';

/** Renders an engine reason (code + params) in the active language. */
export function ReasonText({ reason }: { reason: Reason }) {
  const { t } = useTranslation();
  return <>{t(`reason.${reason.code}`, reason.params)}</>;
}
