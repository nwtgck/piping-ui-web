import {computed} from "vue";
import {keys} from "@/local-storage-keys";

export const recordsSecretPathHistory = computed<boolean>({
  get() {
    const s = window.localStorage.getItem((keys.recordsSecretPathHistory)) ?? "true";
    return s === "true";
  },
  set(b: boolean) {
    window.localStorage.setItem(keys.recordsSecretPathHistory, b+"");
  },
});
