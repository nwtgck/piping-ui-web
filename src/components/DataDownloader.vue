<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="hasError">
      <span>{{ strings['download_in_downloader'] }} #{{ props.downloadNo }}</span>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="props.protection.type === 'passwordless' && verificationStep.type === 'initial'">
        <span style="">{{ strings['waiting_for_sender'] }}</span>
      </v-alert>

      <span v-if="props.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
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
        {{ errorMessage() }}
      </v-alert>

    </v-expansion-panel-content>
  </v-expansion-panel>

</template>

<script lang="ts">
/* eslint-disable no-console */

import {Component, Prop, Vue} from 'vue-property-decorator';
import urlJoin from 'url-join';
import {mdiAlert, mdiChevronDown} from "@mdi/js";
import {stringsByLang} from "@/strings/strings-by-lang";
import * as pipingUiUtils from "@/piping-ui-utils";
import type {Protection, VerificationStep} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";
import {pipingUiAuthAsync} from "@/pipingUiAuthWithWebpackChunkName"
import {language} from "@/language";

const FileSaverAsync = () => import('file-saver');
const binconvAsync = () => import('binconv');
const swDownloadAsync = () => import("@/sw-download");
const utilsAsync = () => import("@/utils");

export type DataDownloaderProps = {
  downloadNo: number,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};

// NOTE: Automatically download when mounted
@Component({
  components: {
    VerificationCode,
  },
})
export default class DataDownloader extends Vue {
  @Prop() private props!: DataDownloaderProps;

  private errorMessage: () => string = () => "";
  private verificationStep: VerificationStep = {type: 'initial'};

  // for language support
  private get strings() {
    return stringsByLang(language.value);
  }

  private get hasError(): boolean {
    return this.errorMessage() !== "";
  }

  private get headerIcon(): string {
    if (this.hasError) {
      return mdiAlert;
    } else {
      return mdiChevronDown;
    }
  }

  private get headerIconColor(): string | undefined {
    if (this.hasError) {
      return "error";
    } else {
      return undefined
    }
  }

  private get isReadyToDownload(): boolean {
    return this.props.protection.type === 'passwordless' ? this.verificationStep.type === 'verified' && this.verificationStep.verified : true
  }

  private get downloadPath(): string {
    return urlJoin(this.props.serverUrl, encodeURI(this.props.secretPath));
  }

  async mounted() {
    // Scroll to this element
    // NOTE: no need to add `await`
    pipingUiUtils.scrollTo(this.$el);

    // Key exchange
    const keyExchangeRes = await (await pipingUiAuthAsync).keyExchangeAndReceiveVerified(
      this.props.serverUrl,
      this.props.secretPath,
      this.props.protection,
      (step: VerificationStep) => {
        this.verificationStep = step;
      }
    );

    // If error
    if (keyExchangeRes.type === "error") {
      this.errorMessage = () => keyExchangeRes.errorMessage(language.value);
      return;
    }
    const {key} = keyExchangeRes;

    const swDownload = await swDownloadAsync();
    // If not supporting stream-download via Service Worker
    if (!swDownload.supportsSwDownload()) {
      // If password-protection is disabled
      if (key === undefined) {
        console.log("downloading with dynamic <a href> click...");
        // Download or show on browser sometimes
        const aTag = document.createElement('a');
        aTag.href = this.downloadPath;
        aTag.target = "_blank";
        aTag.download = this.props.secretPath;
        aTag.click();
        return;
      }
      console.log("downloading and decrypting with FileSaver.saveAs()...");
      const binconv = await binconvAsync();
      // Get response
      const res = await fetch(this.downloadPath);
      const resBody = await binconv.blobToUint8Array(await res.blob());
      // Decrypt the response body
      let plain: Uint8Array;
      try {
        plain = await (await utilsAsync()).decrypt(resBody, key);
      } catch (e) {
        console.log("failed to decrypt", e);
        this.errorMessage = () => this.strings['password_might_be_wrong'];
        return;
      }
      // Save
      const FileSaver = await FileSaverAsync();
      FileSaver.saveAs(binconv.uint8ArrayToBlob(plain), this.props.secretPath);
      return;
    }
    console.log("downloading streaming and decrypting with the Service Worker...");
    const utils = await utilsAsync();
    const res = await fetch(this.downloadPath);
    let readableStream: ReadableStream<Uint8Array> = res.body!
    if (key !== undefined) {
      try {
        readableStream = await utils.decrypt(res.body!, key);
      } catch (e) {
        console.log("failed to decrypt", e);
        this.errorMessage = () => this.strings['password_might_be_wrong'];
        return;
      }
    }
    // Enroll download ReadableStream
    const enrollDownloadRes: MessageEvent = await enrollDownloadReadableStream(readableStream);
    // Get download ID
    const {downloadId} = enrollDownloadRes.data;
    // Download via Service Worker
    const aTag = document.createElement('a');
    // NOTE: '/sw-download/v2' can be received by Service Worker in src/sw.js
    // NOTE: URL fragment is passed to Service Worker but not passed to Web server
    aTag.href = `/sw-download/v2#?id=${downloadId}&filename=${(this.props.secretPath)}`;
    aTag.target = "_blank";
    aTag.click();
  }
}

// (base: https://googlechrome.github.io/samples/service-worker/post-message/)
function enrollDownloadReadableStream(readableStream: ReadableStream): Promise<MessageEvent> {
  return new Promise((resolve, reject) => {
    if (!("serviceWorker" in navigator)) {
      reject(new Error("Service Worker not supported"));
      return;
    }
    if (navigator.serviceWorker.controller === null) {
      reject(new Error("navigator.serviceWorker.controller is null"));
      return;
    }
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = resolve;
    navigator.serviceWorker.controller.postMessage({
      type: 'enroll-download',
      readableStream,
    }, [messageChannel.port2, readableStream] as Transferable[]);
  });
}
</script>
