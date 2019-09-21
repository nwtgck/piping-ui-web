import {Vue} from "vue-property-decorator";
import {keys} from "@/local-storage-keys";

// (from: https://forum.vuejs.org/t/how-set-global-state-available-to-all-components/5947/2)
export const globalStore = new Vue({
  data: {
    // (from: https://github.com/bukinoshita/detect-browser-language/blob/c36e198b7a6f8c99e5ac839e31bf85c4c51d42b6/index.js)
    language: (() => {
      const language = window.localStorage.getItem(keys.language);
      if (language === null) {
        return (navigator.languages && navigator.languages[0]) || navigator.language || (navigator as any).userLanguage;
      } else {
        return language;
      }
    })()
  }
});
