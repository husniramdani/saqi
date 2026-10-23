import { expect, test } from './fixtures';

const TASK = 'Clear bubblers, row 4';

test('a task marked done offline waits on the phone, syncs on reconnect and stays done', async ({
  page,
  context,
  fieldPage,
  request,
}) => {
  await fieldPage.goto('Rahim');
  await expect(fieldPage.task(TASK).getByRole('button', { name: 'Mark done' })).toBeVisible();

  await context.setOffline(true);
  await fieldPage.markDone(TASK, 'Row 4 clear');
  await expect(fieldPage.banner()).toHaveText('Offline · 1 change saved on this phone');
  await expect(fieldPage.doneToday()).toContainText(TASK);

  await context.setOffline(false);
  await expect(fieldPage.banner()).toHaveText('');
  await expect(page.getByRole('status').filter({ hasText: '1 change synced' })).toBeVisible();

  // The server has it, not just this phone.
  const tasks: { title: { en: string }; status: string; note?: string }[] = await (
    await request.get('http://localhost:8788/api/tasks?date=2026-10-23&assignee=rahim')
  ).json();
  expect(tasks.find((t) => t.title.en === TASK)).toMatchObject({
    status: 'done',
    note: 'Row 4 clear',
  });

  await page.reload();
  await expect(fieldPage.doneToday()).toContainText(TASK);
  await expect(fieldPage.task(TASK).getByRole('button', { name: 'Mark done' })).toHaveCount(0);
});
