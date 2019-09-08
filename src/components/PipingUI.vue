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

        <v-progress-linear
            v-show="progressSetting.show"
            :value="progressSetting.percentage"
            style="margin-top: 1em;"
        />
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
import * as utils from "@/utils";

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
  private progressSetting = {
    show: false,
    percentage: 0
  };

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

    // Data to be sent
    const data: File | string = this.isTextMode ? this.inputText : pondFile!.file;
    const url = urlJoin(this.serverUrl, this.secretPath);
    // Send to Piping Server
    utils.sendByInlineMultipart(url, data, {
      onProgress: (progress) => {
        this.progressSetting.percentage = progress;
      },
      onError: () => {

      }
    });

    // Initialize progress bar
    this.progressSetting.show = true;
    this.progressSetting.percentage = 0;
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
