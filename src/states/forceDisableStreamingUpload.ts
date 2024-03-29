import {ref} from "vue";

// Chrome Stable 105.0.5195.52 causes an error "Failed to load resource: net::ERR_FAILED" in streaming-upload. Stable 104 works well with the feature flag.
// TODO: remove after Chrome fixed, this option should not be maintained after fixed
// Chrome Stable 105 can streaming-upload when using separate Chrome profiles
export const forceDisableStreamingUpload = ref<boolean>(false);
