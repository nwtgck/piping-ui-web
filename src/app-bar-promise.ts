import {makePromise} from "@/utils/makePromise";

const {promise, resolve} = makePromise<Element>();

export const appBarPromise = promise;
// NOTE: should resolve this only in App.vue
export const appBarPromiseResolverWhichShouldBeUsedInAppVue = resolve;
