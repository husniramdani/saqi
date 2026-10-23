import type { Task } from '@saqi/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DoneSheet } from './DoneSheet';
import { TaskCard } from './TaskCard';

const task: Task = {
  id: 't1',
  blockId: 'D-1',
  kind: 'maintenance',
  title: { en: 'Clear bubblers, row 4', ar: 'Clear bubblers, row 4', ur: 'Clear bubblers, row 4' },
  dueDate: '2026-10-23',
  assignee: 'rahim',
  status: 'todo',
  updatedAt: '2026-10-23T04:00:00.000Z',
};

// The field page's wiring: the card opens the sheet, the sheet reports back.
function Harness({ onConfirm }: { onConfirm: (note: string) => void }) {
  const [open, setOpen] = useState<Task | null>(null);
  return (
    <>
      <TaskCard
        task={task}
        context="Maintenance · Khalas palms"
        done={false}
        onMarkDone={setOpen}
      />
      {open ? <DoneSheet task={open} onConfirm={onConfirm} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

describe('TaskCard + DoneSheet', () => {
  it('opens the sheet from "Mark done" only, not from the card', () => {
    render(<Harness onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByText('Clear bubblers, row 4'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    expect(screen.getByRole('dialog', { name: 'Mark done' })).toBeTruthy();
  });

  it('is a modal dialog (the browser traps focus) and confirms with the note', () => {
    const onConfirm = vi.fn();
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    expect(showModal).toHaveBeenCalled();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: '  row 4 clear  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    return vi.waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('row 4 clear');
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('Escape closes without confirming', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    return vi.waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
