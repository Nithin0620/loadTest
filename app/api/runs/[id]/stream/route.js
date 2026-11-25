import { k6EventBus } from '../../../../../lib/k6/eventBus.js';
import { connectToDatabase } from '../../../../../lib/db/mongoose.js';
import TestRun from '../../../../../models/TestRun.js';
import { isTestRunning } from '../../../../../lib/k6/runner.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = params;
  const encoder = new TextEncoder();
  let cleanupStream = () => {};

  await connectToDatabase();
  const runDoc = await TestRun.findById(id).lean();

  const stream = new ReadableStream({
    async start(controller) {
      let finished = false;
      let heartbeat;
      let statusPoll;
      let lateStartCheck;

      function sendEvent(eventName, data) {
        try {
          const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
        }
      }

      function cleanup() {
        if (heartbeat) clearInterval(heartbeat);
        if (statusPoll) clearInterval(statusPoll);
        if (lateStartCheck) clearTimeout(lateStartCheck);
        k6EventBus.offTick(String(id), onTick);
        k6EventBus.offDone(String(id), onDone);
        k6EventBus.offError(String(id), onError);
      }

      function finish(eventName, data) {
        if (finished) return;
        finished = true;
        cleanup();
        sendEvent(eventName, data);
        try { controller.close(); } catch {}
      }

      async function checkDatabaseStatus() {
        if (finished) return;
        try {
          const latest = await TestRun.findById(id).lean();
          if (!latest || finished) return;

          if (latest.status === 'failed') {
            finish('error', {
              status: 'failed',
              message: latest.errorMessage || 'Test run failed before the engine could start',
            });
          } else if (latest.status === 'completed' || latest.status === 'cancelled') {
            finish('done', {
              status: latest.status,
              metricsSummary: latest.metricsSummary,
              timeSeriesMetrics: latest.timeSeriesMetrics,
            });
          }
        } catch {
          // Poll again on the next tick
        }
      }

      const onTick = (tickData) => {
        if (!finished) sendEvent('tick', tickData);
      };

      const onDone = (doneData) => {
        finish('done', doneData);
      };

      const onError = (errorData) => {
        finish('error', errorData);
      };

      cleanupStream = cleanup;

      sendEvent('init', {
        runId: id,
        status: runDoc ? runDoc.status : 'not_found',
        snapshotConfig: runDoc ? runDoc.snapshotConfig : null,
      });

      // If already completed or failed, emit done and close
      if (runDoc && (runDoc.status === 'completed' || runDoc.status === 'failed' || runDoc.status === 'cancelled')) {
        finish('done', {
          status: runDoc.status,
          errorMessage: runDoc.errorMessage,
          metricsSummary: runDoc.metricsSummary,
          timeSeriesMetrics: runDoc.timeSeriesMetrics,
        });
        return;
      }

      k6EventBus.onTick(String(id), onTick);
      k6EventBus.onDone(String(id), onDone);
      k6EventBus.onError(String(id), onError);

      // Heartbeat every 15s to keep connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
        }
      }, 15000);

      // Poll the database so failures that happen before k6 starts are not missed
      statusPoll = setInterval(checkDatabaseStatus, 2000);

      // Check if test completed while we were connecting
      if (!isTestRunning(id)) {
        lateStartCheck = setTimeout(checkDatabaseStatus, 1000);
      }
    },
    cancel() {
      cleanupStream();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
