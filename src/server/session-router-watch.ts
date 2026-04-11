import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { summarizeSession } from '../storage/session-store-helpers';

/**
 * Registers a Server-Sent Events (SSE) endpoint for watching session changes.
 * GET /sessions/watch
 */
export function registerWatchRoute(router: Router, store: SessionStore): void {
  router.get('/sessions/watch', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    Ms = n    const sendSnapshot = () => {
      tryaries = sessions.map(summarizeconst data = JSON.stringify(summaries);
        res.write(`data: ${data}\n\n`);
      } catch {
        res.write(`event: error\ndata: {}\n\n`);
      }
    };

    sendconst timer = setInterval(sendSnapshot, intervalMs);

    req.on('close', () => {
      clearInterval(timer);
      res.end();
    });
  });
}
