/***
 * Make a promise which can be resolved and rejected outside of the Promise constructor
 */
export function makePromise<T>(): { promise: Promise<T>, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void } {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {promise, resolve, reject};
}
