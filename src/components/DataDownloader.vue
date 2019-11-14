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

import { Component, Prop, Vue } from 'vue-property-decorator';
import urlJoin from 'url-join';
import {mdiAlert, mdiChevronDown} from "@mdi/js";
import {uint8ArrayToString} from 'binconv/dist/src/uint8ArrayToString';
import {validatingParse} from "ts-json-validator";

import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import * as utils from "@/utils";
import * as pipingUiUtils from "@/piping-ui-utils";
import {Protection, VerificationStep, VerifiedParcel, verifiedParcelFormat} from "@/datatypes";
import VerificationCode from "@/components/VerificationCode.vue";


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
    return strings(globalStore.language);
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
    const password: string | Uint8Array | undefined = await (async () => {
      switch (this.props.protection.type) {
        case 'raw':
          return undefined;
        case 'password':
          return this.props.protection.password;
        case 'passwordless': {
          // Key exchange
          const keyExchangeRes = await pipingUiUtils.keyExchange(this.props.serverUrl, 'receiver', this.props.secretPath);
          if (keyExchangeRes.type === 'error') {
            this.verificationStep = {type: 'error'};
            this.errorMessage = () => this.strings['key_exchange_error'](keyExchangeRes.errorCode);
            return;
          }
          const {key, verificationCode} = keyExchangeRes;
          this.verificationStep = {type: 'verification_code_arrived', verificationCode, key};
          const path = urlJoin(this.props.serverUrl, await pipingUiUtils.verifiedPath(this.props.secretPath));
          // Get verified or not
          const res = await fetch(path);
          // Decrypt body
          const decryptedBody: Uint8Array = await utils.decrypt(new Uint8Array(await res.arrayBuffer()), key);
          // Parse
          const verifiedParcel: VerifiedParcel | undefined = validatingParse(verifiedParcelFormat, uint8ArrayToString(decryptedBody));
          if (verifiedParcel === undefined) {
            // TODO: Do something, not to throw error
            throw new Error('Invalid parcel format');
          }
          const {verified} = verifiedParcel;
          this.verificationStep = {type: 'verified', verified};
          if (!verified) {
            // TODO: Do something, not to throw error
            throw new Error('Not verified from the sender');
          }
          return key;
        }
      }
    })();

    // Decrypting & Download
    await pipingUiUtils.decryptingDownload({
      downloadUrl: this.downloadPath,
      fileName: this.props.secretPath,
      key: password,
      decryptErrorMessage: this.strings['password_might_be_wrong'],
    });
  }
}
</script>
