import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
import { applyTheme, storedTheme } from '@/app/theme';
import './index.css';

// Before the first paint. The HTML already says Night (the default), so only a stored Day
// changes anything here.
applyTheme(storedTheme());

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
