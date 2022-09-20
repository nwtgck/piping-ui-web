import {computed} from "vue";
import {keys} from "@/local-storage-keys";

export const recordsServerUrlHistory = computed<boolean>({
  get() {
    const s = window.localStorage.getItem((keys.recordsServerUrlHistory)) ?? "true";
    return s === "true";
  },
  set(b: boolean) {
    window.localStorage.setItem(keys.recordsServerUrlHistory, b+"");
  },
});
