const NOT_MEMORIZED: Symbol = Symbol('NOT_MEMORIZED');
export function memorizeFunc<T>(func: () => T) {
  let memo: T | Symbol = NOT_MEMORIZED;
  return (): T => {
    // If no memo
    if (memo === NOT_MEMORIZED) {
      memo = func();
    }
    return memo as T;
  };
}
