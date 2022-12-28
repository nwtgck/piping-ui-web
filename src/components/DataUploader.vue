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
              {{ readableBytesString(progressSetting.loadedBytes, 1) }} of {{ readableBytesString(progressSetting.totalBytes, 1) }}
            </div>
          </template>
          <span>{{ progressSetting.loadedBytes }} of {{ progressSetting.totalBytes }}</span>
        </v-tooltip>
        <!-- Upload progress bar -->
        <v-progress-linear :value="progressPercentage" :color="canceled ? 'grey' : undefined"/>
      </div>

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>{{ strings['upload_url'] }}</td>
          <td>{{ uploadPath }}</td>
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
import {type ActualFileObject} from "filepond";
import {type Protection} from "@/datatypes";

export type DataUploaderProps = {
  uploadNo: number,
  data: ActualFileObject[] | string,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};
</script>

<script setup lang="ts">
/* eslint-disable */
import Vue, {computed, onMounted, ref, watch} from "vue";
import urlJoin from 'url-join';
import {blobToUint8Array} from 'binconv/dist/src/blobToUint8Array';
import {blobToReadableStream} from 'binconv/dist/src/blobToReadableStream';

import * as openPgpUtils from '@/utils/openpgp-utils';
import * as pipingUiUtils from "@/piping-ui-utils";
import * as pipingUiRobust from "@/piping-ui-robust";
import {mdiAlert, mdiCancel, mdiCheck, mdiChevronDown, mdiCloseCircle} from "@mdi/js";
import type {VerificationStep} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";
import * as pipingUiAuth from "@/piping-ui-auth";
import {readableBytesString} from "@/utils/readableBytesString";
import {zipFilesAsBlob} from "@/utils/zipFilesAsBlob";
import {supportsFetchUploadStreaming} from "@/utils/supportsFetchUploadStreaming";
import {makePromise} from "@/utils/makePromise";
import {forceDisableStreamingUpload} from "@/settings/forceDisableStreamingUpload";
import {useErrorMessage} from "@/useErrorMessage";
import {strings} from "@/strings/strings";

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
      const keyExchangeRes = await pipingUiAuth.keyExchange(props.composedProps.serverUrl, 'sender', props.composedProps.secretPath, canceledPromise);
      if (keyExchangeRes.type === 'canceled') {
        return;
      }
      if (keyExchangeRes.type === 'error') {
        verificationStep.value = {type: 'error'};
        updateErrorMessage(() => strings.value?.['key_exchange_error'](keyExchangeRes.errorCode));
        return;
      }
      const {key, verificationCode} = keyExchangeRes;
      verificationStep.value = {type: 'verification_code_arrived', verificationCode, key};
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
  const {key} = verificationStep.value;
  verificationStep.value = {type: 'verified', verified};

  await pipingUiAuth.verify(props.composedProps.serverUrl, props.composedProps.secretPath, key, verified, canceledPromise);

  if (!verified) {
    return;
  }

  // If verified, send
  const plainBody: Blob = await makePlainBody();

  // Check whether fetch() upload streaming is supported
  const supportsUploadStreaming = await supportsFetchUploadStreaming(props.composedProps.serverUrl);
  console.log("streaming upload support: ", supportsUploadStreaming);
  console.log("force disable streaming upload: ", forceDisableStreamingUpload.value);

  // Convert plain body to ReadableStream
  const plainStream = blobToReadableStream(plainBody);
  // Attach progress
  const plainStreamWithProgress = getReadableStreamWithProgress(plainStream, plainBody.size);
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
    props.composedProps.secretPath,
    encryptedStream,
    {
      abortSignal: abortController.signal,
      fetchUploadStreamingSupported: !forceDisableStreamingUpload.value && supportsUploadStreaming
    },
  );
  return;
}

async function makePlainBody() {
  const data: ActualFileObject[] | string = props.composedProps.data;
  // Text
  if (typeof data === "string") {
    return new Blob([data]);
    // One file
  } else if (data.length === 1) {
    return data[0];
    // Multiple files
  } else {
    const files: ActualFileObject[] = data;
    isCompressing.value = true;
    // Zip files
    const zipBlob: Blob = await zipFilesAsBlob(files);
    isCompressing.value = false;
    return zipBlob;
  }
}

async function send(password: string | Uint8Array | undefined) {
  const plainBody: Blob = await makePlainBody();
  // If password protection is disabled
  if (password === undefined) {
    uploadByXhr(plainBody, plainBody.size);
    return
  }
  // Check whether fetch() upload streaming is supported
  const supportsUploadStreaming = await supportsFetchUploadStreaming(props.composedProps.serverUrl);
  console.log("streaming upload support: ", supportsUploadStreaming);
  console.log("force disable streaming upload: ", forceDisableStreamingUpload.value);

  // fetch() upload streaming is not supported
  if (forceDisableStreamingUpload.value || !supportsUploadStreaming) {
    isNonStreamingEncrypting.value = true;
    // Convert plain body blob to Uint8Array
    const plainBodyArray: Uint8Array = await blobToUint8Array(plainBody);
    // Get encrypted
    const encrypted: Uint8Array = await openPgpUtils.encrypt(plainBodyArray, password);
    isNonStreamingEncrypting.value = false;
    uploadByXhr(encrypted, encrypted.byteLength);
    return;
  }

  // Convert plain body to ReadableStream
  const plainStream = blobToReadableStream(plainBody);
  // Attach progress
  const plainStreamWithProgress = getReadableStreamWithProgress(plainStream, plainBody.size);
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

function getReadableStreamWithProgress(baseStream: ReadableStream<Uint8Array>, baseLength: number): ReadableStream<Uint8Array> {
  const reader = baseStream.getReader();
  // Initialize progress bar
  progressSetting.value.loadedBytes = 0;
  progressSetting.value.totalBytes = baseLength;
  return new ReadableStream({
    async pull(ctrl) {
      const res = await reader.read();
      if (res.done) {
        ctrl.close();
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
