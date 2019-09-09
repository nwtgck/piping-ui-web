<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em;">

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

        <div v-show="progressSetting.show" style="margin-top: 1em;">
          <!-- Percentage -->
          {{ progressPercentage && progressPercentage.toFixed(2) }} %
          <!-- Progress bar -->
          <v-progress-linear
                  :value="progressPercentage"
          />
          <!-- loaded of total -->
          {{ readableBytesString(progressSetting.loadedBytes, 1) }} of {{ readableBytesString(progressSetting.totalBytes, 1) }}
        </div>
      </v-card>
    </v-flex>
    <v-snackbar v-model="showsSnackbar"
                color="error">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import urlJoin from 'url-join';
import * as utils from '@/utils';

import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';

// Create component
const FilePond = vueFilePond();

@Component({
  components: {
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

  // Show snackbar
  private showsSnackbar: boolean = false;
  // Message of snackbar
  private snackbarMessage: string = '';

  private readableBytesString = utils.readableBytesString;

  private get progressPercentage(): number | null {
    if (this.progressSetting.totalBytes === undefined) {
      return null;
    } else {
      return this.progressSetting.loadedBytes / this.progressSetting.totalBytes * 100;
    }
  }

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
    const bodyLength: number = typeof body === "string" ? body.length : body.size;
    // Send
    const xhr = new XMLHttpRequest();
    xhr.open('POST', urlJoin(this.serverUrl, this.secretPath), true);
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
      } else {
        console.error(`Upload HTTP error: ${xhr.status}`);
      }
    };
    xhr.upload.onerror = () => {
      // TODO: Handle
      console.error('xhr.upload.onerror');
    };
    xhr.upload.onabort = () => {
      // TODO: Handle
      console.error('xhr.upload.onabort');
    };
    xhr.send(body);
    // Initialize progress bar
    this.progressSetting.show = true;
    this.progressSetting.loadedBytes = 0;
    this.progressSetting.totalBytes = bodyLength;
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
