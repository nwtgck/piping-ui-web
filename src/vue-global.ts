import {Vue} from "vue-property-decorator";

// (from: https://forum.vuejs.org/t/how-set-global-state-available-to-all-components/5947/2)
export const globalStore = new Vue({
  data: {
    recordsServerUrlHistory: true,
    recordsSecretPathHistory: true,
  }
});
