import type { Task } from '@saqi/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { sheetIn, sheetOut, useGSAP, useMotion } from '@/motion';
import { Button } from '@/ui';

interface DoneSheetProps {
  task: Task;
  onConfirm: (note: string) => void;
  /** Called once the sheet has animated out (after cancel or confirm). */
  onClose: () => void;
}

/**
 * The mark-done bottom sheet: a native modal `<dialog>`, so the browser traps focus, makes the
 * page behind inert, closes on Escape and returns focus to the opener. The backdrop is a real
 * element (GSAP can't animate `::backdrop`) for M10. The photo is a local preview only.
 */
export function DoneSheet({ task, onConfirm, onClose }: DoneSheetProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { reduced } = useMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const titleId = useId();
  const noteId = useId();

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  // ponytail: revoked per preview and on unmount; the photo never leaves the phone (T17 scope).
  useEffect(() => (photo ? () => URL.revokeObjectURL(photo) : undefined), [photo]);

  // M10 · slides up while the backdrop dims.
  useGSAP(() => {
    if (sheet.current) sheetIn(sheet.current, backdrop.current, { reduced });
  });

  const close = (then?: () => void) => {
    if (closing.current || !sheet.current) return;
    closing.current = true;
    const finish = () => {
      then?.();
      onClose();
    };
    const tl = sheetOut(sheet.current, backdrop.current, { reduced });
    // Reduced motion returns an already-finished timeline: its onComplete would never fire.
    if (tl.progress() === 1) finish();
    else tl.eventCallback('onComplete', finish);
  };

  return (
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // Escape: animate out first
        close();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-transparent p-0 backdrop:bg-transparent"
    >
      <div
        ref={backdrop}
        aria-hidden="true"
        onClick={() => close()}
        className="absolute inset-0 bg-primary opacity-0"
      />
      <div
        ref={sheet}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col gap-5 rounded-t-xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-floating"
      >
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-xl font-medium">
            {t('field.sheet.title')}
          </h2>
          <p className="text-text-secondary">{task.title[locale]}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={noteId} className="text-sm font-medium text-text-secondary">
            {t('field.sheet.note')}
          </label>
          <textarea
            id={noteId}
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-md border border-border-strong bg-surface-raised p-3 text-base text-text-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          {photo ? (
            <img src={photo} alt="" className="max-h-40 self-start rounded-md object-cover" />
          ) : null}
          <label className="inline-flex min-h-14 cursor-pointer items-center justify-center rounded-full border border-border-strong px-6 font-medium text-text-primary focus-within:outline-2 focus-within:outline-focus">
            {photo ? t('field.sheet.replacePhoto') : t('field.sheet.addPhoto')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(URL.createObjectURL(file));
              }}
            />
          </label>
          <p className="text-sm text-text-secondary">{t('field.sheet.photoNote')}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="field" variant="accent" onClick={() => close(() => onConfirm(note.trim()))}>
            {t('field.sheet.confirm')}
          </Button>
          <Button size="field" variant="ghost" onClick={() => close()}>
            {t('field.sheet.cancel')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
