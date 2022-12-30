<template>
  <v-expansion-panel ref="rootElement" active="true">
    <v-expansion-panel-header :disable-icon-rotate="isDoneUpload || hasError">
      <span>{{ strings['upload'] }} #{{ composedProps.uploadNo }}</span>
      <!-- Percentage -->
      {{ isReadyToUpload ? progressPercentage && `${progressPercentage.toFixed(2)} %` : '' }}
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon }}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'initial'" :color="canceled ? 'grey' : undefined">
        <span>{{ strings['waiting_for_receiver'] }}</span>
      </v-alert>

      <span v-if="composedProps.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <VerificationCode :value="verificationStep.verificationCode" :color="canceled ? 'grey' : undefined"/>

        <v-layout>
          <v-flex xs6>
            <v-btn :color="canceled ? 'grey' : 'success'"
                   :disabled="composedProps.protection.alwaysSendVerify || canceled"
                   @click="verify(true)"
                   block
                   data-testid="passwordless_verified_button">
              <v-icon left dark>{{ mdiCheck }}</v-icon>
              {{ strings['passwordless_verified'] }}
            </v-btn>
          </v-flex>
          <v-flex xs6>
            <v-btn :color="canceled ? 'grey' : 'error'"
                   :disabled="canceled"
                   @click="verify(false)"
                   block>
              <v-icon left dark>{{ mdiCancel }}</v-icon>
              {{ strings['cancel'] }}
            </v-btn>
          </v-flex>
        </v-layout>
      </span>

      <div v-show="isCompressing">
        <div style="text-align: center">
          {{ strings['compressing'] }}
        </div>
        <!-- Compression progress bar -->
        <v-progress-linear indeterminate />
      </div>

      <div v-show="isNonStreamingEncrypting">
        <div style="text-align: center">
          {{ strings['encrypting'] }}
        </div>
        <!-- Encryption progress bar -->
        <v-progress-linear indeterminate />
      </div>

      <div v-show="isReadyToUpload">
        <!-- loaded of total -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <div style="text-align: center" v-on="on">
              {{ `${readableBytesString(progressSetting.loadedBytes, 1)}${ progressSetting.totalBytes === undefined ? "" : ` of ${readableBytesString(progressSetting.totalBytes, 1)}` }` }}
            </div>
          </template>
          <span>{{ `${progressSetting.loadedBytes}${ progressSetting.totalBytes === undefined ? "" : ` of ${progressSetting.totalBytes}` }` }}</span>
        </v-tooltip>
        <!-- Upload progress bar -->
        <v-progress-linear :value="progressPercentage" :color="canceled ? 'grey' : undefined" :indeterminate="!canceled && progressSetting.totalBytes === undefined"/>
      </div>

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>{{ strings['upload_url'] }}</td>
          <td>{{ uploadPath }}</td>
        </tr>
        <tr v-if="pipingUiAuthVerificationCode !== undefined" class="text-left">
          <td>{{ strings['verification_code'] }}</td>
          <td>{{ pipingUiAuthVerificationCode }}</td>
        </tr>
        </tbody>
      </v-simple-table>

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

      <v-alert type="error"
               outlined
               v-html="errorMessage"
               :value="hasError" />

    </v-expansion-panel-content>
  </v-expansion-panel>

</template>
<script lang="ts">
import {type Protection} from "@/datatypes";

export type DataUploaderProps = {
  uploadNo: number,
  data: File[] | string,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};
</script>

<script setup lang="ts">
/* eslint-disable */
import Vue, {computed, onMounted, ref} from "vue";
import urlJoin from 'url-join';
import {blobToReadableStream} from "binconv/dist/src/blobToReadableStream";
import * as openPgpUtils from '@/utils/openpgp-utils';
import * as pipingUiUtils from "@/piping-ui-utils";
import * as pipingUiRobust from "@/piping-ui-robust";
import {mdiAlert, mdiCancel, mdiCheck, mdiChevronDown, mdiCloseCircle} from "@mdi/js";
import type {VerificationStep} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";
import * as pipingUiAuth from "@/piping-ui-auth";
import {readableBytesString} from "@/utils/readableBytesString";
import {zipFilesAsReadableStream} from "@/utils/zipFilesAsReadableStream";
import {supportsFetchUploadStreaming} from "@/utils/supportsFetchUploadStreaming";
import {makePromise} from "@/utils/makePromise";
import {forceDisableStreamingUpload} from "@/settings/forceDisableStreamingUpload";
import {useErrorMessage} from "@/useErrorMessage";
import {strings} from "@/strings/strings";
import {ecdsaP384SigningKeyPairPromise} from "@/signing-key";
import * as fileType from 'file-type/browser';

const props = defineProps<{ composedProps: DataUploaderProps }>();

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

const xhr: XMLHttpRequest = new XMLHttpRequest();
const canceled = ref(false);
const isCompressing = ref(false);
const isNonStreamingEncrypting = ref(false);
const verificationStep = ref<VerificationStep>({type: 'initial'});
const pipingUiAuthVerificationCode = ref<string | undefined>();

const progressPercentage = computed<number | null>(() => {
  if (progressSetting.value.totalBytes === undefined) {
    return null;
  } else if (progressSetting.value.totalBytes === 0) {
    return 100;
  } else {
    return progressSetting.value.loadedBytes / progressSetting.value.totalBytes * 100;
  }
});

const isDoneUpload = computed<boolean>(() => {
  return progressPercentage.value === 100;
});

const uploadPath = computed<string>(() => urlJoin(props.composedProps.serverUrl, props.composedProps.secretPath));

const hasError = computed<boolean>(() => errorMessage.value !== undefined);

const headerIcon = computed<string>(() => {
  if (hasError.value) {
    return mdiAlert;
  } else if (canceled.value) {
    return mdiCloseCircle;
  } else if (isDoneUpload.value) {
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
  } else if (isDoneUpload.value) {
    return "teal";
  } else {
    return undefined
  }
});

const isReadyToUpload = computed<boolean>(() => {
  const notCompressingAndEncrypting = !isCompressing.value && !isNonStreamingEncrypting.value;
  if (props.composedProps.protection.type === 'passwordless') {
    return verificationStep.value.type === 'verified' && verificationStep.value.verified && notCompressingAndEncrypting;
  } else {
    return notCompressingAndEncrypting;
  }
});

const isCancelable = computed<boolean>(() =>
  isReadyToUpload && !isDoneUpload.value && !hasError.value && !canceled.value && verificationStep.value.type !== "verification_code_arrived"
);

const makePlainBodyPromise: Promise<
  { mimeType: undefined, fileExtension: undefined, data: Blob, zipping: false } |
  { mimeType: string, fileExtension: string, data: Blob, zipping: false } |
  { mimeType: "application/zip", fileExtension: "zip", data: ReadableStream<Uint8Array>, zipping: true }
> = (async () => {
  const data: File[] | string = props.composedProps.data;
  // Text
  if (typeof data === "string") {
    return { mimeType: 'text/plain', fileExtension: "txt", data: new Blob([data]), zipping: false };
  }
  // One file
  if (data.length === 1) {
    const d = data[0];
    const fileTypeResult = await fileType.fromBlob(d);
    if (fileTypeResult === undefined) {
      return { mimeType: undefined, fileExtension: undefined, data: d, zipping: false };
    }
    return { mimeType: fileTypeResult.mime, fileExtension: fileTypeResult.ext, data: d, zipping: false };
  }
  // Multiple files
  const files: File[] = data;
  return {
    mimeType: "application/zip",
    fileExtension: "zip",
    // Zip files
    data: await zipFilesAsReadableStream(files),
    zipping: true,
  };
})();

const rootElement = ref<Vue>();

// NOTE: Automatically upload when mounted
onMounted(async () => {
  // Scroll to this element
  // NOTE: no need to add `await`
  pipingUiUtils.scrollTo(rootElement.value!.$el);

  switch (props.composedProps.protection.type) {
    case 'raw':
      // Send
      await send(undefined);
      break;
    case 'password':
      // Send
      await send(props.composedProps.protection.password);
      break;
    case 'passwordless': {
      // Key exchange
      const keyExchangeRes = await pipingUiAuth.keyExchange(
        props.composedProps.serverUrl,
        'sender',
        props.composedProps.secretPath,
        await ecdsaP384SigningKeyPairPromise.value,
        canceledPromise,
      );
      if (keyExchangeRes.type === 'canceled') {
        return;
      }
      if (keyExchangeRes.type === 'error') {
        verificationStep.value = {type: 'error'};
        updateErrorMessage(() => strings.value?.['key_exchange_error'](keyExchangeRes.keyExchangeError));
        return;
      }
      const {key, mainPath, verificationCode} = keyExchangeRes;
      verificationStep.value = {type: 'verification_code_arrived', mainPath, verificationCode, key};
      if (props.composedProps.protection.alwaysSendVerify) {
        await verify(true);
      }
      break;
    }
  }
});

async function verify(verified: boolean) {
  if (verificationStep.value.type !== 'verification_code_arrived') {
    throw new Error("Unexpected state: this.verificationStep.type should be 'verification_code_arrived'");
  }
  const {key, mainPath, verificationCode} = verificationStep.value;
  verificationStep.value = {type: 'verified', verified};

  const plainBody = await makePlainBodyPromise;
  const parcelExtension = plainBody.mimeType === undefined ? undefined : { version: 1, mimeType: plainBody.mimeType, fileExtension: plainBody.fileExtension } as const;
  await pipingUiAuth.verify(props.composedProps.serverUrl, mainPath, key, verified, parcelExtension, canceledPromise);

  if (!verified) {
    return;
  }
  // If verified, send

  pipingUiAuthVerificationCode.value = verificationCode;

  // Check whether fetch() upload streaming is supported
  const supportsUploadStreaming = await supportsFetchUploadStreaming(props.composedProps.serverUrl);
  console.log("streaming upload support: ", supportsUploadStreaming);
  console.log("force disable streaming upload: ", forceDisableStreamingUpload.value);

  // Convert plain body to ReadableStream
  const plainBodyStream: ReadableStream<Uint8Array> = plainBody.data instanceof Blob ? blobToReadableStream(plainBody.data): plainBody.data;
  const plainBodySize: number | undefined = plainBody.data instanceof Blob ? plainBody.data.size : undefined;
  // Attach progress
  const plainStreamWithProgress = getReadableStreamWithProgress(plainBodyStream, plainBodySize);
  // Encrypt
  const encryptedStream = await openPgpUtils.encrypt(plainStreamWithProgress, key);

  const abortController = new AbortController();
  canceledPromise.then(() => {
    abortController.abort();
  });
  // Passwordless transfer always uses Piping UI Robust
  // TODO: notify when canceled because Piping UI Robust on receiver side keeps receiving
  await pipingUiRobust.sendReadableStream(
    props.composedProps.serverUrl,
    mainPath,
    encryptedStream,
    {
      abortSignal: abortController.signal,
      fetchUploadStreamingSupported: !forceDisableStreamingUpload.value && supportsUploadStreaming
    },
  );
  return;
}

async function send(password: string | Uint8Array | undefined) {
  const plainBody = await makePlainBodyPromise;
  // If password protection is disabled
  if (password === undefined) {
    const plainBlob: Blob = await (async () => {
      if (plainBody.zipping) {
        // TODO: not convert ReadableStream to Blob and remove plainBody.zipping when not convert
        const stream = plainBody.data;
        isCompressing.value = true;
        const blob = await new Response(stream).blob();
        isCompressing.value = false;
        return blob;
      }
      return plainBody.data;
    })();
    uploadByXhr(plainBlob, plainBlob.size);
    return
  }
  // Check whether fetch() upload streaming is supported
  const supportsUploadStreaming = await supportsFetchUploadStreaming(props.composedProps.serverUrl);
  console.log("streaming upload support: ", supportsUploadStreaming);
  console.log("force disable streaming upload: ", forceDisableStreamingUpload.value);

  // Convert plain body blob to ReadableStream
  const plainBodyStream: ReadableStream<Uint8Array> = plainBody.data instanceof Blob ? new Response(plainBody.data).body! : plainBody.data;

  // fetch() upload streaming is not supported
  if (forceDisableStreamingUpload.value || !supportsUploadStreaming) {
    isNonStreamingEncrypting.value = true;
    // Get encrypted
    const encryptedStream: ReadableStream<Uint8Array> = await openPgpUtils.encrypt(plainBodyStream, password);
    const encryptedBlob: Blob = await new Response(encryptedStream).blob();
    isNonStreamingEncrypting.value = false;
    // FIXME: progress shows encrypted loaded bytes but it should show plain loaded bytes.
    uploadByXhr(encryptedBlob, encryptedBlob.size);
    return;
  }
  const plainBodySize: number | undefined = plainBody.data instanceof Blob ? plainBody.data.size : undefined;
  // Attach progress
  const plainStreamWithProgress = getReadableStreamWithProgress(plainBodyStream, plainBodySize);
  // Encrypt
  const encryptedStream = await openPgpUtils.encrypt(plainStreamWithProgress, password);
  const abortController = new AbortController();
  canceledPromise.then(() => {
    abortController.abort();
  });
  try {
    // Upload encrypted stream
    const res = await fetch(uploadPath.value, {
      method: 'POST',
      body: encryptedStream,
      duplex: 'half',
      signal: abortController.signal,
    } as RequestInit);
    if (res.status !== 200) {
      const message = await res.text();
      updateErrorMessage(() => strings.value?.['fetch_status_error']({status: res.status, message}));
      return;
    }
    await res.text();
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return;
    }
    updateErrorMessage(() => strings.value?.['data_uploader_xhr_upload_error']);
  }
}

function uploadByXhr(body: Blob | Uint8Array, bodyLength: number) {
  canceledPromise.then(() => {
    xhr.abort();
  });
  // Send
  xhr.open('POST', uploadPath.value, true);
  xhr.responseType = 'text';
  // Update progress bar
  xhr.upload.onprogress = (ev) => {
    progressSetting.value.loadedBytes = ev.loaded;
    progressSetting.value.totalBytes  = ev.total;
  };
  xhr.upload.onload = () => {
    // Send finished
    if (xhr.status === 200) {
      if (progressSetting.value.totalBytes !== undefined) {
        progressSetting.value.loadedBytes = progressSetting.value.totalBytes;
      }
    }
  };
  xhr.onload = () => {
    if (xhr.status !== 200) {
      updateErrorMessage(() => strings.value?.['xhr_status_error']({
        status: xhr.status,
        response: xhr.responseText
      }));
    }
  };
  xhr.onerror = (ev) => {
    updateErrorMessage(() => strings.value?.['data_uploader_xhr_onerror']({serverUrl: props.composedProps.serverUrl}));
  };
  xhr.upload.onerror = () => {
    updateErrorMessage(() => strings.value?.['data_uploader_xhr_upload_error']);
  };
  xhr.send(body);
  // Initialize progress bar
  progressSetting.value.loadedBytes = 0;
  progressSetting.value.totalBytes = bodyLength;
}

function getReadableStreamWithProgress(baseStream: ReadableStream<Uint8Array>, baseLength: number | undefined): ReadableStream<Uint8Array> {
  const reader = baseStream.getReader();
  // Initialize progress bar
  progressSetting.value.loadedBytes = 0;
  progressSetting.value.totalBytes = baseLength;
  return new ReadableStream({
    async pull(ctrl) {
      const res = await reader.read();
      if (res.done) {
        ctrl.close();
        progressSetting.value.totalBytes = progressSetting.value.loadedBytes;
        return;
      }
      progressSetting.value.loadedBytes += res.value.byteLength;
      ctrl.enqueue(res.value);
    }
  });
}
</script>

<style scoped>

</style>
