import {makePromise} from "@/utils/makePromise";

export class AsyncSemaphore {
  private waiting: Array<{promise: Promise<void>, resolve: () => void}> = [];
  private current: number = 0;

  constructor(readonly n: number) {}

  async acquire() {
    this.current++;
    if (this.current <= this.n) {
      return;
    }
    const p = makePromise<void>();
    this.waiting.push(p);
    await p.promise;
  }

  release() {
    if (this.current === 0) {
      throw new Error(`cannot release because current number is 0`);
    }
    this.current--;
    if (this.waiting.length === 0) {
      return;
    }
    const p = this.waiting.shift()!;
    p.resolve();
  }
}
