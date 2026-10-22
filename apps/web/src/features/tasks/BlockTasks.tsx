import type { Task } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLocale } from '@/i18n';
import { Chip, EmptyState, textLinkClasses } from '@/ui';

/** Today's tasks on this block, read-only here; they are done from Field. */
export function BlockTasks({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-3">
      {tasks.length === 0 ? (
        <EmptyState title={t('block.noTasks')} />
      ) : (
        <ul className="flex flex-col">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
            >
              <span className="flex flex-col gap-0.5">
                <span>{task.title[locale]}</span>
                <span className="text-xs text-text-muted">
                  {t(`field.workers.${task.assignee}`)}
                </span>
              </span>
              {task.status === 'done' ? (
                <Chip variant="ok">{t('field.done')}</Chip>
              ) : (
                <Chip>{t(`task.kind.${task.kind}`)}</Chip>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link to="/field" className={`${textLinkClasses} self-start`}>
        {t('block.openField')}
      </Link>
    </div>
  );
}
