<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em; margin-bottom: 1em;">

        <v-btn-toggle v-model="sendOrGet" mandatory>
          <v-btn text value="send">
            Send
            <v-icon right dark>file_upload</v-icon>
          </v-btn>
          <v-btn text value="get">
            Get
            <v-icon right dark>file_download</v-icon>
          </v-btn>
        </v-btn-toggle>

        <div v-if="sendOrGet === 'send'">
          <v-switch
                  inset
                  v-model="isTextMode"
                  :class="`justify-end`"
                  :label="'Text mode'"/>
          <file-pond v-if="!isTextMode"
                     ref="pond"
                     label-idle="<img src='img/file-icon.svg' style='width: 2em'><br>Drop a file here or <span class='filepond--label-action'>Browse</span>"
                     allow-multiple="false"
                     maxFiles="1"
          />
          <v-textarea v-if="isTextMode"
                      label="Text"
                      v-model="inputText"
                      outlined
          ></v-textarea>
        </div>

        <v-text-field label="Server URL"
                      v-model="serverUrl"
        />
        <v-text-field label="Secret path"
                      v-model="secretPath"
                      placeholder="e.g. mypath374"
        />

        <v-btn v-if="sendOrGet === 'send'"
               color="primary"
               v-on:click="send()"
               block>
          Send
          <v-icon right dark>file_upload</v-icon>
        </v-btn>
        <v-layout v-if="sendOrGet === 'get'">
          <v-flex xs6>
            <v-btn color="light-blue"
                   dark
                   @click="view()"
                   block>
              View
              <v-icon right dark>mdi-file-find</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs6>
            <v-btn color="blue"
                   @click="get()"
                   dark
                   block>
              Download
              <v-icon right dark>file_download</v-icon>
            </v-btn>
          </v-flex>
        </v-layout>

      </v-card>

      <div style="padding: 0.5em;">
        <!-- Data uploaders to Piping Server -->
        <v-expansion-panels v-model="uploadExpandedPanelIds"
                            v-show="sendOrGet === 'send'"
                            multiple>
          <DataUploader v-for="dataUpload in dataUploads"
                        :key="dataUpload.uploadNo"
                        :props="dataUpload"/>
        </v-expansion-panels>

        <!-- Data viewers to Piping Server -->
        <v-expansion-panels v-model="viewExpandedPanelIds"
                            v-show="sendOrGet === 'get'"
                            multiple>
          <DataViewer v-for="dataView in dataViews"
                      :key="dataView.viewNo"
                      :props="dataView"/>
        </v-expansion-panels>
      </div>
    </v-flex>
    <v-snackbar v-model="showsSnackbar"
                color="error"
                top>
      {{ snackbarMessage }}
    </v-snackbar>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import urlJoin from 'url-join';
import DataUploader, { DataUploaderProps } from '@/components/DataUploader.vue';
import DataViewer, {DataViewerProps} from "@/components/DataViewer.vue";

import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';

// Create component
const FilePond = vueFilePond();

@Component({
  components: {
    DataUploader,
    DataViewer,
    FilePond
  },
})
export default class PipingUI extends Vue {
  private sendOrGet: 'send' | 'get' = 'send';
  // TODO: Hard code
  private serverUrl: string = 'https://ppng.ml';
  private secretPath: string = "";
  private isTextMode: boolean = false;
  private inputText: string = '';

  // Progress bar setting
  private progressSetting: {show: boolean, loadedBytes: number, totalBytes?: number} = {
    show: false,
    loadedBytes: 0,
    totalBytes: undefined,
  };

  private uploadCount = 0;
  private viewCount = 0;
  private dataUploads: DataUploaderProps[] = [];
  private dataViews: DataViewerProps[] = [];

  // Show snackbar
  private showsSnackbar: boolean = false;
  // Message of snackbar
  private snackbarMessage: string = '';
  // Indexes of expanded expansion-panel for upload
  private uploadExpandedPanelIds: number[] = [];
  // Indexes of expanded expansion-panel for view
  private viewExpandedPanelIds: number[] = [];

  private send() {
    // Get file in FilePond
    let pondFile: {file: File} | null = null;
    if (!this.isTextMode) {
      // Get file
      pondFile = (this.$refs.pond as any).getFile();
      if (pondFile === null) {
        // Show error message
        this.showSnackbar('Error: File not selected');
        return;
      }
    }
    // If secret path is empty
    if (this.secretPath === '') {
      // Show error message
      this.showSnackbar('Error: Secret path not specified');
      return;
    }

    const body: File | string = this.isTextMode ? this.inputText : pondFile!.file;

    // Increment upload counter
    this.uploadCount++;
    // Delegate data uploading
    this.dataUploads.unshift({
      uploadNo: this.uploadCount,
      data: body,
      serverUrl: this.serverUrl,
      secretPath: this.secretPath,
    });
    // Open by default
    this.uploadExpandedPanelIds.push(this.uploadCount-1);
  }

  // NOTE: Some file types are displayed inline
  private get() {
    // If secret path is empty
    if (this.secretPath === '') {
      // Show error message
      this.showSnackbar('Error: Secret path not specified');
      return;
    }

    const aTag = document.createElement('a');
    aTag.href = urlJoin(this.serverUrl, this.secretPath);
    aTag.target = "_blank";
    aTag.download = this.secretPath;
    aTag.click();
  }

  private view() {
    // If secret path is empty
    if (this.secretPath === '') {
      // Show error message
      this.showSnackbar('Error: Secret path not specified');
      return;
    }

    this.viewCount++;
    this.dataViews.unshift({
      viewNo: this.viewCount,
      serverUrl: this.serverUrl,
      secretPath: this.secretPath
    });
    // Open by default
    this.viewExpandedPanelIds.push(this.viewCount-1);
  }

  // Show error message
  private showSnackbar(message: string): void {
    this.showsSnackbar = true;
    this.snackbarMessage = message;
  }
}
</script>
