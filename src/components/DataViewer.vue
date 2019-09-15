<template>
  <v-expansion-panel>
    <v-expansion-panel-header :disable-icon-rotate="isDoneDownload || hasError">
      <span>View #{{ props.viewNo }}</span>
      <!-- Percentage -->
      {{ progressPercentage ? `${progressPercentage.toFixed(2)} %` : "" }}
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon}}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <!-- loaded of total -->
      {{ readableBytesString(progressSetting.loadedBytes, 1) }}{{ !progressSetting.totalBytes ? "" : ` of ${readableBytesString(progressSetting.totalBytes, 1)}` }}

      <!-- Progress bar -->
      <v-progress-linear :value="progressPercentage"
                         :indeterminate="progressPercentage === null && !canceled && errorMessage === ''" />

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>Download URL</td>
          <td>{{ downloadPath }}</td>
        </tr>
        </tbody>
      </v-simple-table>

      <!-- Image viewer -->
      <img :src="imgSrc"
           style="width: 95%"
           v-if="imgSrc !== ''">

      <div v-if="isCancelable" style="text-align: right">
        <!-- Cancel button -->
        <v-btn color="warning"
               outlined
               class="ma-2 justify-end"
               @click="cancelDownload()">
          <v-icon >cancel</v-icon>
          Cancel
        </v-btn>
      </div>

      <!-- Save button -->
      <v-btn v-if="isDoneDownload"
             color="primary"
             block
             @click="save()">
        <v-icon >save</v-icon>
        Save
      </v-btn>

      <v-alert type="error"
               outlined
               :value="errorMessage !== ''"
               style="text-align: left">
        {{ errorMessage }}
      </v-alert>

    </v-expansion-panel-content>
  </v-expansion-panel>

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import urlJoin from 'url-join';
import * as utils from '@/utils';

export type DataViewerProps = {
  viewNo: number,
  serverUrl: string,
  secretPath: string
};

// NOTE: Automatically download when mounted
@Component
export default class DataViewer extends Vue {
  @Prop() private props!: DataViewerProps;

  // Progress bar setting
  private progressSetting: {loadedBytes: number, totalBytes?: number} = {
    loadedBytes: 0,
    totalBytes: undefined,
  };

  private readableBytesString = utils.readableBytesString;

  private errorMessage: string = "";
  private xhr: XMLHttpRequest;
  private isDoneDownload: boolean = false;
  private canceled: boolean = false;
  private imgSrc: string = '';
  private blobUrl: string = '';

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
    return this.errorMessage !== "";
  }

  private get headerIcon(): string {
    if (this.hasError) {
      return "mdi-alert";
    } else if (this.canceled) {
      return "cancel";
    } else if (this.isDoneDownload) {
      return "mdi-check";
    } else {
      return "keyboard_arrow_down";
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
    return !this.isDoneDownload && !this.hasError && !this.canceled;
  }

  private get downloadPath(): string {
    return urlJoin(this.props.serverUrl, this.props.secretPath);
  }

  constructor() {
    super();
    this.xhr = new XMLHttpRequest();
  }

  mounted() {
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
    this.xhr.onload = (ev) => {
      if (this.xhr.status === 200) {
        this.isDoneDownload = true;
        const blob: Blob = this.xhr.response;
        console.log('blob: ', blob);
        this.blobUrl = URL.createObjectURL(blob);
        // TODO: Everything is not image
        this.imgSrc = this.blobUrl;
      } else {
        this.errorMessage = `Error (${this.xhr.status}): "${this.xhr.responseText}"`;
      }
    };
    this.xhr.onerror = () => {
      this.errorMessage = "Download error";
    };
    this.xhr.send();
  }

  private cancelDownload(): void {
    this.xhr.abort();
    this.canceled = true;
  }

  private save(): void {
    const aTag = document.createElement('a');
    aTag.href = this.blobUrl;
    aTag.download = this.props.secretPath;
    aTag.target = "_blank";
    aTag.click();
  }
}
</script>

<style scoped>

</style>
