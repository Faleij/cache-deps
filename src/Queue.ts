import * as EventEmitter from 'events';

export default class Queue extends EventEmitter {
  private stack: Function[] = [];
  private currentlyProcessing = 0;
  public concurrencyLimit = 10;

  constructor() {
    super();
  }

  add(fn) {
    this.stack.push(fn);
    setImmediate(() => this.tick());
    return this;
  }

  private tick() {
    while (this.currentlyProcessing < this.concurrencyLimit && this.stack.length) {
      this.currentlyProcessing += 1;
      this.stack.pop()().then(() => this.workDone());
    }
  }

  private workDone() {
    this.currentlyProcessing -= 1;
    if (this.currentlyProcessing === 0 && this.stack.length === 0) {
      this.emit('drained');
      return;
    }
    this.tick();
  }

  on(event: 'drained', listener: (...args: any[]) => void) : this {
    super.on.call(this, event, listener);
    return this;
  }
}
