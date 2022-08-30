import {Vue} from "vue-property-decorator";

// (from: https://forum.vuejs.org/t/how-set-global-state-available-to-all-components/5947/2)
export const globalStore = new Vue({
  data: {
    recordsServerUrlHistory: true,
    recordsSecretPathHistory: true,
    // Chrome Stable 105.0.5195.52 causes an error "Failed to load resource: net::ERR_FAILED" in streaming-upload. Stable 104 works well with the feature flag.
    // TODO: remove after Chrome fixed, this option should not be maintained after fixed
    forceDisableStreamingUpload: true,
  }
});
