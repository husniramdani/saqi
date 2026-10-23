import { AssigneeSchema, gstDate, type Assignee, type Block, type Task } from '@saqi/shared';
import type { Flip } from 'gsap/Flip';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutboxCount, useOutboxSyncing, useQueuedTaskIds } from '@/api/outbox';
import { useFarm, useTasks, useUpdateTask } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { usePageTitle } from '@/app/usePageTitle';
import { useOnline } from '@/app/useOnline';
import { DoneSheet } from '@/features/tasks/DoneSheet';
import { TaskCard } from '@/features/tasks/TaskCard';
import { playTaskDone, TASK_CARDS } from '@/features/tasks/taskDone';
import { useLocale } from '@/i18n';
import { formatDateGst } from '@/i18n/format';
import { duration, ease, getFlip, useMotion } from '@/motion';
import { Chip, SegmentedControl, Skeleton } from '@/ui';

const WORKER_KEY = 'saqi.worker';

function readWorker(): Assignee {
  try {
    const parsed = AssigneeSchema.safeParse(localStorage.getItem(WORKER_KEY));
    return parsed.success ? parsed.data : 'rahim';
  } catch {
    return 'rahim';
  }
}
function saveWorker(worker: Assignee) {
  try {
    localStorage.setItem(WORKER_KEY, worker);
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
}

/** Farm-level tasks first, then by block in farm order. */
function groupByBlock(tasks: Task[], blocks: Block[]) {
  const groups = new Map<string | null, Task[]>([[null, []]]);
  for (const b of blocks) groups.set(b.id, []);
  for (const task of tasks) {
    const list = groups.get(task.blockId);
    if (list) list.push(task);
    else groups.set(task.blockId, [task]);
  }
  return [...groups].filter(([, list]) => list.length > 0);
}

/** The phone view a worker uses outdoors: today's tasks, a mark-done sheet, offline-safe. */
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { reduced } = useMotion();
  const [today] = useState(() => gstDate(new Date()));
  const [worker, setWorker] = useState(readWorker);
  const [sheetTask, setSheetTask] = useState<Task | null>(null);
  const [doneOpen, setDoneOpen] = useState(true);
  const farm = useFarm();
  const tasks = useTasks(today, worker);
  const updateTask = useUpdateTask();
  const queued = useQueuedTaskIds();
  usePageTitle(t('field.title'));

  // M9 · second half: the Flip state recorded before the move plays once the done list changes.
  const pendingFlip = useRef<Flip.FlipState | null>(null);
  const isDone = (task: Task) => task.status === 'done' || queued.has(task.id);
  const doneKey = (tasks.data ?? [])
    .filter(isDone)
    .map((task) => task.id)
    .join();
  // After a confirm the opener ("Mark done") is gone, so focus follows the task to "Done today".
  const doneSummary = useRef<HTMLElement>(null);
  const focusDone = useRef(false);
  useLayoutEffect(() => {
    if (focusDone.current && doneSummary.current) {
      focusDone.current = false;
      doneSummary.current.focus({ preventScroll: true });
    }
  }, [doneKey]);
  useLayoutEffect(() => {
    const state = pendingFlip.current;
    const Flip = getFlip();
    if (!state || !Flip) return;
    pendingFlip.current = null;
    Flip.from(state, {
      targets: TASK_CARDS,
      duration: duration.settle,
      ease: ease.emphasized,
    });
  }, [doneKey]);

  const confirm = async (task: Task, note: string) => {
    const card = document.querySelector(`[data-flip-id="task-${task.id}"]`);
    if (!reduced && card) {
      await playTaskDone(card);
      pendingFlip.current = getFlip()?.getState(TASK_CARDS) ?? null;
    }
    focusDone.current = true;
    updateTask.mutate({
      id: task.id,
      status: 'done',
      clientUpdatedAt: task.updatedAt,
      ...(note ? { note } : {}),
    });
  };

  const blockName = (id: string | null) => {
    const block = farm.data?.blocks.find((b) => b.id === id);
    return block ? block.name[locale] : t('field.farm');
  };
  const context = (task: Task) =>
    t('field.context', { kind: t(`task.kind.${task.kind}`), place: blockName(task.blockId) });

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6 pt-6 pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-light tracking-[-0.035em]">{t('field.title')}</h1>
        <SegmentedControl
          label={t('field.worker')}
          size="field"
          value={worker}
          onChange={(w) => {
            setWorker(w);
            saveWorker(w);
          }}
          options={AssigneeSchema.options.map((a) => ({
            value: a,
            label: t(`field.workers.${a}`),
          }))}
        />
      </div>
      <SyncBanner />
      <QueryState
        query={tasks}
        isEmpty={(list) => list.length === 0}
        emptyText={t('field.empty')}
        skeleton={<Skeleton block={320} />}
      >
        {(list) => {
          const todo = list.filter((task) => !isDone(task));
          const done = list.filter(isDone);
          return (
            <>
              <p className="text-text-secondary">
                {t('field.subtitle', { date: formatDateGst(today, locale), count: list.length })}
              </p>
              {groupByBlock(todo, farm.data?.blocks ?? []).map(([blockId, group]) => (
                <section key={blockId ?? 'farm'} className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 font-medium">
                    {blockId ? <Chip className="num">{blockId}</Chip> : null}
                    {blockName(blockId)}
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {group.map((task) => (
                      <li key={task.id}>
                        <TaskCard
                          task={task}
                          context={context(task)}
                          done={false}
                          onMarkDone={setSheetTask}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {done.length > 0 ? (
                <details
                  open={doneOpen}
                  onToggle={(e) => setDoneOpen(e.currentTarget.open)}
                  className="flex flex-col"
                >
                  <summary
                    ref={doneSummary}
                    className="flex min-h-14 cursor-pointer items-center font-medium"
                  >
                    {t('field.doneToday', { count: done.length })}
                  </summary>
                  <ul className="flex flex-col gap-3">
                    {done.map((task) => (
                      <li key={task.id}>
                        <TaskCard task={task} context={context(task)} done />
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {updateTask.isError ? (
                <p role="alert" className="text-error">
                  {updateTask.error.message}
                </p>
              ) : null}
            </>
          );
        }}
      </QueryState>
      {sheetTask ? (
        <DoneSheet
          task={sheetTask}
          onConfirm={(note) => void confirm(sheetTask, note)}
          onClose={() => setSheetTask(null)}
        />
      ) : null}
    </div>
  );
}

/** "Offline · 2 changes saved on this phone" / "Syncing…" / hidden. */
function SyncBanner() {
  const { t } = useTranslation();
  const online = useOnline();
  const count = useOutboxCount();
  const syncing = useOutboxSyncing();
  const text = syncing
    ? t('field.syncing')
    : !online
      ? t('field.offline', { count })
      : count > 0
        ? t('field.queued', { count })
        : null;
  return (
    <div role="status" aria-live="polite">
      {text ? (
        <p className="rounded-md bg-warning-soft px-4 py-3 font-medium text-warning">{text}</p>
      ) : null}
    </div>
  );
}
