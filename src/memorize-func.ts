const NOT_MEMORIZED: unique symbol = Symbol('NOT_MEMORIZED');
export function memorizeFunc<T>(func: () => T) {
  let memo: T | typeof NOT_MEMORIZED = NOT_MEMORIZED;
  return (): T => {
    // If no memo
    if (memo === NOT_MEMORIZED) {
      memo = func();
    }
    return memo;
  };
}
