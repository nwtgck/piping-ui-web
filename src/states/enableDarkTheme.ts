import {keys} from "@/local-storage-keys";
import {ref, watch} from "vue";

export const enableDarkTheme = (() => {
  const inner = ref<boolean>((() => {
    // Load environmental dark theme setting
    let enableDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Load dark theme setting
    const darkThemeStr = window.localStorage.getItem(keys.darkTheme);
    if (darkThemeStr !== null) {
      enableDarkTheme = darkThemeStr === "true";
    }
    return enableDarkTheme;
  })());

  watch(inner, () => {
    // Store to Local Storage
    window.localStorage.setItem(keys.darkTheme, inner.value.toString());
  });

  return inner;
})();
