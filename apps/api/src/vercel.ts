import { handle } from 'hono/vercel';
import { app } from './app';

// Vercel function entry (T23 wires the project).
export default handle(app);
