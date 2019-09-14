<template>
  <v-expansion-panel active="true">
    <v-expansion-panel-header :disable-icon-rotate="isDoneUpload || hasError">
      <span>Upload #{{ props.uploadNo }}</span>
      <!-- Percentage -->
      {{ progressPercentage && progressPercentage.toFixed(2) }} %
      <template v-slot:actions>
        <v-icon :color="headerIconColor" style="margin-left: 0.3em">
          {{ headerIcon}}
        </v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <!-- loaded of total -->
      {{ readableBytesString(progressSetting.loadedBytes, 1) }} of {{ readableBytesString(progressSetting.totalBytes, 1) }}

      <!-- Progress bar -->
      <v-progress-linear :value="progressPercentage"/>

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>Upload URL</td>
          <td>{{ uploadPath }}</td>
        </tr>
        </tbody>
      </v-simple-table>

      <div v-if="isCancelable" style="text-align: right">
        <!-- Cancel button -->
        <v-btn color="warning"
               outlined
               class="ma-2 justify-end">
          <v-icon >cancel</v-icon>
          Cancel
        </v-btn>
      </div>

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

export type DataUploaderProps = {
  uploadNo: number,
  data: File | string,
  serverUrl: string,
  secretPath: string
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

  private errorMessage: string = "";

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

  private get hasError(): boolean {
    return this.errorMessage !== "";
  }

  private get headerIcon(): string {
    if (this.hasError) {
      return "mdi-alert";
    } else if (this.isDoneUpload) {
      return "mdi-check";
    } else {
      return "keyboard_arrow_down";
    }
  }

  private get headerIconColor(): string | undefined {
    if (this.hasError) {
      return "error";
    } else if (this.isDoneUpload) {
      return "teal";
    } else {
      return undefined
    }
  }

  private get isCancelable(): boolean {
    return !this.isDoneUpload && !this.hasError;
  }

  mounted() {
    const data = this.props.data;

    const bodyLength: number = typeof data === "string" ? data.length : data.size;
    // Send
    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.uploadPath, true);
    // Update progress bar
    xhr.upload.onprogress = (ev) => {
      this.progressSetting.loadedBytes = ev.loaded;
      this.progressSetting.totalBytes  = ev.total;
    };
    xhr.upload.onload = () => {
      // Send finished
      if (xhr.status === 200) {
        if (this.progressSetting.totalBytes !== undefined) {
          this.progressSetting.loadedBytes = this.progressSetting.totalBytes;
        }
      }
    };
    xhr.onload = () => {
      if (xhr.status !== 200) {
        this.errorMessage = `Error (${xhr.status}): "${xhr.responseText}"`;
      }
    };
    xhr.onabort = (ev) => {
      this.errorMessage = "Upload aborted";
    };
    xhr.onerror = (ev) => {
      this.errorMessage = `An error occurred. The server may be < 0.9.4. Please check ${urlJoin(this.props.serverUrl, "/version")}`;
    };
    xhr.upload.onerror = () => {
      this.errorMessage = "An error occurred while uploading.";
    };
    xhr.upload.onabort = () => {
      this.errorMessage = "Upload aborted while uploading.";
    };
    xhr.send(data);
    // Initialize progress bar
    this.progressSetting.loadedBytes = 0;
    this.progressSetting.totalBytes = bodyLength;
  }
}
</script>

<style scoped>

</style>
