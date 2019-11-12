<template>
  <v-expansion-panel active="true">
    <v-expansion-panel-header :disable-icon-rotate="isDoneUpload || hasError">
      <span>{{ strings['upload'] }} #{{ props.uploadNo }}</span>
      <!-- Percentage -->
      {{ progressPercentage && progressPercentage.toFixed(2) }} %
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon }}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>

      <span v-if="props.protection.type === 'passwordless' && verificationStep.type === 'verification_code_arrived'">
        <v-alert type="info">
          <span style="font-size: 1.2em">{{ strings['verification_code'] }}: <b>{{ verificationStep.verificationCode }}</b></span>
        </v-alert>

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

      <div v-show="isEncrypting">
        <div style="text-align: center">
          {{ strings['encrypting'] }}
        </div>
        <!-- Encryption progress bar -->
        <v-progress-linear indeterminate />
      </div>

      <div v-show="!isCompressing && !isEncrypting">
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
import {Component, Prop, Vue} from 'vue-property-decorator';
import urlJoin from 'url-join';
import {blobToUint8Array} from 'binconv/dist/src/blobToUint8Array';
import {stringToUint8Array} from 'binconv/dist/src/stringToUint8Array';

import * as utils from '@/utils';
import * as pipingUiUtils from "@/piping-ui-utils";
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import {mdiAlert, mdiCancel, mdiCheck, mdiChevronDown, mdiCloseCircle} from "@mdi/js";
import {AsyncComputed} from "@/AsyncComputed";
import {Protection, VerificationStep, VerifiedParcel} from "@/datatypes";


export type DataUploaderProps = {
  uploadNo: number,
  data: File[] | string,
  serverUrl: string,
  secretPath: string,
  protection: Protection,
};

// NOTE: Automatically upload when mounted
@Component
export default class DataUploader extends Vue {
  @Prop() private props!: DataUploaderProps;

  // Progress bar setting
  private progressSetting: {loadedBytes: number, totalBytes?: number} = {
    loadedBytes: 0,
    totalBytes: undefined,
  };

  private readableBytesString = utils.readableBytesString;

  // NOTE: Function makes dynamic language-switch support possible
  //       Delegation is to reassign this value
  private errorMessageDelegate: () => string | Promise<string> =
    () => "";
  @AsyncComputed()
  async errorMessage(): Promise<string> {
    return this.errorMessageDelegate();
  }
  private xhr: XMLHttpRequest;
  private canceled: boolean = false;
  private isCompressing: boolean = false;
  private isEncrypting: boolean = false;
  private verificationStep: VerificationStep = {type: 'initial'};

  private icons = {
    mdiCloseCircle,
    mdiCheck,
    mdiCancel,
  };

  private get progressPercentage(): number | null {
    if (this.progressSetting.totalBytes === undefined) {
      return null;
    } else if (this.progressSetting.totalBytes === 0) {
      return 100;
    } else {
      return this.progressSetting.loadedBytes / this.progressSetting.totalBytes * 100;
    }
  }

  private get isDoneUpload(): boolean {
    return this.progressPercentage === 100;
  }

  private get uploadPath(): string {
    return urlJoin(this.props.serverUrl, this.props.secretPath);
  }

  @AsyncComputed()
  private async hasError(): Promise<boolean> {
    return await this.errorMessageDelegate() !== "";
  }

  private get headerIcon(): string {
    // NOTE: getter `hasError` is created by @AsyncComputed
    const self = (this as unknown as {hasError: boolean});
    if (self.hasError) {
      return mdiAlert;
    } else if (this.canceled) {
      return mdiCloseCircle;
    } else if (this.isDoneUpload) {
      return mdiCheck;
    } else {
      return mdiChevronDown;
    }
  }

  private get headerIconColor(): string | undefined {
    // NOTE: Getter `hasError` is created by @AsyncComputed
    const self = (this as unknown as {hasError: boolean});
    if (self.hasError) {
      return "error";
    } else if (this.canceled) {
      return "warning";
    } else if (this.isDoneUpload) {
      return "teal";
    } else {
      return undefined
    }
  }

  private get isCancelable(): boolean {
    return !this.isDoneUpload && !this.hasError && !this.canceled;
  }

  // for language support
  private get strings() {
    return strings(globalStore.language);
  }

  constructor() {
    super();
    this.xhr = new XMLHttpRequest();
  }

  async mounted() {
    switch (this.props.protection.type) {
      case 'raw':
        // Send
        await this.send(undefined);
        break;
      case 'password':
        // Send
        await this.send(this.props.protection.password);
        break;
      case 'passwordless': {
        // Key exchange
        const keyExchangeRes = await pipingUiUtils.keyExchange(this.props.serverUrl, 'sender', this.props.secretPath);
        if (keyExchangeRes.type === 'error') {
          const errorMessage = keyExchangeRes.errorMessage;
          // TODO: Do something, not to throw error
          throw new Error(errorMessage);
        }
        const {key, verificationCode} = keyExchangeRes;
        this.verificationStep = {type: 'verification_code_arrived', verificationCode, key};
        break;
      }
    }
  }

  private async verify(verified: boolean) {
    if (this.verificationStep.type !== 'verification_code_arrived') {
      throw new Error("Unexpected state: this.verificationStep.type should be 'verification_code_arrived'");
    }
    const {key} = this.verificationStep;
    this.verificationStep = {type: 'verified', verified};


    const verifiedParcel: VerifiedParcel = {
      verified,
    };
    const encryptedVerifiedParcel = await utils.encrypt(
      stringToUint8Array(JSON.stringify(verifiedParcel)),
      key,
    );
    const path = urlJoin(this.props.serverUrl, await pipingUiUtils.verifiedPath(this.props.secretPath));
    // Send verified or not
    await fetch(path, {
      method: 'POST',
      body: encryptedVerifiedParcel,
    });

    // If verified, send
    if (verified) {
      await this.send(key);
    }
  }

  private async send(password: string | Uint8Array | undefined) {
    const data: File[] | string = this.props.data;

    const plainBody: Blob = await (async () => {
      // Text
      if (typeof data === "string") {
        return new Blob([data]);
        // One file
      } else if (data.length === 1) {
        return data[0];
        // Multiple files
      } else {
        const files: File[] = data;
        this.isCompressing = true;
        // Zip files
        const zipBlob: Blob = await utils.zipFilesAsBlob(files);
        this.isCompressing = false;
        return zipBlob;
      }
    })();

    const {body, bodyLength} = await (async () => {
      // If password protection is disabled
      if (password === undefined) {
        // Return as plain
        return {body: plainBody, bodyLength: plainBody.size};
      } else {
        this.isEncrypting = true;
        // Convert plain body blob to Uint8Array
        const plainBodyArray: Uint8Array = await blobToUint8Array(plainBody);
        // Get encrypted
        // NOTE: In the future, ReadableStream can be uploaded.
        // (see: https://github.com/whatwg/fetch/pull/425#issuecomment-518899855)
        const encrypted: Uint8Array = await utils.encrypt(plainBodyArray, password);
        this.isEncrypting = false;
        return {body: encrypted, bodyLength: encrypted.byteLength};
      }
    })();

    // Send
    this.xhr.open('POST', this.uploadPath, true);
    this.xhr.responseType = 'text';
    // Update progress bar
    this.xhr.upload.onprogress = (ev) => {
      this.progressSetting.loadedBytes = ev.loaded;
      this.progressSetting.totalBytes  = ev.total;
    };
    this.xhr.upload.onload = () => {
      // Send finished
      if (this.xhr.status === 200) {
        if (this.progressSetting.totalBytes !== undefined) {
          this.progressSetting.loadedBytes = this.progressSetting.totalBytes;
        }
      }
    };
    this.xhr.onload = () => {
      if (this.xhr.status !== 200) {
        this.errorMessageDelegate = () => this.strings['xhr_status_error']({
          status: this.xhr.status,
          response: this.xhr.responseText
        });
      }
    };
    this.xhr.onerror = (ev) => {
      this.errorMessageDelegate = () => this.strings['data_uploader_xhr_onerror']({serverUrl: this.props.serverUrl});
    };
    this.xhr.upload.onerror = () => {
      this.errorMessageDelegate = () => this.strings['data_uploader_xhr_upload_onerror'];
    };
    this.xhr.send(body);
    // Initialize progress bar
    this.progressSetting.loadedBytes = 0;
    this.progressSetting.totalBytes = bodyLength;
  }

  private cancelUpload(): void {
    this.xhr.abort();
    this.canceled = true;
  }
}
</script>

<style scoped>

</style>
