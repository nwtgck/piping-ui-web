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
import * as fileType from 'file-type/browser';

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
        readableStream = await utils.decryptStream(res.body!, key);
      } catch (e) {
        console.log("failed to decrypt", e);
        this.errorMessage = () => this.strings['password_might_be_wrong'];
        return;
      }
    }
    const [readableStreamForDownload, readableStreamForFileType] = readableStream.tee();
    const fileTypeResult = await fileType.fromStream(readableStreamForFileType);
    let fileName = this.props.secretPath;
    if (fileTypeResult !== undefined && !fileName.match(/.+\..+/)) {
      fileName = `${fileName}.${fileTypeResult.ext}`;
    }
    // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
    // Make filename RFC5987 compatible
    const escapedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');
    // FIXME: Use `[string, string][]` instead. But lint causes an error "0:0  error  Parsing error: Cannot read properties of undefined (reading 'map')"
    const headers: string[][] = [
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
  }
}

// (base: https://googlechrome.github.io/samples/service-worker/post-message/)
// FIXME: Use `[string, string][]` instead. But lint causes an error "0:0  error  Parsing error: Cannot read properties of undefined (reading 'map')"
async function enrollDownload(headers: string[][], readableStream: ReadableStream<Uint8Array>): Promise<{ swDownloadId: string }> {
  const utils = await utilsAsync();
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
    if (utils.canTransferReadableStream()) {
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
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await reader.read();
      if (result.done) {
        messageChannel.port1.postMessage({ done: true });
        break;
      }
      messageChannel.port1.postMessage(result, [result.value.buffer]);
    }
  });
}
</script>
