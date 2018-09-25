"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
class Queue extends EventEmitter {
    constructor() {
        super();
        this.stack = [];
        this.currentlyProcessing = 0;
        this.concurrencyLimit = 10;
    }
    add(fn) {
        this.stack.push(fn);
        setImmediate(() => this.tick());
        return this;
    }
    tick() {
        while (this.currentlyProcessing < this.concurrencyLimit && this.stack.length) {
            this.currentlyProcessing += 1;
            this.stack.pop()().then(() => this.workDone());
        }
    }
    workDone() {
        this.currentlyProcessing -= 1;
        if (this.currentlyProcessing === 0 && this.stack.length === 0) {
            this.emit('drained');
            return;
        }
        this.tick();
    }
    on(event, listener) {
        super.on.call(this, event, listener);
        return this;
    }
}
exports.default = Queue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBdUM7QUFFdkMsTUFBcUIsS0FBTSxTQUFRLFlBQVk7SUFLN0M7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUxGLFVBQUssR0FBZSxFQUFFLENBQUM7UUFDdkIsd0JBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLHFCQUFnQixHQUFHLEVBQUUsQ0FBQztJQUk3QixDQUFDO0lBRUQsR0FBRyxDQUFDLEVBQUU7UUFDSixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwQixZQUFZLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU8sSUFBSTtRQUNWLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUM1RSxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDaEQ7SUFDSCxDQUFDO0lBRU8sUUFBUTtRQUNkLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLENBQUM7UUFDOUIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM3RCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxFQUFFLENBQUMsS0FBZ0IsRUFBRSxRQUFrQztRQUNyRCxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBbkNELHdCQW1DQyJ9