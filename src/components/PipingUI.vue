<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em; margin-bottom: 2em;">

        <v-btn-toggle v-model="sendOrGet" mandatory style="margin-bottom: 2em;">
          <v-btn text value="send">
            Send
            <v-icon right dark>file_upload</v-icon>
          </v-btn>
          <v-btn text value="get">
            Get
            <v-icon right dark>file_download</v-icon>
          </v-btn>
        </v-btn-toggle>

        <v-switch v-if="sendOrGet === 'send'"
                  inset
                  v-model="isTextMode"
                  :class="`justify-end`"
                  :label="'Text mode'"/>
        <file-pond v-if="sendOrGet === 'send' && !isTextMode"
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
        <v-btn v-if="sendOrGet === 'get'"
               color="secondary"
               v-on:click="get()"
               block>
          Get
          <v-icon right dark>file_download</v-icon>
        </v-btn>
      </v-card>

      <!-- Data uploader to Piping Server -->
      <div v-for="dataUpload in dataUploads" :key="dataUpload.uploadNo">
        <DataUploader :props="dataUpload" />
      </div>

    </v-flex>
    <v-snackbar v-model="showsSnackbar"
                color="error">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import DataUploader, { DataUploaderProps } from '@/components/DataUploader.vue';

import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';

// Create component
const FilePond = vueFilePond();

@Component({
  components: {
    DataUploader,
    FilePond,
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
  private dataUploads: DataUploaderProps[] = [];

  // Show snackbar
  private showsSnackbar: boolean = false;
  // Message of snackbar
  private snackbarMessage: string = '';

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
  }

  // TODO: impl
  private get() {
    console.log('todo impl');
  }

  // Show error message
  private showSnackbar(message: string): void {
    this.showsSnackbar = true;
    this.snackbarMessage = message;
  }
}
</script>
