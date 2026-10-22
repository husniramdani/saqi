import { AssigneeSchema, gstDate, type Assignee } from '@saqi/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTasks, useUpdateTask } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';

export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [today] = useState(() => gstDate(new Date()));
  // TODO(T17): persist the worker on the device.
  const [assignee, setAssignee] = useState<Assignee>('rahim');
  const tasks = useTasks(today, assignee);
  const updateTask = useUpdateTask();

  return (
    <>
      <h1>{t('field.title')}</h1>
      <label>
        {t('field.worker')}{' '}
        <select
          value={assignee}
          onChange={(e) => setAssignee(AssigneeSchema.parse(e.target.value))}
        >
          {AssigneeSchema.options.map((a) => (
            <option key={a} value={a}>
              {t(`field.workers.${a}`)}
            </option>
          ))}
        </select>
      </label>
      <QueryState query={tasks} isEmpty={(list) => list.length === 0} emptyText={t('field.empty')}>
        {(list) => (
          <>
            <p>{t('field.tasksToday', { date: today, count: list.length })}</p>
            <ul>
              {list.map((task) => (
                <li key={task.id}>
                  {task.blockId ?? t('field.farm')} · {task.title[locale]}{' '}
                  {task.status === 'done' ? (
                    <strong>{t('field.done')}</strong>
                  ) : (
                    <button
                      type="button"
                      disabled={updateTask.isPending}
                      onClick={() =>
                        updateTask.mutate({
                          id: task.id,
                          status: 'done',
                          clientUpdatedAt: task.updatedAt,
                        })
                      }
                    >
                      {t('field.markDone')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {updateTask.isError ? <p role="alert">{updateTask.error.message}</p> : null}
          </>
        )}
      </QueryState>
    </>
  );
}
