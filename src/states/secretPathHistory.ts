import {computed, ref} from "vue";
import {keys} from "@/local-storage-keys";
import {loadLocalStorageWithValidation} from "@/utils/loadLocalStorageWithValidation";
import * as t from "io-ts";

const inner = ref<readonly string[]>((() => {
  // Load secret path history from local storage
  const savedSecretPathHistory: string[] | undefined = loadLocalStorageWithValidation(t.array(t.string), keys.secretPathHistory);
  if (savedSecretPathHistory === undefined) {
    return [];
  }
  return savedSecretPathHistory;
})());

export const secretPathHistory = computed<readonly string[]>({
  get() {
    return inner.value;
  },
  set(history: readonly string[]) {
    window.localStorage.setItem(keys.secretPathHistory, JSON.stringify(history));
    inner.value = history;
  },
});
