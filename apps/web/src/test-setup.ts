import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/i18n';

// Testing Library only auto-cleans with Vitest globals, which this repo doesn't use.
afterEach(cleanup);
