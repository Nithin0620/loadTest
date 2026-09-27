import { k6EventBus } from '../../../../lib/k6/eventBus.js';
import { connectToDatabase } from '../../../../lib/db/mongoose.js';
import TestRun from '../../../../models/TestRun.js';
import { isTestRunning } from '../../../../lib/k6/runner.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = params;
  const encoder = new TextEncoder();

  await connectToDatabase();
  const runDoc = await TestRun.findById(id).lean();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(eventName, data) {
        try {
          const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
        }
      }

      // Initial status handshake
      sendEvent('init', {
        runId: id,
        status: runDoc ? runDoc.status : 'not_found',
        snapshotConfig: runDoc ? runDoc.snapshotConfig : null,
      });

      // If already completed or failed, emit done and close
      if (runDoc && (runDoc.status === 'completed' || runDoc.status === 'failed' || runDoc.status === 'cancelled')) {
        sendEvent('done', {
          status: runDoc.status,
          metricsSummary: runDoc.metricsSummary,
          timeSeriesMetrics: runDoc.timeSeriesMetrics,
        });
        controller.close();
        return;
      }

      const onTick = (tickData) => {
        sendEvent('tick', tickData);
      };

      const onDone = (doneData) => {
        sendEvent('done', doneData);
        cleanup();
        try { controller.close(); } catch {}
      };

      const onError = (errorData) => {
        sendEvent('error', errorData);
        cleanup();
        try { controller.close(); } catch {}
      };

      const cleanup = () => {
        k6EventBus.offTick(String(id), onTick);
        k6EventBus.offDone(String(id), onDone);
        k6EventBus.offError(String(id), onError);
      };

      k6EventBus.onTick(String(id), onTick);
      k6EventBus.onDone(String(id), onDone);
      k6EventBus.onError(String(id), onError);

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 15000);

      // Check if test completed while we were connecting
      if (!isTestRunning(id)) {
        setTimeout(async () => {
          const latest = await TestRun.findById(id).lean();
          if (latest && latest.status !== 'pending' && latest.status !== 'running') {
            clearInterval(heartbeat);
            sendEvent('done', {
              status: latest.status,
              metricsSummary: latest.metricsSummary,
            });
            cleanup();
            try { controller.close(); } catch {}
          }
        }, 1000);
      }
    },
    cancel() {
      // Client disconnected
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
