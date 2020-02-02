<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="isDoneDownload || hasError">
      <span>{{ strings['view_in_viewer'] }} #{{ props.viewNo }}</span>
      <!-- Percentage -->
      {{ progressPercentage ? `${progressPercentage.toFixed(2)} %` : "" }}
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon}}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <v-alert type="info" v-if="props.protection.type === 'passwordless' && verificationStep.type === 'initial'">
        <span style="">{{ strings['waiting_for_sender'] }}</span>
      </v-alert>

      <!-- NOTE: Don't use v-if because the "sibling" element uses "ref" and the ref is loaded in mounted(), but don't know why "sibling" affects. -->
      <span v-show="props.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <VerificationCode :value="verificationStep.verificationCode"/>
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
                           :indeterminate="progressPercentage === null && !canceled && errorMessage() === ''" />
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
        </tbody>
      </v-simple-table>

      <!-- NOTE: The reason why don't use .protection.type === 'password' is that a user may forget to check "Protect with password" despite the data is encrypted with a password -->
      <div v-if="props.protection.type !== 'passwordless' && isDoneDownload">
        <v-layout>
          <v-switch v-model="enablePasswordReinput"
                    inset
                    :label="strings['reinput_password']"
                    color="blue"
                    style="padding-left: 0.5em;"/>

          <v-text-field v-if="enablePasswordReinput"
                        v-model="props.password"
                        :type="showsPassword ? 'text' : 'password'"
                        :label="strings['password']"
                        :append-icon="showsPassword ? icons.mdiEye : icons.mdiEyeOff"
                        @click:append="showsPassword = !showsPassword"
                        single-line
                        style="margin-left: 0.5em;"
                        outlined/>
        </v-layout>
        <div v-if="enablePasswordReinput" style="text-align: right">
          <v-btn color="primary"
                 text
                 @click="decryptIfNeedAndViewBlob(props.protection.password)">
            <v-icon >{{ icons.mdiKey }}</v-icon>
            {{ strings['unlock'] }}
          </v-btn>
          <v-btn color="primary"
                 text
                 @click="viewRaw()">
            <v-icon >{{ icons.mdiFeatureSearchOutline }}</v-icon>
            {{ strings['view_raw'] }}
          </v-btn>
        </div>
      </div>

      <!-- Image viewer -->
      <div v-show="imgSrc !== ''" style="text-align: center">
        <img :src="imgSrc"
             style="width: 95%">
      </div>

      <!-- Video viewer -->
      <div v-if="videoSrc !== ''" style="text-align: center">
        <video :src="videoSrc"
               style="width: 95%"
               controls />
      </div>

      <!-- Text viewer -->
      <!-- NOTE: Don't use v-if because the inner uses "ref" and the ref is loaded in mounted()-->
      <div v-show="linkifiedText !== ''" style="text-align: center">
        <div style="text-align: right">
          <v-tooltip v-model="showsCopied" bottom>
            <template v-slot:activator="{}">
              <v-btn ref="text_copy_button" style="background-color: #dcdcdc; margin-bottom: 0.3em;">
                <!-- (from: https://iconify.design/icon-sets/octicon/clippy.html) -->
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1.5em" height="1.5em" style="-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);" preserveAspectRatio="xMidYMid meet" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z" fill="#000000"/></svg>
              </v-btn>
            </template>
            <span>{{ strings['copied'] }}</span>
          </v-tooltip>
        </div>
        <pre v-html="linkifiedText"
             class="text-view"
             ref="text_viewer"/>
      </div>

      <div v-if="isCancelable" style="text-align: right">
        <!-- Cancel button -->
        <v-btn color="warning"
               outlined
               class="ma-2 justify-end"
               @click="cancelDownload()">
          <v-icon >{{ icons.mdiCloseCircle }}</v-icon>
          {{ strings['cancel'] }}
        </v-btn>
      </div>

      <!-- Save button -->
      <v-btn v-if="isDoneDownload && !hasError"
             color="primary"
             block
             @click="save()"
             style="margin-top: 1em;">
        <v-icon >{{ icons.mdiContentSave }}</v-icon>
        {{ strings['save'] }}
      </v-btn>

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

import { Component, Prop, Vue } from 'vue-property-decorator';
import urlJoin from 'url-join';
import linkifyHtml from 'linkifyjs/html';
const FileSaverAsync = () => import('file-saver');
import Clipboard from 'clipboard';
import * as fileType from 'file-type/browser';
import {blobToUint8Array} from 'binconv/dist/src/blobToUint8Array';
import {uint8ArrayToBlob} from 'binconv/dist/src/uint8ArrayToBlob';
import {blobToReadableStream} from 'binconv/dist/src/blobToReadableStream';
import {mdiAlert, mdiCheck, mdiChevronDown, mdiContentSave, mdiCloseCircle, mdiEye, mdiEyeOff, mdiKey, mdiFeatureSearchOutline} from "@mdi/js";

import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import * as utils from '@/utils';
import * as pipingUiUtils from "@/piping-ui-utils";
import AsyncComputed from 'vue-async-computed-decorator';
import {Protection, VerificationStep, VerifiedParcel, verifiedParcelFormat} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";


export type DataViewerProps = {
  viewNo: number,
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
export default class DataViewer extends Vue {
  @Prop() private props!: DataViewerProps;

  // Progress bar setting
  private progressSetting: {loadedBytes: number, totalBytes?: number} = {
    loadedBytes: 0,
    totalBytes: undefined,
  };

  private readableBytesString = utils.readableBytesString;

  private errorMessage: () => string = () => "";
  private xhr: XMLHttpRequest;
  private isDoneDownload: boolean = false;
  private canceled: boolean = false;
  private imgSrc: string = '';
  private videoSrc: string = '';
  private text: string = '';
  private enablePasswordReinput: boolean = false;
  private showsPassword: boolean = false;
  private verificationStep: VerificationStep = {type: 'initial'};

  private rawBlob: Blob = new Blob();
  private blob: Blob = new Blob();

  private showsCopied: boolean = false;
  private isDecrypting: boolean = false;

  private icons = {
    mdiContentSave,
    mdiCloseCircle,
    mdiEye,
    mdiEyeOff,
    mdiKey,
    mdiFeatureSearchOutline,
  };

  // for language support
  private get strings() {
    return strings(globalStore.language);
  }

  private get progressPercentage(): number | null {
    if (this.isDoneDownload) {
      return 100;
    } else if (this.progressSetting.totalBytes === undefined) {
      return null;
    } else if (this.progressSetting.totalBytes === 0) {
      return 100;
    } else {
      return this.progressSetting.loadedBytes / this.progressSetting.totalBytes * 100;
    }
  }

  private get hasError(): boolean {
    return this.errorMessage() !== "";
  }

  private get headerIcon(): string {
    if (this.hasError) {
      return mdiAlert;
    } else if (this.canceled) {
      return mdiCloseCircle;
    } else if (this.isDoneDownload) {
      return mdiCheck;
    } else {
      return mdiChevronDown;
    }
  }

  private get headerIconColor(): string | undefined {
    if (this.hasError) {
      return "error";
    } else if (this.canceled) {
      return "warning";
    } else if (this.isDoneDownload) {
      return "teal";
    } else {
      return undefined
    }
  }

  private get isCancelable(): boolean {
    return this.isReadyToDownload && !this.isDoneDownload && !this.hasError && !this.canceled;
  }

  private get isReadyToDownload(): boolean {
    return this.props.protection.type === 'passwordless' ? this.verificationStep.type === 'verified' && this.verificationStep.verified : true
  }

  private get downloadPath(): string {
    return urlJoin(this.props.serverUrl, this.props.secretPath);
  }

  @AsyncComputed()
  private async linkifiedText(): Promise<string> {
    return utils.sanitizeHtmlAllowingATag(linkifyHtml(this.text, {
      defaultProtocol: 'https'
    }));
  }

  constructor() {
    super();
    this.xhr = new XMLHttpRequest();
  }

  async mounted() {
    // Scroll to this element
    // NOTE: no need to add `await`
    pipingUiUtils.scrollTo(this.$el);

    // Setting for copying to clipboard
    new Clipboard((this.$refs.text_copy_button as Vue).$el, {
      target: () => {
        this.showsCopied = true;
        setTimeout(() => {
          this.showsCopied = false;
        }, 2000);
        return this.$refs.text_viewer as Element
      }
    });

    // Key exchange
    const keyExchangeRes = await pipingUiUtils.keyExchangeAndReceiveVerified(
      this.props.serverUrl,
      this.props.secretPath,
      this.props.protection,
      (step: VerificationStep) => {
        this.verificationStep = step;
      }
    );

    // If error
    if (keyExchangeRes.type === "error") {
      this.errorMessage = () => keyExchangeRes.errorMessage(globalStore.language);
      return;
    }
    const {key} = keyExchangeRes;

    this.xhr.open('GET', this.downloadPath);
    this.xhr.responseType = 'blob';
    this.xhr.onprogress = (ev) => {
      console.log(`Download: ${ev.loaded}`)
    };
    this.xhr.onreadystatechange = (ev) => {
      if (this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        const length: string | null = this.xhr.getResponseHeader('Content-Length');
        if (length !== null) {
          this.progressSetting.totalBytes = parseInt(length, 10);
        }
      }
    };
    this.xhr.onprogress = (ev) => {
      this.progressSetting.loadedBytes = ev.loaded;
    };
    this.xhr.onload = async (ev) => {
      if (this.xhr.status === 200) {
        this.isDoneDownload = true;
        // Get raw response body
        this.rawBlob = this.xhr.response;
        // Decrypt and view blob if possible
        this.decryptIfNeedAndViewBlob(key);
      } else {
        const responseText = await utils.readBlobAsText(this.xhr.response);
        this.errorMessage = () => this.strings['xhr_status_error']({
          status: this.xhr.status,
          response: responseText,
        });
      }
    };
    this.xhr.onerror = () => {
      this.errorMessage = () => this.strings['data_viewer_xhr_onerror'];
    };
    this.xhr.send();
  }

  private async viewBlob() {
    // Reset viewers
    this.imgSrc = '';
    this.videoSrc = '';
    this.text = '';

    const isText: boolean = await (async () => {
      // NOTE: 4100 was used in FileType.minimumBytes in file-type until 13.1.2
      const nBytes = 4100;
      // Get first bytes from blob
      const firstChunk: Uint8Array = await blobToUint8Array(this.blob.slice(0, nBytes));
      return utils.isText(firstChunk);
    })();

    // If body is text
    if (isText) {
      // Set text
      this.text = await utils.readBlobAsText(this.blob);
    } else {
      // Detect type of blob
      const fileTypeResult = await fileType.fromStream(blobToReadableStream(this.blob));
      if (fileTypeResult !== undefined) {
        const blobUrl = URL.createObjectURL(this.blob);
        if (fileTypeResult.mime.startsWith("image/")) {
          this.imgSrc = blobUrl;
        } else if (fileTypeResult.mime.startsWith("video/")) {
          this.videoSrc = blobUrl;
        } else if (fileTypeResult.mime.startsWith("text/")) {
          // Set text
          this.text = await utils.readBlobAsText(this.blob);
        }
      }
    }

  }

  private async decryptIfNeedAndViewBlob(password: string | Uint8Array | undefined) {
    this.blob = await (async () => {
      if (password === undefined) {
        return this.rawBlob;
      } else {
        // Get response body
        const resBody = await blobToUint8Array(this.rawBlob);
        try {
          this.isDecrypting = true;
          // Decrypt the response body
          const plain = await utils.decrypt(resBody, password);
          this.enablePasswordReinput = false;
          this.errorMessage = () => '';
          return uint8ArrayToBlob(plain);
        } catch (err) {
          this.enablePasswordReinput = true;
          this.errorMessage = () => this.strings['password_might_be_wrong'];
          console.log('Decrypt error:', err);
          return new Blob();
        } finally {
          this.isDecrypting = false;
        }
      }
    })();

    // View blob if possible
    this.viewBlob();
  }

  private viewRaw() {
    this.blob = this.rawBlob;
    this.enablePasswordReinput = false;
    this.errorMessage = () => '';
    // View blob if possible
    this.viewBlob();
  }

  private cancelDownload(): void {
    this.xhr.abort();
    this.canceled = true;
  }

  private async save(): Promise<void> {
    const FileSaver = await FileSaverAsync();
    FileSaver.saveAs(this.blob, this.props.secretPath);
  }
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
