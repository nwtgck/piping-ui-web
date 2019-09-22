<template>
  <v-expansion-panel active="true">
    <v-expansion-panel-header :disable-icon-rotate="isDoneUpload || hasError">
      <span>{{ strings('upload') }} #{{ props.uploadNo }}</span>
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
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <div style="text-align: center" v-on="on">
            {{ readableBytesString(progressSetting.loadedBytes, 1) }} of {{ readableBytesString(progressSetting.totalBytes, 1) }}
          </div>
        </template>
        <span>{{ progressSetting.loadedBytes }} of {{ progressSetting.totalBytes }}</span>
      </v-tooltip>

      <!-- Progress bar -->
      <v-progress-linear :value="progressPercentage"/>

      <v-simple-table class="text-left">
        <tbody>
        <tr class="text-left">
          <td>{{ strings('upload_url') }}</td>
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
          <v-icon >cancel</v-icon>
          {{ strings('cancel') }}
        </v-btn>
      </div>

      <v-alert type="error"
               outlined
               :value="errorMessage() !== ''">
        {{ errorMessage() }}
      </v-alert>

    </v-expansion-panel-content>
  </v-expansion-panel>

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import urlJoin from 'url-join';
import * as utils from '@/utils';
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import JSZip from "jszip";

export type DataUploaderProps = {
  uploadNo: number,
  data: File[] | string,
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

  // NOTE: Function makes dynamic language-switch support possible
  private errorMessage: () => string = () => "";
  private xhr: XMLHttpRequest;
  private canceled: boolean = false;

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
    return this.errorMessage() !== "";
  }

  private get headerIcon(): string {
    if (this.hasError) {
      return "mdi-alert";
    } else if (this.canceled) {
      return "cancel";
    } else if (this.isDoneUpload) {
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
    const data: File[] | string = this.props.data;

    const {body, bodyLength} = await (async () => {
      // Text
      if (typeof data === "string") {
        return {body: data, bodyLength: data.length};
      // One file
      } else if (data.length === 1) {
        return {body: data[0], bodyLength: data[0].size};
      // Multiple files
      } else {
        const files: File[] = data;
        const zip = JSZip();
        const directory = zip.folder('files');
        for (const file of files) {
          directory.file(file.name, file);
        }
        console.log('compressing...');
        const zipBlob: Blob = await directory.generateAsync({type : "blob"});
        console.log('compressed...');
        return {body: zipBlob, bodyLength: zipBlob.size};
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
        this.errorMessage = () => this.strings('xhr_status_error')({
          status: this.xhr.status,
          response: this.xhr.responseText
        });
      }
    };
    this.xhr.onerror = (ev) => {
      this.errorMessage = () => this.strings('data_uploader_xhr_onerror')({serverUrl: this.props.serverUrl});
    };
    this.xhr.upload.onerror = () => {
      this.errorMessage = () => this.strings('data_uploader_xhr_upload_onerror');
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
