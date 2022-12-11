<template>
  <v-expansion-panel ref="rootElement">
    <v-expansion-panel-header :disable-icon-rotate="hasError">
      <span>{{ strings['download_in_downloader'] }} #{{ composedProps.downloadNo }}</span>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'initial'">
        <span style="">{{ strings['waiting_for_sender'] }}</span>
      </v-alert>

      <span v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <VerificationCode :value="verificationStep.verificationCode"/>
      </span>

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>{{ strings['download_url'] }}</td>
          <td>{{ downloadPath }}</td>
        </tr>
        </tbody>
      </v-simple-table>

      <v-alert type="error"
               outlined
               :value="hasError">
        {{ errorMessage }}
      </v-alert>

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

import Vue, {ref, computed, onMounted} from "vue";
import urlJoin from 'url-join';
import {mdiAlert, mdiChevronDown} from "@mdi/js";
import {stringsByLang} from "@/strings/strings-by-lang";
import * as pipingUiUtils from "@/piping-ui-utils";
import * as pipingUiRobust from "@/piping-ui-robust";
import {type VerificationStep} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";
import * as pipingUiAuth from "@/piping-ui-auth";
import {language} from "@/language";
import * as fileType from 'file-type/browser';
import {canTransferReadableStream} from "@/utils/canTransferReadableStream";
import {makePromise} from "@/utils/makePromise";
import {useErrorMessage} from "@/useErrorMessage";
import {experimentalEnablePipingUiRobust} from "@/settings/experimentalEnablePipingUiRobust";

const FileSaverAsync = () => import('file-saver').then(p => p.default);
const binconvAsync = () => import('binconv');
const swDownloadAsync = () => import("@/sw-download");
const openPgpUtilsAsync = () => import("@/utils/openpgp-utils");

const props = defineProps<{ composedProps: DataDownloaderProps }>();

// TODO: support cancel
const {promise: canceledPromise, resolve: cancel} = makePromise<void>();
canceledPromise.then(() => {
  // canceled.value = true;
});

const {errorMessage, updateErrorMessage} = useErrorMessage();
const verificationStep = ref<VerificationStep>({type: 'initial'});
// for language support
const strings = computed(() => stringsByLang(language.value));
const hasError = computed<boolean>(() => errorMessage.value !== undefined);
const headerIcon = computed<string>(() => {
  if (hasError.value) {
    return mdiAlert;
  } else {
    return mdiChevronDown;
  }
});
const headerIconColor = computed<string | undefined>(() => {
  if (hasError.value) {
    return "error";
  } else {
    return undefined
  }
});
const isReadyToDownload = computed<boolean>(() => {
  return props.composedProps.protection.type === 'passwordless' ? verificationStep.value.type === 'verified' && verificationStep.value.verified : true
});
const downloadPath = computed<string>(() => {
  return urlJoin(props.composedProps.serverUrl, encodeURI(props.composedProps.secretPath));
});
const rootElement = ref<Vue>();

// NOTE: Automatically download when mounted
onMounted(async () => {
  // Scroll to this element
  // NOTE: no need to add `await`
  pipingUiUtils.scrollTo(rootElement.value!.$el);

  // Key exchange
  const keyExchangeRes = await pipingUiAuth.keyExchangeAndReceiveVerified(
      props.composedProps.serverUrl,
      props.composedProps.secretPath,
      props.composedProps.protection,
      (step: VerificationStep) => {
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
      case "key_exchange_error":
        updateErrorMessage(() => strings.value["key_exchange_error"](keyExchangeRes.error.keyExchangeErrorCode));
        break;
      case "sender_not_verified":
        updateErrorMessage(() => strings.value["sender_not_verified"]);
        break;
    }
    return;
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
      aTag.href = downloadPath.value;
      aTag.target = "_blank";
      aTag.download = props.composedProps.secretPath;
      aTag.click();
      return;
    }
    console.log("downloading and decrypting with FileSaver.saveAs()...");
    // Get response
    const encryptedStream = await (async () => {
      // Passwordless transfer always uses Piping UI Robust
      if (props.composedProps.protection.type === "passwordless") {
        return pipingUiRobust.receiveReadableStream(
          props.composedProps.serverUrl,
          encodeURI(props.composedProps.secretPath),
        );
      }
      const res = await fetch(downloadPath.value);
      return res.body!;
    })();
    // Decrypt the response body
    let plainStream: ReadableStream;
    try {
      plainStream = await (await openPgpUtilsAsync()).decryptStream(encryptedStream, key);
    } catch (e) {
      console.log("failed to decrypt", e);
      updateErrorMessage(() => strings.value['password_might_be_wrong']);
      return;
    }
    // Save
    const FileSaver = await FileSaverAsync();
    FileSaver.saveAs(await new Response(plainStream).blob(), props.composedProps.secretPath);
    return;
  }
  console.log("downloading streaming with the Service Worker and decrypting if need...");
  const openPgpUtils = await openPgpUtilsAsync();

  let readableStream: ReadableStream;
  let contentLengthStr: string | undefined = undefined;
  // Passwordless transfer always uses Piping UI Robust
  if (props.composedProps.protection.type === "passwordless") {
    readableStream = pipingUiRobust.receiveReadableStream(
      props.composedProps.serverUrl,
      encodeURI(props.composedProps.secretPath),
    );
  } else {
    const res = await fetch(downloadPath.value);
    contentLengthStr = key === undefined ? res.headers.get("Content-Length") ?? undefined : undefined;
    readableStream = res.body!
  }

  if (key !== undefined) {
    try {
      readableStream = await openPgpUtils.decryptStream(readableStream, key);
    } catch (e) {
      console.log("failed to decrypt", e);
      updateErrorMessage(() => strings.value['password_might_be_wrong']);
      return;
    }
  }
  const [readableStreamForDownload, readableStreamForFileType] = readableStream.tee();
  const fileTypeResult = await fileType.fromStream(readableStreamForFileType);
  let fileName = props.composedProps.secretPath;
  if (fileTypeResult !== undefined && !fileName.match(/.+\..+/)) {
    fileName = `${fileName}.${fileTypeResult.ext}`;
  }
  // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
  // Make filename RFC5987 compatible
  const escapedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  const headers: [string, string][] = [
    ...( contentLengthStr === undefined ? [] : [ [ "Content-Length", contentLengthStr ] ] ),
    // Without "Content-Type", Safari in iOS 15 adds ".html" to the downloading file
    ...( fileTypeResult === undefined ? [] : [ [ "Content-Type", fileTypeResult.mime ] ] ),
    ['Content-Disposition', "attachment; filename*=UTF-8''" + escapedFileName],
  ];
  // Enroll download ReadableStream and get sw-download ID
  const {swDownloadId} = await enrollDownload(headers, readableStreamForDownload);
  // Download via Service Worker
  const aTag = document.createElement('a');
  // NOTE: '/sw-download/v2' can be received by Service Worker in src/sw.js
  // NOTE: URL fragment is passed to Service Worker but not passed to Web server
  aTag.href = `/sw-download/v2#?id=${swDownloadId}`;
  aTag.target = "_blank";
  aTag.click();
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
