import { EventEmitter } from 'events';

class K6EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitTick(runId, tickData) {
    this.emit(`tick:${runId}`, tickData);
  }

  onTick(runId, listener) {
    this.on(`tick:${runId}`, listener);
  }

  offTick(runId, listener) {
    this.off(`tick:${runId}`, listener);
  }

  emitDone(runId, resultData) {
    this.emit(`done:${runId}`, resultData);
  }

  onDone(runId, listener) {
    this.on(`done:${runId}`, listener);
  }

  offDone(runId, listener) {
    this.off(`done:${runId}`, listener);
  }

  emitError(runId, errorData) {
    this.emit(`error:${runId}`, errorData);
  }

  onError(runId, listener) {
    this.on(`error:${runId}`, listener);
  }

  offError(runId, listener) {
    this.off(`error:${runId}`, listener);
  }
}

// Global singleton instance for hot reloads
const globalKey = Symbol.for('loadcheck.k6EventBus');
if (!global[globalKey]) {
  global[globalKey] = new K6EventBus();
}

export const k6EventBus = global[globalKey];
export default k6EventBus;
