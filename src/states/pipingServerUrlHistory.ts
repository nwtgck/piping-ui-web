import {computed, ref} from "vue";
import {keys} from "@/local-storage-keys";
import {loadLocalStorageWithValidation} from "@/utils/loadLocalStorageWithValidation";
import {z} from "zod";
import buildConstants from "@/build-constants";

const defaultServerUrls: ReadonlyArray<string> = buildConstants.pipingServerUrls;

const inner = ref<readonly string[]>((() => {
  // Load server URL history from local storage
  const savedServerUrlHistory: string[] | undefined = loadLocalStorageWithValidation(z.array(z.string()), keys.serverUrlHistory);
  // If none
  if (savedServerUrlHistory === undefined) {
    // Set default
    return defaultServerUrls.slice();
  }
  return savedServerUrlHistory;
})());

export const pipingServerUrlHistory = computed<readonly string[]>({
  get() {
    return inner.value;
  },
  set(history: readonly string[]) {
    window.localStorage.setItem(keys.serverUrlHistory, JSON.stringify(history));
    inner.value = history;
  },
});
