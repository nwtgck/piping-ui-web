<template>
  <v-expansion-panel ref="rootElement">
    <v-expansion-panel-header :disable-icon-rotate="progressPercentage === 100 || hasError">
      <span>{{ strings?.['download_in_downloader'] }} #{{ composedProps.downloadNo }}</span>
      <!-- Percentage -->
      {{ progressPercentage ? `${progressPercentage.toFixed(2)} %` : "" }}
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon}}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'initial'">
        <span style="">{{ strings?.['waiting_for_sender'] }}</span>
      </v-alert>

      <span v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <VerificationCode :value="verificationStep.verificationCode"/>
      </span>

      <!-- NOTE: Don't use v-if because the "sibling" element uses "ref" and the ref is loaded in mounted(), but don't know why "sibling" affects. -->
      <span v-show="showsProgressBar">
        <!-- loaded of total -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <div style="text-align: center" v-on="on">
              {{ readableBytesString(progressSetting.loadedBytes, 1) }}{{ !progressSetting.totalBytes ? "" : ` of ${readableBytesString(progressSetting.totalBytes, 1)}` }}
            </div>
          </template>
          <span>{{ progressSetting.loadedBytes }}{{ !progressSetting.totalBytes ? "" : ` of ${progressSetting.totalBytes}` }}</span>
        </v-tooltip>

        <!-- Progress bar -->
        <v-progress-linear :value="progressPercentage"
                           :indeterminate="progressPercentage === null && !canceled && !hasError"
                           :color="canceled ? 'grey' : undefined" />
      </span>

      <v-simple-table class="text-left">
        <tbody>
        <tr v-if="composedProps.protection.type === 'passwordless'" class="text-left">
          <td>{{ strings?.['server'] }}</td>
          <td>{{ props.composedProps.serverUrl }}</td>
        </tr>
        <tr v-if="composedProps.protection.type === 'passwordless'" class="text-left">
          <td>{{ strings?.['secret_path'] }}</td>
          <td>{{ props.composedProps.secretPath }}</td>
        </tr>
        <tr v-if="composedProps.protection.type !== 'passwordless'" class="text-left">
          <td>{{ strings?.['download_url'] }}</td>
          <td>{{ downloadUrl }}</td>
        </tr>
        <tr v-if="pipingUiAuthVerificationCode !== undefined" class="text-left">
          <td>{{ strings?.['verification_code'] }}</td>
          <td>{{ pipingUiAuthVerificationCode }}</td>
        </tr>
        </tbody>
      </v-simple-table>

      <v-alert type="error"
               outlined
               :value="hasError">
        {{ errorMessage }}
      </v-alert>

      <v-dialog v-model="openRetryDownload" persistent max-width="290">
        <v-card>
          <v-card-title class="text-h5">{{ strings?.['retry_download_dialog_title'] }}</v-card-title>
          <v-card-text>{{ strings?.['browser_may_have_blocked_download'] }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" outlined @click="openRetryDownload = false">{{ strings?.['retry_download_dialog_no'] }}</v-btn>
            <!-- NOTE: tag="a" is important. This element will be injected href and download attributes. -->
            <v-btn ref="retry_download_button" tag="a" @click="openRetryDownload = false" color="primary" outlined data-testid="retry_download_button">{{ strings?.['retry_download_dialog_yes'] }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import {type Protection} from "@/datatypes";

export type DataDownloaderProps = {
  downloadNo: number,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};
</script>

<script setup lang="ts">
/* eslint-disable */

import Vue, {ref, computed, onMounted, nextTick} from "vue";
import urlJoin from 'url-join';
import {mdiAlert, mdiCheck, mdiChevronDown, mdiCloseCircle} from "@mdi/js";
import {pipingUiScrollTo} from "@/piping-ui-utils/pipingUiScrollTo";
import * as pipingUiRobust from "@/piping-ui-robust";
import VerificationCode from "@/components/VerificationCode.vue";
import * as pipingUiAuth from "@/piping-ui-auth";
import * as fileType from 'file-type/browser';
import {canTransferReadableStream} from "@/utils/canTransferReadableStream";
import {makePromise} from "@/utils/makePromise";
import {isFirefox} from "@/utils/isFirefox";
import {useErrorMessage} from "@/composables/useErrorMessage";
import {strings} from "@/strings/strings";
import {ecdsaP384SigningKeyPairPromise} from "@/states/ecdsaP384SigningKeyPairPromise";
import {firstAtLeastBlobFromReadableStream} from "@/utils/firstAtLeastBlobFromReadableStream";
import {decideFileName} from "@/piping-ui-utils/decideFileName";
import {readableBytesString} from "../utils/readableBytesString";
import {getReadableStreamWithProgress} from "@/utils/getReadableStreamWithProgress";

const FileSaverAsync = () => import('file-saver').then(p => p.default);
const swDownloadAsync = () => import("@/sw-download");
const openPgpUtilsAsync = () => import("@/utils/openpgp-utils");

const props = defineProps<{ composedProps: DataDownloaderProps }>();

// TODO: support cancel
const {promise: canceledPromise, resolve: cancel} = makePromise<void>();
canceledPromise.then(() => {
  // canceled.value = true;
});
const canceled = ref(false);

const {errorMessage, updateErrorMessage} = useErrorMessage();
const verificationStep = ref<pipingUiAuth.VerificationStep>({type: 'initial'});
const hasError = computed<boolean>(() => errorMessage.value !== undefined);
const headerIcon = computed<string>(() => {
  if (hasError.value) {
    return mdiAlert;
  }
  if (canceled.value) {
    return mdiCloseCircle;
  }
  if (progressPercentage.value === 100) {
    return mdiCheck;
  }
  return mdiChevronDown;
});
const headerIconColor = computed<string | undefined>(() => {
  if (hasError.value) {
    return "error";
  }
  if (canceled.value) {
    return "grey";
  }
  if (progressPercentage.value === 100) {
    return "teal";
  }
  return undefined;
});
const isReadyToDownload = computed<boolean>(() => {
  return props.composedProps.protection.type === 'passwordless' ? verificationStep.value.type === 'verified' && verificationStep.value.verified : true
});
const downloadUrl = computed<string>(() => {
  return urlJoin(props.composedProps.serverUrl, encodeURI(props.composedProps.secretPath));
});
const rootElement = ref<Vue>();
const pipingUiAuthVerificationCode = ref<string | undefined>();
const openRetryDownload = ref<boolean>(false);
const retry_download_button = ref<Vue>();
const showsProgressBar = ref(false);
const progressSetting = ref<{loadedBytes: number, totalBytes?: number}>({
  loadedBytes: 0,
  totalBytes: undefined,
});
const progressPercentage = computed<number | null>(() => {
  // if (isDoneDownload.value) {
  //   return 100;
  // }
  if (progressSetting.value.totalBytes === undefined) {
    return null;
  }
  if (progressSetting.value.totalBytes === 0) {
    return 100;
  }
  return progressSetting.value.loadedBytes / progressSetting.value.totalBytes * 100;
});

// NOTE: Automatically download when mounted
onMounted(async () => {
  // Scroll to this element
  // NOTE: no need to add `await`
  pipingUiScrollTo(rootElement.value!.$el);

  // Key exchange
  const keyExchangeRes = await pipingUiAuth.keyExchangeAndReceiveVerified(
      props.composedProps.serverUrl,
      props.composedProps.secretPath,
      props.composedProps.protection,
      await ecdsaP384SigningKeyPairPromise.value,
      (step: pipingUiAuth.VerificationStep) => {
        verificationStep.value = step;
      },
      canceledPromise,
  );

  if (keyExchangeRes.type === "canceled") {
    return;
  }

  // If error
  if (keyExchangeRes.type === "error") {
    switch (keyExchangeRes.error.code) {
      case "key_exchange_error": {
        const errorCode = keyExchangeRes.error.keyExchangeError;
        updateErrorMessage(() => strings.value?.["key_exchange_error"](errorCode));
        break;
      }
      case "sender_not_verified":
        updateErrorMessage(() => strings.value?.["sender_not_verified"]);
        break;
    }
    return;
  }

  if ("verificationCode" in keyExchangeRes) {
    pipingUiAuthVerificationCode.value = keyExchangeRes.verificationCode;
  }

  const {key} = keyExchangeRes;

  const swDownload = await swDownloadAsync();
  // If not supporting stream-download via Service Worker
  if (!swDownload.supportsSwDownload()) {
    // If password-protection is disabled
    if (key === undefined) {
      // NOTE: Should use streaming-download via Service Worker as possible because it can detect MIME type and attach a file extension.
      console.log("downloading with dynamic <a href> click...");
      // Download or show on browser sometimes
      const aTag = document.createElement('a');
      aTag.href = downloadUrl.value;
      aTag.target = "_blank";
      aTag.download = props.composedProps.secretPath;
      aTag.click();
      return;
    }
    console.log("downloading and decrypting with FileSaver.saveAs()...");

    let encryptedStream: ReadableStream<Uint8Array>;
    // Passwordless transfer always uses Piping UI Robust
    if (keyExchangeRes.protectionType === "passwordless") {
      const abortController = new AbortController();
      canceledPromise.then(() => {
        abortController.abort();
      });
      encryptedStream = pipingUiRobust.receiveReadableStream(
        props.composedProps.serverUrl,
        keyExchangeRes.mainPath,
        { abortSignal: abortController.signal },
      );
    } else {
      const res = await fetch(downloadUrl.value);
      if (res.status !== 200) {
        const message = await res.text();
        updateErrorMessage(() => strings.value?.['fetch_status_error']({status: res.status, message}));
        return;
      }
      encryptedStream = res.body!;
    }
    // Decrypt the response body
    let plainStream: ReadableStream;
    try {
      plainStream = await (await openPgpUtilsAsync()).decryptStream(encryptedStream, key);
    } catch (e) {
      console.log("failed to decrypt", e);
      updateErrorMessage(() => strings.value?.['password_might_be_wrong']);
      return;
    }
    const FileSaver = await FileSaverAsync();
    const blob = await new Response(plainStream).blob();
    const fileName = decideFileName({
      topPriorityDataMeta: keyExchangeRes.protectionType === "passwordless" ? keyExchangeRes.dataMeta : undefined,
      secretPath: props.composedProps.secretPath,
      sniffedFileExtension: (await fileType.fromBlob(blob))?.ext,
    });
    // Save
    FileSaver.saveAs(blob, fileName);
    return;
  }
  console.log("downloading streaming with the Service Worker and decrypting if need...");
  const openPgpUtils = await openPgpUtilsAsync();

  showsProgressBar.value = true;

  let readableStream: ReadableStream;
  let contentLengthStr: string | undefined = undefined;
  // Passwordless transfer always uses Piping UI Robust
  if (keyExchangeRes.protectionType === "passwordless") {
    const abortController = new AbortController();
    canceledPromise.then(() => {
      abortController.abort();
    });
    // TODO: notify when canceled because Piping UI Robust on sender side keeps sending
    readableStream = pipingUiRobust.receiveReadableStream(
      props.composedProps.serverUrl,
      keyExchangeRes.mainPath,
      { abortSignal: abortController.signal },
    );
    if (keyExchangeRes.dataMeta.size !== undefined) {
      progressSetting.value.totalBytes = keyExchangeRes.dataMeta.size;
    }
  } else {
    const res = await fetch(downloadUrl.value);
    if (res.status !== 200) {
      const message = await res.text();
      updateErrorMessage(() => strings.value?.['fetch_status_error']({status: res.status, message}));
      return;
    }
    // NOTE: Should not use Content-Length when password is defined because it is encrypted byte size
    contentLengthStr = key === undefined ? res.headers.get("Content-Length") ?? undefined : undefined;
    if (contentLengthStr !== undefined) {
      progressSetting.value.totalBytes = parseInt(contentLengthStr, 10);
    }
    readableStream = res.body!
  }

  if (key !== undefined) {
    try {
      readableStream = await openPgpUtils.decryptStream(readableStream, key);
    } catch (e) {
      console.log("failed to decrypt", e);
      updateErrorMessage(() => strings.value?.['password_might_be_wrong']);
      return;
    }
  }
  const [readableStreamForDownload, readableStreamForFileType] = readableStream.tee();
  const { mimeType, fileExtension }: { mimeType: string | undefined, fileExtension: string | undefined } = await (async () => {
    // Avoid sniffing in passwordless protection
    if (keyExchangeRes.protectionType === "passwordless") {
      return keyExchangeRes.dataMeta;
    }
    // NOTE: Using fileType.fromStream() blocks download when specifying multiple large files in DataUploader.vue. (zip detection may read large bytes)
    // NOTE: 4100 was used in FileType.minimumBytes in file-type until 13.1.2
    const fileTypeResult = await fileType.fromBlob(await firstAtLeastBlobFromReadableStream(readableStreamForFileType, 4100));
    return { mimeType: fileTypeResult?.mime, fileExtension: fileTypeResult?.ext };
  })();
  const fileName = decideFileName({
    topPriorityDataMeta: keyExchangeRes.protectionType === "passwordless" ? keyExchangeRes.dataMeta : undefined,
    secretPath: props.composedProps.secretPath,
    sniffedFileExtension: fileExtension,
  });
  // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
  // Make filename RFC5987 compatible
  const escapedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  const headers: [string, string][] = [
    ...( contentLengthStr === undefined ? [] : [ [ "Content-Length", contentLengthStr ] ] satisfies [[string, string]] ),
    // Without "Content-Type", Safari in iOS 15 adds ".html" to the downloading file
    ...( mimeType === undefined ? [] : [ [ "Content-Type", mimeType ] ] satisfies [[string, string]] ),
    ['Content-Disposition', "attachment; filename*=UTF-8''" + escapedFileName],
  ];
  const {stream: readableStreamForDownloadWithProgress, cancel: cancelReadableStreamForDownloadWithProgress} = getReadableStreamWithProgress(readableStreamForDownload, (n) => {
    progressSetting.value.loadedBytes += n;
  });
  canceledPromise.then(() => {
    cancelReadableStreamForDownloadWithProgress();
  });
  // Enroll download ReadableStream and get sw-download ID
  const {swDownloadId} = await enrollDownload(headers, readableStreamForDownloadWithProgress);
  // Download via Service Worker
  // NOTE: '/sw-download/v2' can be received by Service Worker in src/sw.js
  // NOTE: URL fragment is passed to Service Worker but not passed to Web server
  const swDownloadUrl = `/sw-download/v2#?id=${swDownloadId}`;
  const win = window.open(swDownloadUrl, "_blank");
  console.log("window.open()?.closed =", win?.closed);
  // NOTE: Desktop and iOS Safari 16.1 blocks by default
  if(win === null || win.closed || win.closed === undefined) {
    openRetryDownload.value = true;
    nextTick(() => {
      // Use real click, not element.click()
      const a = retry_download_button.value!.$el as HTMLAnchorElement;
      a.href = swDownloadUrl;
      // NOTE: The feature detection can not be created because it would confirm the downloaded file.
      if (isFirefox()) {
        // NOTE: With "download" attributes, Chrome 108 and Safari 16.1 bypass Service Worker
        // crbug: https://bugs.chromium.org/p/chromium/issues/detail?id=468227
        // NOTE: Without "download" attribute, Firefox frequently fails to download a large file. Passwordless protection is stable without "download" attribute because it uses Piping UI Robust, which transfer small chunks especially first chunk even in Firefox.
        // For testing in Firefox, you can enable "Block pop-up windows" in your preference.
        a.download = fileName;
        console.log("'download' attribute added to <a>");
      }
    });
  }
  // Without this, memory leak occurs. It consumes as much memory as the received file size.
  // Memory still leaks when using `npm run serve`. Build and serve to confirm.
  await readableStreamForFileType.cancel();
});

// (base: https://googlechrome.github.io/samples/service-worker/post-message/)
async function enrollDownload(headers: readonly [string, string][], readableStream: ReadableStream<Uint8Array>): Promise<{ swDownloadId: string }> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    if (!("serviceWorker" in navigator)) {
      reject(new Error("Service Worker not supported"));
      return;
    }
    if (navigator.serviceWorker.controller === null) {
      reject(new Error("navigator.serviceWorker.controller is null"));
      return;
    }
    if (canTransferReadableStream()) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (e: MessageEvent) => resolve({
        swDownloadId: e.data.swDownloadId,
      });
      navigator.serviceWorker.controller.postMessage({
        type: 'enroll-download',
        headers,
        readableStream,
      }, [messageChannel.port2, readableStream] as Transferable[]);
      return;
    }
    console.log("Fallback to posting chunks of ReadableStream over MessageChannel, instead of transferring the stream directly")
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (e: MessageEvent) => resolve({
      swDownloadId: e.data.swDownloadId,
    });
    navigator.serviceWorker.controller.postMessage({
      type: 'enroll-download-with-channel',
      headers,
    }, [messageChannel.port2]);

    const reader = readableStream.getReader();
    while (true) {
      const result = await reader.read();
      if (result.done) {
        messageChannel.port1.postMessage({ done: true });
        break;
      }
      // .slice() is needed otherwise OpenPGP.js causes "TypeError: attempting to access detached ArrayBuffer"
      messageChannel.port1.postMessage(result, [result.value.buffer.slice(0)]);
    }
  });
}
</script>
