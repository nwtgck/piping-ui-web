import {Ref, ref, watch} from "vue";
import {strings} from "@/strings/strings";

type ReadonlyRef<T> = Ref<T> & { readonly value: T}

export function useErrorMessage(): {
  errorMessage: ReadonlyRef<string | undefined>,
  updateErrorMessage: (f: (() => undefined | string | Promise<string>) | undefined) => void
} {
  // NOTE: Function makes dynamic language-switch support possible
  //       Delegation is to reassign this value
  const errorMessageDelegate = ref<(() => undefined | string | Promise<string>) | undefined>();
  const errorMessage = ref<string | undefined>();
  watch([errorMessageDelegate, strings], async () => {
    if (errorMessageDelegate.value !== undefined) {
      errorMessage.value = await errorMessageDelegate.value();
    }
  });
  function updateErrorMessage(f: (() => undefined | string | Promise<string>) | undefined) {
    errorMessageDelegate.value  = f;
  }
  return {
    errorMessage,
    updateErrorMessage,
  };
}
