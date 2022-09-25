import {Ref, ref, watch} from "vue";
import {language} from "@/language";

type ReadonlyRef<T> = Ref<T> & { readonly value: T}

export function useErrorMessage(): {
  errorMessage: ReadonlyRef<string | undefined>,
  updateErrorMessage: (f: (() => string | Promise<string>) | undefined) => void
} {
  // NOTE: Function makes dynamic language-switch support possible
  //       Delegation is to reassign this value
  const errorMessageDelegate = ref<(() => string | Promise<string>) | undefined>();
  const errorMessage = ref<string | undefined>();
  watch([errorMessageDelegate, language], async () => {
    if (errorMessageDelegate.value !== undefined) {
      errorMessage.value = await errorMessageDelegate.value();
    }
  });
  function updateErrorMessage(f: (() => string | Promise<string>) | undefined) {
    errorMessageDelegate.value  = f;
  }
  return {
    errorMessage,
    updateErrorMessage,
  };
}
