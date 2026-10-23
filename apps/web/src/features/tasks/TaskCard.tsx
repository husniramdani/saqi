import type { Task } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { Button, cx } from '@/ui';

interface TaskCardProps {
  task: Task;
  /** One line under the title, e.g. "Inspect · Khalas palms". */
  context: string;
  done: boolean;
  onMarkDone?: (task: Task) => void;
}

/**
 * A field task. Only the "Mark done" button is a target (a whole-card tap is too easy to hit by
 * accident outdoors). The check and the strike line are always in the DOM, hidden until done,
 * so M9 can draw them in place before the card moves to "Done today".
 */
export function TaskCard({ task, context, done, onMarkDone }: TaskCardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <article
      data-flip-id={`task-${task.id}`}
      className={cx(
        'relative flex flex-col gap-4 rounded-lg border border-border p-5',
        done ? 'bg-surface-well' : 'bg-surface shadow-raised',
      )}
    >
      <svg
        data-task-check
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={cx(
          'absolute end-5 top-5 size-6 text-success rtl:-scale-x-100',
          !done && 'invisible',
        )}
      >
        <path
          d="M4 12.5l5 5L20 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex min-w-0 flex-col gap-1 pe-9">
        <h3 className="relative self-start text-lg font-medium text-text-primary">
          {task.title[locale]}
          <span
            data-task-strike
            aria-hidden="true"
            className={cx(
              'absolute inset-x-0 top-1/2 h-0.5 origin-left bg-text-primary rtl:origin-right',
              !done && 'invisible',
            )}
          />
        </h3>
        <p className="text-sm text-text-secondary">{context}</p>
        {done && task.note ? <p className="text-sm text-text-muted">{task.note}</p> : null}
      </div>
      {done ? (
        <span className="sr-only">{t('field.done')}</span>
      ) : (
        <Button size="field" variant="ink" onClick={() => onMarkDone?.(task)}>
          {t('field.markDone')}
        </Button>
      )}
    </article>
  );
}
