import {ref, watch} from "vue";
import {keys} from "./local-storage-keys";
import constants from "@/constants";

export const language = (() => {
  const language = ref<string>((() => {
    return (
      new URLSearchParams(window.location.search).get(constants.langQueryParameterName) ??
      window.localStorage.getItem(keys.language) ??
      // (from: https://github.com/bukinoshita/detect-browser-language/blob/c36e198b7a6f8c99e5ac839e31bf85c4c51d42b6/index.js)
      (navigator.languages && navigator.languages[0]) ??
      navigator.language ??
      (navigator as any).userLanguage
    )
  })());

  watch(language, () => {
    // Store to Local Storage
    window.localStorage.setItem(keys.language, language.value);
  });

  return language;
})();
