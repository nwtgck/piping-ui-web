import * as t from "io-ts";

// Load from local storage with validation
export function loadLocalStorageWithValidation<T>(typeC: t.Type<T>, key: string): T | undefined {
  const item: string | null = window.localStorage.getItem(key);
  if (item !== null) {
    const either = typeC.decode(JSON.parse(item));
    if (either._tag === 'Left') return undefined;
    return either.right;
  }
}
