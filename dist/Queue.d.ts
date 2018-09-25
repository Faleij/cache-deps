/// <reference types="node" />
import * as EventEmitter from 'events';
export default class Queue extends EventEmitter {
    private stack;
    private currentlyProcessing;
    concurrencyLimit: number;
    constructor();
    add(fn: any): this;
    private tick;
    private workDone;
    on(event: 'drained', listener: (...args: any[]) => void): this;
}
