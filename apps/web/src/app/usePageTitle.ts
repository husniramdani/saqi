import { useEffect } from 'react';

/** "Tonight · Saqi": the page's own name first, so tabs and screen readers lead with it. */
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Saqi` : 'Saqi';
  }, [title]);
}
