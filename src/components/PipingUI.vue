<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em; margin-bottom: 1em;">

        <div style="text-align: center">
          <v-btn-toggle v-model="sendOrGet" mandatory>
            <v-btn text value="send">
              {{ strings['send'] }}
              <v-icon right dark>{{ icons.mdiUpload }}</v-icon>
            </v-btn>
            <v-btn text value="get">
              {{ strings['get'] }}
              <v-icon right dark>{{ icons.mdiDownload }}</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>

        <div v-show="sendOrGet === 'send'">
          <v-switch
                  inset
                  v-model="isTextMode"
                  :class="`justify-end`"
                  :label="strings['text_mode']"/>
          <file-pond v-if="!isTextMode"
                     v-model="files"
                     :label-idle="filePondLabelIdle"
                     :allow-multiple="true"
          />
          <v-textarea v-if="isTextMode"
                      :label="strings['text_placeholder']"
                      v-model="inputText"
                      clearable
                      :clear-icon="icons.mdiCloseCircle"
                      outlined
          ></v-textarea>
        </div>

        <v-combobox :label="strings['server_url']"
                    v-model="serverUrl"
                    :items="serverUrlHistory"
                    @change="onUpdateServerUrl()"
                    @blur="attachProtocolToUrl()"
                    ref="server_url_ref"
                    clearable
        >
          <template v-slot:item="{ index, item }">
            {{ item }}
            <div class="flex-grow-1"></div>
            <v-list-item-action @click.stop>
              <v-btn icon
                     @click.stop.prevent="deleteServerUrl(item)"
              >
                <v-icon>{{ icons.mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-combobox>
        <v-combobox :label="strings['secret_path']"
                    v-model="secretPath"
                    :items="secretPathHistory"
                    :placeholder="strings['secret_path_placeholder']"
                    ref="secret_path_ref"
                    clearable
        >
          <template v-slot:item="{ index, item }">
            {{ item }}
            <div class="flex-grow-1"></div>
            <v-list-item-action>
              <v-btn icon
                     @click.stop.prevent="deleteSecretPath(item)"
              >
                <v-icon>{{ icons.mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-combobox>

        <!-- Secret path suggestion  -->
        <div v-if="sendOrGet === 'send' && suggestedSecretPaths.length !== 0" style="text-align: right; margin-bottom: 1.5em;">
          <v-chip v-for="suggestedSecretPath in suggestedSecretPaths"
                  :key="suggestedSecretPath"
                  @click="secretPath = suggestedSecretPath"
                  class="ma-1"
                  label
                  outlined
                  style="font-size: 1em;"
          >
            {{ suggestedSecretPath }}
          </v-chip>
        </div>

        <v-layout>
          <v-switch v-model="enablePasswordProtection"
                    inset
                    :label="strings['protect_with_password']"
                    color="blue"
                    style="padding-left: 0.5em;"/>

          <v-text-field :style="{visibility: enablePasswordProtection ? 'visible' : 'hidden'}"
                        v-model="password"
                        :type="showsPassword ? 'text' : 'password'"
                        :label="strings['password']"
                        :append-icon="showsPassword ? 'visibility' : 'visibility_off'"
                        @click:append="showsPassword = !showsPassword"
                        single-line
                        outlined
                        style="margin-left: 0.5em;" />
        </v-layout>

        <v-btn v-if="sendOrGet === 'send'"
               color="primary"
               v-on:click="send()"
               block>
          {{ strings['send'] }}
          <v-icon right dark>{{ icons.mdiUpload }}</v-icon>
        </v-btn>
        <v-layout v-if="sendOrGet === 'get'">
          <v-flex xs6>
            <v-btn color="light-blue"
                   dark
                   @click="view()"
                   block>
              {{ strings['view'] }}
              <v-icon right dark>{{ icons.mdiFileFind }}</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs6>
            <v-btn color="blue"
                   @click="get()"
                   dark
                   block>
              {{ strings['download'] }}
              <v-icon right dark>{{ icons.mdiDownload }}</v-icon>
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
      <v-btn text
             @click="showsSnackbar = false">
        <v-icon>{{ icons.mdiClose }}</v-icon>
      </v-btn>
    </v-snackbar>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
const urlJoinAsync = () => import('url-join').then(p => p.default);
import {DataUploaderProps} from '@/components/DataUploader.vue';
const DataUploader = () => import('@/components/DataUploader.vue');
import {DataViewerProps} from "@/components/DataViewer.vue";
const DataViewer = () => import("@/components/DataViewer.vue");
import {str, arr, validatingParse, Json, TsType} from 'ts-json-validator';
import * as FileSaver from 'file-saver';
import {blobToUint8Array} from 'binconv/dist/src/blobToUint8Array';
import {uint8ArrayToBlob} from 'binconv/dist/src/uint8ArrayToBlob';
import * as openpgp from 'openpgp';
import {mdiUpload, mdiDownload, mdiDelete, mdiFileFind, mdiCloseCircle, mdiClose} from "@mdi/js";

import {keys} from "../local-storage-keys";
const swDownloadAsync = () => import("@/sw-download");
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import {File as FilePondFile} from "filepond";
import {baseAndExt} from "@/utils";

(async () => require('filepond/dist/filepond.min.css'))();

// Create component
const FilePond = () => import('vue-filepond').then(vueFilePond => vueFilePond.default());

const defaultServerUrls: ReadonlyArray<string> = [
  "https://ppng.ml",
  "https://piping.arukascloud.io",
  "https://ppng.herokuapp.com"
];

function normalizeUrl(url: string): string {
  return new URL(url).href;
}

// Load from local storage with validation
function loadLocalStorage<J extends Json>(format: J, key: string): TsType<J> | undefined {
  const item: string | null = window.localStorage.getItem(key);
  if (item !== null) {
    return validatingParse(format, item);
  }
}

const chars = {
  nonConfusing: ["a", "b", "c", "d", "e", "f", "h", "i", "j", "k", "m", "n", "p", "r", "s", "t", "u", "v", "w", "x", "y", "z", "2", "3", "4", "5", "6", "7", "8"],
  alphanum: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
};

function randomStr(len: number, chars: ReadonlyArray<string>){
  // NOTE: Confusing characters are erased
  const randomArr = window.crypto.getRandomValues(new Uint32Array(len));
  return Array.from(randomArr).map(n => chars[n % chars.length]).join('');
}

@Component({
  components: {
    DataUploader,
    DataViewer,
    FilePond,
  },
})
export default class PipingUI extends Vue {
  private sendOrGet: 'send' | 'get' = 'send';

  private serverUrl: string = defaultServerUrls[0];
  private secretPath: string = "";
  private isTextMode: boolean = false;
  private inputText: string = '';
  private files: FilePondFile[] = [];
  private serverUrlHistory: string[] = [];
  private secretPathHistory: string[] = [];
  private enablePasswordProtection: boolean = false;
  private password: string = '';
  private showsPassword: boolean = false;

  // Random strings for suggested secret paths
  private randomStrs: [string] = [
    // mini
    '',
  ];

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

  private icons = {
    mdiUpload,
    mdiDownload,
    mdiDelete,
    mdiFileFind,
    mdiCloseCircle,
    mdiClose,
  };

  // for language support
  private get strings() {
    return strings(globalStore.language);
  }

  // FIXME: Should be removed
  // This for lazy v-model of Combobox
  private shouldBeRemoved = {
    latestServerUrl: this.serverUrl,
    latestSecretPath: this.secretPath,
  };


  // FIXME: Should be removed
  // NOTE: This is for update by clicking listed auto-complete
  @Watch('serverUrl')
  private onServerUrl() {
    this.shouldBeRemoved.latestServerUrl = this.serverUrl;
  }

  @Watch('secretPath')
  private onSecretPath() {
    // NOTE: <v-combobox> "clearable" makes it null or undefined (maybe)
    if ( this.secretPath === null || this.secretPath === undefined) {
      this.secretPath = '';
    }

    // FIXME: Should be removed
    // NOTE: This is for update by clicking listed auto-complete
    this.shouldBeRemoved.latestSecretPath = this.secretPath;
  }

  private onUpdateServerUrl() {
    window.localStorage.setItem(keys.selectedServerUrl, this.serverUrl);
  }

  private get filePondLabelIdle(): string {
    // If files are nothing
    if (this.files.length === 0) {
      // Hint with file icon
      return `<img src='img/file-icon.svg' style='width: 2em'><br>${this.strings['drop_a_file_here_or_browse']}`;
    } else {
      return this.strings['drop_a_file_here_or_browse'];
    }
  }

  private updateRandomStrs() {
    this.randomStrs[0] = randomStr(3, chars.nonConfusing);
  }

  private get suggestedSecretPaths(): string[] {
    const candidates: string[] = (() => {
      if ((!this.isTextMode && this.files.length === 0) || (this.isTextMode && this.inputText === '')) {
        // NOTE: This is for simplicity of UI
        //       Not show suggested secret path on initial status
        return [];
      } else if (this.isTextMode) {
        return [...this.randomStrs.map(s => `${s}.txt`), ...this.randomStrs];
      } else if (this.files.length === 1) {
        const fileName = this.files[0].filename;
        const {ext} = baseAndExt(fileName);
        return [
          fileName,
          ...this.randomStrs.map(s => `${s}${ext}`)
        ];
      } else if(this.files.length > 1) {
        if(this.secretPath.endsWith('.zip')) {
          return [];
        } else {
          return [
            ...(this.secretPath === '' ? [] : [`${this.secretPath}.zip`]),
            ...this.randomStrs.map(s => `${s}.zip`)
          ];
        }
      } else {
        return this.randomStrs;
      }
    })();

    return candidates.filter(c => this.secretPath !== c);
  }

  private mounted() {
    // Update random strings
    this.updateRandomStrs();

    // Load from Local Storage
    const serverUrl = window.localStorage.getItem(keys.selectedServerUrl);
    if (serverUrl !== null) {
      this.serverUrl = serverUrl;
    }

    // FIXME: Combobox is lazy to update v-model
    // This is for updating server URL in real-time
    (this.$refs.server_url_ref as Vue).$el.querySelector('input')!.addEventListener('keyup', (ev)=>{
      // NOTE: [Send] button is hidden by auto-complete list if assigning to this.serverUrl
      this.shouldBeRemoved.latestServerUrl = (ev.target as any).value;
    });
    // FIXME: Combobox is lazy to update v-model
    // This is for updating secret path in real-time
    (this.$refs.secret_path_ref as Vue).$el.querySelector('input')!.addEventListener('keyup', (ev)=>{
      // NOTE: [Send] button is hidden by auto-complete list if assigning to this.secretPath
      this.shouldBeRemoved.latestSecretPath = (ev.target as any).value;
    });

    // Load server URL history from local storage
    const serverUrlHistory: string[] | undefined = loadLocalStorage(arr(str), keys.serverUrlHistory);
    // If none
    if (serverUrlHistory === undefined) {
      // Set default
      this.serverUrlHistory = defaultServerUrls.slice();
    } else {
      // Load from storage
      this.serverUrlHistory = serverUrlHistory;
    }

    // Load server URL history from local storage
    const secretPathHistory: string[] | undefined = loadLocalStorage(arr(str), keys.secretPathHistory);
    if (secretPathHistory !== undefined) {
      this.secretPathHistory = secretPathHistory;
    }
  }

  // FIXME: Should be removed
  private applyLatestServerUrlAndSecretPath() {
    // FIXME: should be removed after fix
    // NOTE: This set the latest secret path because v-model of Combobox is lazy
    this.serverUrl = this.shouldBeRemoved.latestServerUrl;
    // FIXME: should be removed after fix
    // NOTE: This set the latest secret path because v-model of Combobox is lazy
    this.secretPath = this.shouldBeRemoved.latestSecretPath;
  }

  private send() {
    this.applyLatestServerUrlAndSecretPath();

    if (!this.isTextMode && this.files.length === 0) {
      // Show error message
      this.showSnackbar(this.strings['error_file_not_selected']);
      return;
    }
    // If secret path is empty
    if (this.secretPath === '') {
      // Show error message
      this.showSnackbar(this.strings['error_secret_path_not_specified']);
      return;
    }

    // If enabling password protection and password is empty
    if (this.enablePasswordProtection && this.password === '') {
      // Show error message
      this.showSnackbar(this.strings['password_is_required']);
      return;
    }

    const body: File[] | string = this.isTextMode ? this.inputText : this.files.map(f => f.file);

    // Increment upload counter
    this.uploadCount++;
    // Delegate data uploading
    this.dataUploads.unshift({
      uploadNo: this.uploadCount,
      data: body,
      serverUrl: this.serverUrl,
      secretPath: this.secretPath,
      password: this.password,
    });
    // Open by default
    this.uploadExpandedPanelIds.push(this.uploadCount-1);

    // If history is enable and user-input server URL is new
    if (globalStore.recordsServerUrlHistory && !this.serverUrlHistory.map(normalizeUrl).includes(normalizeUrl(this.serverUrl))) {
      // Enroll server URLs
      this.serverUrlHistory.push(this.serverUrl);
      // Save to local storage
      window.localStorage.setItem(keys.serverUrlHistory, JSON.stringify(this.serverUrlHistory));
    }

    // If history is enable and user-input secret path is new
    if (globalStore.recordsSecretPathHistory && !this.secretPathHistory.includes(this.secretPath)) {
      // Enrol secret path
      this.secretPathHistory.push(this.secretPath);
      // Save to local storage
      window.localStorage.setItem(keys.secretPathHistory, JSON.stringify(this.secretPathHistory));
    }
  }

  // NOTE: Some file types are displayed inline
  private async get() {
    this.applyLatestServerUrlAndSecretPath();

    // If secret path is empty
    if (this.secretPath === '') {
      // Show error message
      this.showSnackbar(this.strings['error_secret_path_not_specified']);
      return;
    }

    const urlJoin = await urlJoinAsync();
    // If enabling password protection and password is empty
    if (this.enablePasswordProtection && this.password === '') {
      // Show error message
      this.showSnackbar(this.strings['password_is_required']);
      return;
    }
    const downloadUrl = urlJoin(this.serverUrl, encodeURI(this.secretPath));

    const swDownload = await swDownloadAsync();
    // If supporting stream-download via Service Worker
    if (await swDownload.supportsSwDownload) {
      // Download via Service Worker
      const aTag = document.createElement('a');
      // NOTE: '/sw-download' can be received by Service Worker in src/sw.js
      aTag.href = `/sw-download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(this.secretPath)}&password=${encodeURIComponent(this.password)}`;
      aTag.target = "_blank";
      aTag.click();
    } else {
      // If password-protection is disabled
      if (this.password === '') {
        // Download or show on browser sometimes
        const aTag = document.createElement('a');
        aTag.href = downloadUrl;
        aTag.target = "_blank";
        aTag.download = this.secretPath;
        aTag.click();
      } else {
        // Get response
        const res = await fetch(downloadUrl);
        const resBody = await blobToUint8Array(await res.blob());
        // Decrypt the response body
        const plain = (await openpgp.decrypt({
          message: await openpgp.message.read(resBody),
          passwords: [this.password],
          format: 'binary'
        })).data as Uint8Array;
        // Save
        FileSaver.saveAs(uint8ArrayToBlob(plain), this.secretPath);
      }
    }
  }

  private view() {
    this.applyLatestServerUrlAndSecretPath();

    // If secret path is empty
    if (this.secretPath === '') {
      // Show error message
      this.showSnackbar(this.strings['error_secret_path_not_specified']);
      return;
    }

    // If enabling password protection and password is empty
    if (this.enablePasswordProtection && this.password === '') {
      // Show error message
      this.showSnackbar(this.strings['password_is_required']);
      return;
    }

    this.viewCount++;
    this.dataViews.unshift({
      viewNo: this.viewCount,
      serverUrl: this.serverUrl,
      secretPath: this.secretPath,
      password: this.password,
    });
    // Open by default
    this.viewExpandedPanelIds.push(this.viewCount-1);
  }

  // Show error message
  private showSnackbar(message: string): void {
    this.showsSnackbar = true;
    this.snackbarMessage = message;
  }

  private attachProtocolToUrl(): void {
    // FIXME: Don't use setTimeout()
    // @blur is called before the value changed.
    setTimeout(() => {
      if (this.serverUrl.match(/^https?:\/\//) === null) {
        this.serverUrl = `https://${this.serverUrl}`;
      }
    }, 100);

  }

  private deleteServerUrl(url: string): void {
    // Remove path
    this.serverUrlHistory = this.serverUrlHistory.filter(u => u !== url);
    // Save to local storage
    window.localStorage.setItem(keys.serverUrlHistory, JSON.stringify(this.serverUrlHistory));
  }

  private deleteSecretPath(path: string): void {
    // Remove path
    this.secretPathHistory = this.secretPathHistory.filter(p => p !== path);
    // Save to local storage
    window.localStorage.setItem(keys.secretPathHistory, JSON.stringify(this.secretPathHistory));
  }
}

</script>
