import { AssigneeSchema, gstDate, type Assignee } from '@saqi/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTasks, useUpdateTask } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { formatDateGst } from '@/i18n/format';
import { Button, Chip, SegmentedControl, Skeleton } from '@/ui';

// TODO(T17): done sheet (note, photo), offline outbox, worker persisted on the device.
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [today] = useState(() => gstDate(new Date()));
  const [assignee, setAssignee] = useState<Assignee>('rahim');
  const tasks = useTasks(today, assignee);
  const updateTask = useUpdateTask();

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6 pt-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-light tracking-[-0.035em]">{t('field.title')}</h1>
        <SegmentedControl
          label={t('field.worker')}
          value={assignee}
          onChange={setAssignee}
          options={AssigneeSchema.options.map((a) => ({
            value: a,
            label: t(`field.workers.${a}`),
          }))}
        />
      </div>
      <QueryState
        query={tasks}
        isEmpty={(list) => list.length === 0}
        emptyText={t('field.empty')}
        skeleton={<Skeleton block={320} />}
      >
        {(list) => (
          <>
            <p className="text-text-secondary">
              {t('field.subtitle', { date: formatDateGst(today, locale), count: list.length })}
            </p>
            <ul className="flex flex-col gap-3">
              {list.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-medium">{task.title[locale]}</p>
                    <span className="num shrink-0 text-sm text-text-muted">
                      {task.blockId ?? t('field.farm')}
                    </span>
                  </div>
                  {task.status === 'done' ? (
                    <Chip variant="ok">{t('field.done')}</Chip>
                  ) : (
                    <Button
                      size="field"
                      loading={updateTask.isPending && updateTask.variables.id === task.id}
                      onClick={() =>
                        updateTask.mutate({
                          id: task.id,
                          status: 'done',
                          clientUpdatedAt: task.updatedAt,
                        })
                      }
                    >
                      {t('field.markDone')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {updateTask.isError ? (
              <p role="alert" className="text-error">
                {updateTask.error.message}
              </p>
            ) : null}
          </>
        )}
      </QueryState>
    </div>
  );
}
