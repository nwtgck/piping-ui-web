<template>
  <v-expansion-panel ref="rootElement" active="true">
    <v-expansion-panel-header :disable-icon-rotate="isDoneUpload || hasError">
      <span>{{ strings['upload'] }} #{{ props.uploadNo }}</span>
      <!-- Percentage -->
      {{ isReadyToUpload ? progressPercentage && `${progressPercentage.toFixed(2)} %` : '' }}
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon }}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="props.protection.type === 'passwordless' && verificationStep.type === 'initial'">
        <span style="">{{ strings['waiting_for_receiver'] }}</span>
      </v-alert>

      <span v-if="props.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <VerificationCode :value="verificationStep.verificationCode"/>

        <v-layout>
          <v-flex xs6>
            <v-btn color="success"
                   @click="verify(true)"
                   block>
              <v-icon left dark>{{ icons.mdiCheck }}</v-icon>
              {{ strings['verify_and_send'] }}
            </v-btn>
          </v-flex>
          <v-flex xs6>
            <v-btn color="error"
                   @click="verify(false)"
                   block>
              <v-icon left dark>{{ icons.mdiCancel }}</v-icon>
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
        <v-progress-linear :value="progressPercentage"/>
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
               @click="cancelUpload()">
          <v-icon >{{ icons.mdiCloseCircle }}</v-icon>
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
/* eslint-disable no-console */
import Vue, {computed, defineComponent, onMounted, PropType, ref, watch} from "vue";
import urlJoin from 'url-join';
import {blobToUint8Array} from 'binconv/dist/src/blobToUint8Array';
import {stringToUint8Array} from 'binconv/dist/src/stringToUint8Array';
import {blobToReadableStream} from 'binconv/dist/src/blobToReadableStream';

import * as utils from '@/utils';
import * as pipingUiUtils from "@/piping-ui-utils";
import {stringsByLang} from "@/strings/strings-by-lang";
import {mdiAlert, mdiCancel, mdiCheck, mdiChevronDown, mdiCloseCircle} from "@mdi/js";
import type {Protection, VerificationStep, VerifiedParcel} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";
import {pipingUiAuthAsync} from "@/pipingUiAuthWithWebpackChunkName"
import {type ActualFileObject} from "filepond";
import {language} from "@/language";
import {globalStore} from "@/vue-global";


export type DataUploaderProps = {
  uploadNo: number,
  data: ActualFileObject[] | string,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};

// NOTE: Automatically upload when mounted
export default defineComponent({
  components: {
    VerificationCode,
  },
  props: {
    props: { type: Object as PropType<DataUploaderProps>, required: true },
  },
  setup(props, context) {
    // Progress bar setting
    const progressSetting = ref<{loadedBytes: number, totalBytes?: number}>({
      loadedBytes: 0,
      totalBytes: undefined,
    });

    const readableBytesString = utils.readableBytesString;

    // NOTE: Function makes dynamic language-switch support possible
    //       Delegation is to reassign this value
    const errorMessageDelegate = ref<() => string | Promise<string>>(() => "");

    const errorMessage = ref<string>("");
    watch([errorMessageDelegate, language], async () => {
      errorMessage.value = await errorMessageDelegate.value();
    });

    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const canceled = ref(false);
    const isCompressing = ref(false);
    const isNonStreamingEncrypting = ref(false);
    const verificationStep = ref<VerificationStep>({type: 'initial'});

    const icons = {
      mdiCloseCircle,
      mdiCheck,
      mdiCancel,
    };

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

    const uploadPath = computed<string>(() => urlJoin(props.props.serverUrl, props.props.secretPath));

    const hasError = ref<boolean>(false);
    watch(errorMessageDelegate, async () => {
      hasError.value = await errorMessageDelegate.value() !== "";
    });

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
        return "warning";
      } else if (isDoneUpload.value) {
        return "teal";
      } else {
        return undefined
      }
    });

    const isReadyToUpload = computed<boolean>(() => {
      const notCompressingAndEncrypting = !isCompressing.value && !isNonStreamingEncrypting.value;
      if (props.props.protection.type === 'passwordless') {
        return verificationStep.value.type === 'verified' && verificationStep.value.verified && notCompressingAndEncrypting;
      } else {
        return notCompressingAndEncrypting;
      }
    });

    const isCancelable = computed<boolean>(() =>
      isReadyToUpload && !isDoneUpload.value && !hasError.value && !canceled.value
    );

    // for language support
    const strings = computed(() => stringsByLang(language.value));

    const rootElement = ref<Vue>();

    onMounted(async () => {
      // Scroll to this element
      // NOTE: no need to add `await`
      pipingUiUtils.scrollTo(rootElement.value!.$el);

      switch (props.props.protection.type) {
        case 'raw':
          // Send
          await send(undefined);
          break;
        case 'password':
          // Send
          await send(props.props.protection.password);
          break;
        case 'passwordless': {
          // Key exchange
          const keyExchangeRes = await (await pipingUiAuthAsync).keyExchange(props.props.serverUrl, 'sender', props.props.secretPath);
          if (keyExchangeRes.type === 'error') {
            verificationStep.value = {type: 'error'};
            errorMessageDelegate.value = () => strings.value['key_exchange_error'](keyExchangeRes.errorCode);
            return;
          }
          const {key, verificationCode} = keyExchangeRes;
          verificationStep.value = {type: 'verification_code_arrived', verificationCode, key};
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

      const verifiedParcel: VerifiedParcel = {
        verified,
      };
      const encryptedVerifiedParcel = await utils.encrypt(
        stringToUint8Array(JSON.stringify(verifiedParcel)),
        key,
      );
      const path = urlJoin(props.props.serverUrl, await (await pipingUiAuthAsync).verifiedPath(props.props.secretPath));
      // Send verified or not
      await fetch(path, {
        method: 'POST',
        body: encryptedVerifiedParcel,
      });

      // If verified, send
      if (verified) {
        await send(key);
      }
    }

    async function send(password: string | Uint8Array | undefined) {
      const data: ActualFileObject[] | string = props.props.data;

      const plainBody: Blob = await (async () => {
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
          const zipBlob: Blob = await utils.zipFilesAsBlob(files);
          isCompressing.value = false;
          return zipBlob;
        }
      })();

      // If password protection is disabled
      if (password === undefined) {
        uploadByXhr(plainBody, plainBody.size);
        return
      }

      // Check whether fetch() upload streaming is supported
      const supportsUploadStreaming = await utils.supportsFetchUploadStreaming(props.props.serverUrl);
      console.log("streaming upload support: ", supportsUploadStreaming);
      console.log("force disable streaming upload: ", globalStore.forceDisableStreamingUpload);

      // fetch() upload streaming is not supported
      if (globalStore.forceDisableStreamingUpload || !supportsUploadStreaming) {
        isNonStreamingEncrypting.value = true;
        // Convert plain body blob to Uint8Array
        const plainBodyArray: Uint8Array = await blobToUint8Array(plainBody);
        // Get encrypted
        const encrypted: Uint8Array = await utils.encrypt(plainBodyArray, password);
        isNonStreamingEncrypting.value = false;
        uploadByXhr(encrypted, encrypted.byteLength);
        return;
      }

      // Convert plain body to ReadableStream
      const plainStream = blobToReadableStream(plainBody);
      // Attach progress
      const plainStreamWithProgress = getReadableStreamWithProgress(plainStream, plainBody.size);
      // Encrypt
      const encryptedStream = await utils.encrypt(plainStreamWithProgress, password);
      try {
        // Upload encrypted stream
        await fetch(uploadPath.value, {
          method: 'POST',
          body: encryptedStream,
          duplex: 'half',
        } as RequestInit);
      } catch {
        errorMessageDelegate.value = () => strings.value['data_uploader_xhr_upload_error'];
      }
    }

    function uploadByXhr(body: Blob | Uint8Array, bodyLength: number) {
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
          errorMessageDelegate.value = () => strings.value['xhr_status_error']({
            status: xhr.status,
            response: xhr.responseText
          });
        }
      };
      xhr.onerror = (ev) => {
        errorMessageDelegate.value = () => strings.value['data_uploader_xhr_onerror']({serverUrl: props.props.serverUrl});
      };
      xhr.upload.onerror = () => {
        errorMessageDelegate.value = () => strings.value['data_uploader_xhr_upload_error'];
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

    function cancelUpload(): void {
      xhr.abort();
      canceled.value = true;
    }

    return {
      progressSetting,
      readableBytesString,
      errorMessage,
      canceled,
      isCompressing,
      isNonStreamingEncrypting,
      verificationStep,
      icons,
      progressPercentage,
      isDoneUpload,
      uploadPath,
      hasError,
      headerIcon,
      headerIconColor,
      isReadyToUpload,
      isCancelable,
      strings,
      rootElement,
      send,
      cancelUpload,
      verify,
    };
  }
});
</script>

<style scoped>

</style>
