import {ref, watch} from "vue";
import buildConstants from "@/build-constants";
import {keys} from "@/local-storage-keys";

export const pipingServerUrl = ref<string>((() => {
  // Load from Local Storage
  const savedServerUrl = window.localStorage.getItem(keys.selectedServerUrl);
  if (savedServerUrl !== null) {
    return savedServerUrl;
  }
  return buildConstants.pipingServerUrls[0];
})());

watch(pipingServerUrl, () => {
  window.localStorage.setItem(keys.selectedServerUrl, pipingServerUrl.value);
});
