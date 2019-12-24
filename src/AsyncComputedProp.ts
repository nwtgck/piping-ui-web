// (from: https://github.com/foxbenjaminfox/vue-async-computed/issues/25#issuecomment-459369072)

import { createDecorator, VueDecorator } from 'vue-class-component';

type AsyncComputedGetter<T> = () => (Promise<T> | T);
export interface IAsyncComputedProperty<T> {
  default?: T | (() => T);
  get?: AsyncComputedGetter<T>;
  watch?: () => void;
  shouldUpdate?: () => boolean;
  lazy?: boolean;
}

export function AsyncComputedProp<T>(
  computedOptions?: IAsyncComputedProperty<T>,
): VueDecorator {
  return createDecorator((_options, key) => {
    // TODO: Not use any casting
    const options: any = _options;
    options.asyncComputed = options.asyncComputed || {};
    const method = options.methods![key];
    options.asyncComputed![key] = {
      get: method,
      ...computedOptions,
    };
    delete options.methods![key];
  });
}
