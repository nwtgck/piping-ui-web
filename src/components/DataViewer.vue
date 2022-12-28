<template>
  <v-expansion-panel ref="rootElement">
    <v-expansion-panel-header :disable-icon-rotate="isDoneDownload || hasError">
      <span>{{ strings['view_in_viewer'] }} #{{ composedProps.viewNo }}</span>
      <!-- Percentage -->
      {{ progressPercentage ? `${progressPercentage.toFixed(2)} %` : "" }}
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon}}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'initial'" :color="canceled ? 'grey' : undefined">
        <span style="">{{ strings['waiting_for_sender'] }}</span>
      </v-alert>

      <span v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <VerificationCode :value="verificationStep.verificationCode" :color="canceled ? 'grey' : undefined"/>
      </span>

      <!-- NOTE: Don't use v-if because the "sibling" element uses "ref" and the ref is loaded in mounted(), but don't know why "sibling" affects. -->
      <span v-show="isReadyToDownload">
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

      <div v-show="isDecrypting">
        <div style="text-align: center">
          {{ strings['decrypting'] }}
        </div>
        <!-- Decryption progress bar -->
        <v-progress-linear indeterminate />
      </div>

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>{{ strings['download_url'] }}</td>
          <td>{{ downloadPath }}</td>
        </tr>
        <tr v-if="pipingUiAuthVerificationCode !== undefined" class="text-left">
          <td>{{ strings['verification_code'] }}</td>
          <td>{{ pipingUiAuthVerificationCode }}</td>
        </tr>
        </tbody>
      </v-simple-table>

      <!-- NOTE: The reason why don't use .protection.type === 'password' is that a user may forget to check "Protect with password" despite the data is encrypted with a password -->
      <div v-if="composedProps.protection.type !== 'passwordless' && isDoneDownload">
        <v-layout>
          <v-switch v-model="enablePasswordReinput"
                    inset
                    :label="strings['reinput_password']"
                    color="blue"
                    style="padding-left: 0.5em;"/>

          <v-text-field v-if="enablePasswordReinput"
                        v-model="password"
                        :type="showsPassword ? 'text' : 'password'"
                        :label="strings['password']"
                        :append-icon="showsPassword ? mdiEye : mdiEyeOff"
                        @click:append="showsPassword = !showsPassword"
                        single-line
                        style="margin-left: 0.5em;"
                        outlined/>
        </v-layout>
        <div v-if="enablePasswordReinput" style="text-align: right">
          <v-btn color="primary"
                 text
                 @click="decryptIfNeedAndViewBlob(password)">
            <v-icon >{{ mdiKey }}</v-icon>
            {{ strings['unlock'] }}
          </v-btn>
          <v-btn color="primary"
                 text
                 @click="viewRaw()">
            <v-icon >{{ mdiFeatureSearchOutline }}</v-icon>
            {{ strings['view_raw'] }}
          </v-btn>
        </div>
      </div>

      <!-- Image viewer -->
      <div v-show="imgSrc.url !== undefined" style="text-align: center">
        <img :src="imgSrc.url"
             style="width: 95%"
             data-testid="image">
      </div>

      <!-- Video viewer -->
      <div v-if="videoSrc.url !== undefined" style="text-align: center">
        <video :src="videoSrc.url"
               style="width: 95%"
               controls
               data-testid="video"/>
      </div>

      <!-- Text viewer -->
      <!-- NOTE: Don't use v-if because the inner uses "ref" and the ref is loaded in mounted()-->
      <div v-show="linkifiedText !== undefined" style="text-align: center">
        <div style="text-align: right">
          <v-tooltip v-model="showsCopied" bottom>
            <template v-slot:activator="{}">
              <v-btn @click="copyToClipboard()" style="background-color: #dcdcdc; margin-bottom: 0.3em;">
                <!-- (from: https://iconify.design/icon-sets/octicon/clippy.html) -->
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1.5em" height="1.5em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z" fill="#000000"/></svg>
              </v-btn>
            </template>
            <span>{{ strings['copied'] }}</span>
          </v-tooltip>
        </div>
        <pre v-html="linkifiedText"
             class="text-view"/>
      </div>

      <div v-if="isCancelable" style="text-align: right">
        <!-- Cancel button -->
        <v-btn color="warning"
               outlined
               class="ma-2 justify-end"
               @click="cancel()">
          <v-icon >{{ mdiCloseCircle }}</v-icon>
          {{ strings['cancel'] }}
        </v-btn>
      </div>

      <!-- Save button -->
      <v-btn v-if="isDoneDownload && !hasError"
             color="primary"
             block
             @click="save()"
             style="margin-top: 1em;">
        <v-icon >{{ mdiContentSave }}</v-icon>
        {{ strings['save'] }}
      </v-btn>

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

export type DataViewerProps = {
  viewNo: number,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};
</script>

<script setup lang="ts">
import Vue, {ref, computed, watch, onMounted} from "vue";
import urlJoin from 'url-join';
import linkifyHtml from 'linkifyjs/html';
const FileSaverAsync = () => import('file-saver').then(p => p.default);
const clipboardCopyAsync = () => import("clipboard-copy").then(p => p.default);
import * as fileType from 'file-type/browser';
import {blobToUint8Array} from 'binconv/dist/src/blobToUint8Array';
import {uint8ArrayToBlob} from 'binconv/dist/src/uint8ArrayToBlob';
import {blobToReadableStream} from 'binconv/dist/src/blobToReadableStream';
import {mdiAlert, mdiCheck, mdiChevronDown, mdiContentSave, mdiCloseCircle, mdiEye, mdiEyeOff, mdiKey, mdiFeatureSearchOutline} from "@mdi/js";
import * as pipingUiRobust from "@/piping-ui-robust";

import * as openPgpUtils from '@/utils/openpgp-utils';
import * as pipingUiUtils from "@/piping-ui-utils";
import {type VerificationStep} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";
import {BlobUrlManager} from "@/blob-url-manager";
import * as pipingUiAuth from "@/piping-ui-auth";
import {uint8ArrayIsText} from "@/utils/uint8ArrayIsText";
import {readableBytesString} from "@/utils/readableBytesString";
import {readBlobAsText} from "@/utils/readBlobAsText";
import {sanitizeHtmlAllowingATag} from "@/utils/sanitizeHtmlAllowingATag";
import {makePromise} from "@/utils/makePromise";
import {useErrorMessage} from "@/useErrorMessage";
import {getReadableStreamWithProgress} from "@/utils/getReadableStreamWithProgress";
import {strings} from "@/strings/strings";
import {ecdsaP384SigningKeyPairPromise} from "@/signing-key";

// eslint-disable-next-line no-undef
const props = defineProps<{ composedProps: DataViewerProps }>();

const {promise: canceledPromise, resolve: cancel} = makePromise<void>();
canceledPromise.then(() => {
  canceled.value = true;
});

// Progress bar setting
const progressSetting = ref<{loadedBytes: number, totalBytes?: number}>({
  loadedBytes: 0,
  totalBytes: undefined,
});
const {errorMessage, updateErrorMessage} = useErrorMessage();
const isDoneDownload = ref(false);
const canceled = ref(false);
const imgSrc= ref(new BlobUrlManager());
const videoSrc= ref(new BlobUrlManager());
const text = ref('');
const enablePasswordReinput = ref(false);
const password = ref(props.composedProps.protection.type === "password" ? props.composedProps.protection.password : undefined);
const showsPassword = ref(false);
const verificationStep = ref<VerificationStep>({type: 'initial'});
let rawBlob = new Blob();
let blob = new Blob();
const showsCopied = ref(false);
const isDecrypting = ref(false);
const pipingUiAuthVerificationCode = ref<string | undefined>();

const progressPercentage = computed<number | null>(() => {
  if (isDoneDownload.value) {
    return 100;
  } else if (progressSetting.value.totalBytes === undefined) {
    return null;
  } else if (progressSetting.value.totalBytes === 0) {
    return 100;
  } else {
    return progressSetting.value.loadedBytes / progressSetting.value.totalBytes * 100;
  }
});

const hasError = computed<boolean>(() => errorMessage.value !== undefined);

const headerIcon = computed<string>(() => {
  if (hasError.value) {
    return mdiAlert;
  } else if (canceled.value) {
    return mdiCloseCircle;
  } else if (isDoneDownload.value) {
    return mdiCheck;
  } else {
    return mdiChevronDown;
  }
});

const headerIconColor = computed<string | undefined>(() => {
  if (hasError.value) {
    return "error";
  } else if (canceled.value) {
    return "grey";
  } else if (isDoneDownload.value) {
    return "teal";
  } else {
    return undefined
  }
});

const isCancelable = computed<boolean>(() => {
  return !isDoneDownload.value && !hasError.value && !canceled.value;
});

const isReadyToDownload = computed<boolean>(() => {
  return props.composedProps.protection.type === 'passwordless' ? verificationStep.value.type === 'verified' && verificationStep.value.verified : true
});

// TODO: rename to downloadUrl
const downloadPath = computed<string>(() => {
  return urlJoin(props.composedProps.serverUrl, props.composedProps.secretPath);
});

const linkifiedText = ref<string>();
watch(text, async () => {
  linkifiedText.value = await sanitizeHtmlAllowingATag(linkifyHtml(text.value, {
    defaultProtocol: 'https'
  }));
});

async function copyToClipboard() {
  showsCopied.value = true;
  const clipboardCopy = await clipboardCopyAsync()
  await clipboardCopy(text.value);
  await new Promise(resolve => setTimeout(resolve, 2000));
  showsCopied.value = false;
}

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
    await ecdsaP384SigningKeyPairPromise.value,
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
      case "key_exchange_error": {
        const errorCode = keyExchangeRes.error.keyExchangeErrorCode;
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

  let rawStream: ReadableStream<Uint8Array>;
  if (props.composedProps.protection.type === "passwordless") {
    const abortController = new AbortController();
    canceledPromise.then(() => {
      abortController.abort();
    });
    // Passwordless transfer always uses Piping UI Robust
    rawStream = pipingUiRobust.receiveReadableStream(props.composedProps.serverUrl, props.composedProps.secretPath, {
      abortSignal: abortController.signal,
    });
  } else {
    const abortController = new AbortController();
    canceledPromise.then(() => {
      abortController.abort();
    });
    let res: Response;
    try {
      res = await fetch(downloadPath.value, {
        signal: abortController.signal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.log(err);
      updateErrorMessage(() => strings.value?.['data_viewer_fetch_error']);
      return;
    }
    if (res.status !== 200) {
      const message = await res.text();
      updateErrorMessage(() => strings.value?.['fetch_status_error']({ status: res.status, message }));
      return;
    }
    const contentLengthStr = res.headers.get("Content-Length");
    if (contentLengthStr !== null) {
      progressSetting.value.totalBytes = parseInt(contentLengthStr, 10);
    }
    rawStream = res.body!;
  }

  const {stream: rawStreamWithProgress, cancel: cancelRawStreamWithProgress} = getReadableStreamWithProgress(rawStream, (n) => {
    progressSetting.value.loadedBytes += n;
  });
  try {
    canceledPromise.then(() => {
      cancelRawStreamWithProgress();
    });
    // Get raw response body
    rawBlob = await new Response(rawStreamWithProgress).blob();
  } catch (err) {
    updateErrorMessage(() => strings.value?.['data_viewer_body_read_error']({ error: err }));
    return;
  }
  if (canceled.value) {
    return;
  }
  isDoneDownload.value = true;
  // Decrypt and view blob if possible
  await decryptIfNeedAndViewBlob(key);
});

async function viewBlob() {
  // Reset viewers
  imgSrc.value.clearIfNeed();
  videoSrc.value.clearIfNeed();
  text.value = '';

  const isText: boolean = await (async () => {
    // NOTE: 4100 was used in FileType.minimumBytes in file-type until 13.1.2
    const nBytes = 4100;
    // Get first bytes from blob
    const firstChunk: Uint8Array = await blobToUint8Array(blob.slice(0, nBytes));
    return uint8ArrayIsText(firstChunk);
  })();

  // If body is text
  if (isText) {
    // Set text
    text.value = await readBlobAsText(blob);
  } else {
    // Detect type of blob
    const fileTypeResult = await fileType.fromStream(blobToReadableStream(blob));
    if (fileTypeResult !== undefined) {
      if (fileTypeResult.mime.startsWith("image/")) {
        imgSrc.value.set(blob);
      } else if (fileTypeResult.mime.startsWith("video/")) {
        videoSrc.value.set(blob);
      } else if (fileTypeResult.mime.startsWith("text/")) {
        // Set text
        text.value = await readBlobAsText(blob);
      }
    }
  }
}

async function decryptIfNeedAndViewBlob(password: string | Uint8Array | undefined) {
  blob = await (async () => {
    if (password === undefined) {
      return rawBlob;
    } else {
      // Get response body
      const resBody = await blobToUint8Array(rawBlob);
      try {
        isDecrypting.value = true;
        // Decrypt the response body
        const plain = await openPgpUtils.decrypt(resBody, password);
        enablePasswordReinput.value = false;
        updateErrorMessage(undefined);
        return uint8ArrayToBlob(plain);
      } catch (err) {
        enablePasswordReinput.value = true;
        updateErrorMessage(() => strings.value?.['password_might_be_wrong']);
        console.log('Decrypt error:', err);
        return new Blob();
      } finally {
        isDecrypting.value = false;
      }
    }
  })();

  // View blob if possible
  viewBlob();
}

function viewRaw() {
  blob = rawBlob;
  enablePasswordReinput.value = false;
  updateErrorMessage(undefined);
  // View blob if possible
  viewBlob();
}

async function save(): Promise<void> {
  const FileSaver = await FileSaverAsync();
  const fileName = await (async () => {
    // If secret path has extension
    if (props.composedProps.secretPath.match(/.+\..+/)) {
      return props.composedProps.secretPath;
    }
    const fileTypeResult = await fileType.fromStream(blobToReadableStream(blob));
    if (fileTypeResult === undefined) {
      return props.composedProps.secretPath;
    }
    return `${props.composedProps.secretPath}.${fileTypeResult.ext}`;
  })();
  FileSaver.saveAs(blob, fileName);
}
</script>

<style scoped>
.text-view {
  border: 1px solid #ccc;
  text-align: left;
  padding: 0.5em;
  max-height: 15em;
  min-height: 4em;
  overflow-y: scroll;
  border-radius: 5px;
}
</style>
