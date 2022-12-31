<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em; margin-bottom: 1em;">

        <div style="text-align: center">
          <v-btn-toggle v-model="sendOrGet" mandatory>
            <v-btn text value="send" data-testid="send_menu_button">
              {{ strings?.['send'] }}
              <v-icon right dark>{{ mdiUpload }}</v-icon>
            </v-btn>
            <v-btn text value="get" data-testid="get_menu_button">
              {{ strings?.['get'] }}
              <v-icon right dark>{{ mdiDownload }}</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>

        <div v-show="sendOrGet === 'send'" style="margin-top: 1.2rem;">
          <file-pond-wrapper v-model="inputFiles"
                             :label-idle="filePondLabelIdle"
                             data-testid="file_input"
                             @hook:mounted="onFilePondMounted()"
          />
          <v-textarea :label="strings?.['text_placeholder']"
                      v-model="inputText"
                      clearable
                      :clear-icon="mdiClose"
                      rows="2"
                      auto-grow
                      outlined
          ></v-textarea>
        </div>

        <v-combobox :label="strings?.['server_url']"
                    v-model="serverUrl"
                    :items="serverUrlHistory"
                    @change="onUpdateServerUrl()"
                    @blur="attachProtocolToUrl()"
                    ref="server_url_ref"
                    clearable
                    :clear-icon="mdiClose"
                    style="margin-bottom: 0.8em;"
                    class="readable-font"
                    data-testid="server_url_input">
          <template v-slot:item="{ index, item }">
            <span class="readable-font">{{ item }}</span>
            <div class="flex-grow-1"></div>
            <v-list-item-action @click.stop>
              <v-btn icon
                     @click.stop.prevent="deleteServerUrl(item)"
              >
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-combobox>
        <v-combobox :label="strings?.['secret_path']"
                    v-model="secretPath"
                    :items="secretPathHistory"
                    :placeholder="strings?.['secret_path_placeholder']"
                    ref="secret_path_ref"
                    class="ma-0 pa-0 readable-font"
                    clearable
                    :clear-icon="mdiClose"
                    data-testid="secret_path_input"
        >
          <template v-slot:item="{ index, item }">
            <span class="readable-font">{{ item }}</span>
            <div class="flex-grow-1"></div>
            <v-list-item-action>
              <v-btn icon
                     @click.stop.prevent="deleteSecretPath(item)"
              >
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-combobox>

        <div style="text-align: right; margin-bottom: 1.5em;">
          <template v-if="sendOrGet === 'send' && suggestedSecretPaths.length !== 0" >
            <!-- Secret path suggestion  -->
            <v-chip v-for="suggestedSecretPath in suggestedSecretPaths"
                    :key="suggestedSecretPath"
                    @click="secretPath = suggestedSecretPath"
                    class="ma-0 readable-font"
                    label
                    outlined
                    style="font-size: 1em;"
            >
              {{ suggestedSecretPath }}
            </v-chip>
          </template>
          <v-btn v-if="shouldBeRemoved.latestSecretPath !== halfWidthLatestSecretPath"
                 @click="secretPath = halfWidthLatestSecretPath"
                 color="warning"
                 outlined
                 style="margin-left: 1rem; text-transform: none">
            <v-icon left>{{ mdiAlert }}</v-icon>
            {{ strings?.['make_half_width'](shouldBeRemoved.latestSecretPath) }}
          </v-btn>
        </div>

        <v-col class="pa-0">
          <v-row align="center" class="ma-0" style="padding-top: 0.4em;">
            <v-switch :input-value="protectionType === 'passwordless'"
                      @change="onEnablePasswordlessProtection"
                      inset
                      data-testid="passwordless_switch"
                      style="margin-right: 2.5rem;">
              <template v-slot:label>
                <v-icon class="icon-and-text-margin" :color="protectionType === 'passwordless' ? 'blue' : ''">{{ mdiShieldHalfFull }}</v-icon>
                {{ strings?.['passwordless_protection'] }}
              </template>
            </v-switch>

            <v-switch v-if="sendOrGet === 'send' && protectionType === 'passwordless'"
                      v-model="passwordlessSendAndVerify"
                      inset
                      data-testid="passwordless_send_and_verify_switch">
              <template v-slot:label>
                <v-icon class="icon-and-text-margin" :color="passwordlessSendAndVerify ? 'blue' : ''">{{ mdiShieldCheck }}</v-icon>
                {{ strings?.['passwordless_verify_and_send'] }}
              </template>
            </v-switch>
          </v-row>

          <v-row v-if='showsMoreOptions' align="center" class="ma-0" style="padding-top: 0.5em;">
            <v-switch :input-value="protectionType === 'password'"
                      @change="onEnablePasswordProtection"
                      inset
                      color="blue"
                      class="ma-0 pa-0"
                      data-testid="password_switch">
              <template v-slot:label>
                <v-icon class="icon-and-text-margin" :color="protectionType === 'password' ? 'blue' : ''">{{ mdiKey }}</v-icon>
                {{ protectionType === 'password' ? '' : strings?.['protect_with_password'] }}
              </template>
            </v-switch>

            <v-text-field v-if="protectionType === 'password'"
                          v-model="password"
                          :type="showsPassword ? 'text' : 'password'"
                          :label="strings?.['password']"
                          :append-icon="showsPassword ? mdiEye : mdiEyeOff"
                          @click:append="showsPassword = !showsPassword"
                          single-line
                          class="pa-0"
                          style="margin-left: 0.5em;"
                          data-testid="password_input" />
          </v-row>
        </v-col>

        <v-btn @click="showsMoreOptions = !showsMoreOptions" depressed plain style="margin-bottom: 1rem; text-transform: none" data-testid="more_options_button">
          <v-icon left dark>
            {{ showsMoreOptions ? mdiCollapseAll : mdiExpandAll }}
          </v-icon>
          {{ showsMoreOptions ? strings?.['hide_options'] : strings?.['more_options'] }}
        </v-btn>

        <div>
          <v-btn v-if="sendOrGet === 'send'"
                 color="primary"
                 v-on:click="send()"
                 block
                 data-testid="send_button"
                 style="height: 3.5rem;">
            {{ strings?.['send_button']({ nFiles: inputFiles.length, textIsBlank: inputText === '' }) }}
            <v-icon right dark>{{ mdiUpload }}</v-icon>
          </v-btn>
          <v-layout v-if="sendOrGet === 'get'">
            <v-flex xs6>
              <v-btn color="light-blue"
                     dark
                     @click="view()"
                     block
                     data-testid="view_button"
                     style="height: 3.5rem;">
                {{ strings?.['view'] }}
                <v-icon right dark>{{ mdiFileFind }}</v-icon>
              </v-btn>
            </v-flex>
            <v-flex xs6>
              <!-- NOTE: tag="a" is important. This element will be injected href and download attributes. -->
              <v-btn tag="a"
                     ref="download_button"
                     color="blue"
                     @click="get()"
                     dark
                     block
                     data-testid="download_button"
                     style="height: 3.5rem;">
                {{ strings?.['download'] }}
                <v-icon right dark>{{ mdiDownload }}</v-icon>
              </v-btn>
            </v-flex>
          </v-layout>
        </div>

      </v-card>

      <div style="padding: 0.5em;">
        <v-expansion-panels v-model="expandedPanelIds" multiple>
          <template v-for="(expandedPanel, idx) in expandedPanels">
            <template v-if="expandedPanel.type === 'data_uploader'">
              <DataUploader :composedProps="expandedPanel.props" :key="`upload-${expandedPanel.props.uploadNo}`" :data-testid="`expand_panel_${idx}`" />
            </template>
            <template v-if="expandedPanel.type === 'data_viewer'">
              <DataViewer :composedProps="expandedPanel.props" :key="`view-${expandedPanel.props.viewNo}`" :data-testid="`expand_panel_${idx}`"/>
            </template>
            <template v-if="expandedPanel.type === 'data_downloader'">
              <DataDownloader :composedProps="expandedPanel.props" :key="`download-${expandedPanel.props.downloadNo}`" :data-testid="`expand_panel_${idx}`"/>
            </template>
          </template>
        </v-expansion-panels>
      </div>
    </v-flex>
    <v-snackbar v-model="showsSnackbar"
                color="error"
                top>
      {{ snackbarMessage }}
      <v-btn text
             @click="showsSnackbar = false">
        <v-icon>{{ mdiClose }}</v-icon>
      </v-btn>
    </v-snackbar>
  </v-layout>
</template>

<script setup lang="ts">
import Vue, {ref, watch, computed, onMounted, nextTick} from 'vue';
const urlJoinAsync = () => import('url-join').then(p => p.default);
import {type DataUploaderProps} from '@/components/DataUploader.vue';
const DataUploader = () => import('@/components/DataUploader.vue');
import {type DataViewerProps} from "@/components/DataViewer.vue";
const DataViewer = () => import("@/components/DataViewer.vue");
const DataDownloader = () => import('@/components/DataDownloader.vue');
import {type DataDownloaderProps} from "@/components/DataDownloader.vue";
// NOTE: Use `const FilePond = () => import('vue-filepond').then(vueFilePond => vueFilePond.default())` and <file-pond> in template causes "[Vue warn]: Failed to mount component: template or render function not defined."
const FilePondWrapper = () => import("@/components/FilePondWrapper.vue");
import * as t from 'io-ts';
import {mdiUpload, mdiDownload, mdiDelete, mdiFileFind, mdiClose, mdiEye, mdiEyeOff, mdiKey, mdiShieldHalfFull, mdiShieldCheck, mdiExpandAll, mdiCollapseAll, mdiAlert} from "@mdi/js";

import {keys} from "@/local-storage-keys";
import {strings} from "@/strings/strings";
import {type FilePondFile} from "filepond";
import {type Protection} from "@/datatypes";
import buildConstants from "@/build-constants";
import {recordsServerUrlHistory} from "@/settings/recordsServerUrlHistory";
import {recordsSecretPathHistory} from "@/settings/recordsSecretPathHistory";
import {loadLocalStorageWithValidation} from "@/utils/loadLocalStorageWithValidation";
import {secretPathHistory} from "@/settings/secretPathHistory";
import {canTransferReadableStream} from "@/utils/canTransferReadableStream";
import {getSwDownloadUrl} from "@/sw-download";

const defaultServerUrls: ReadonlyArray<string> = buildConstants.pipingServerUrls;

function normalizeUrl(url: string): string {
  return new URL(url).href;
}

const chars = {
  nonConfusing: ["a", "b", "c", "d", "e", "f", "h", "i", "j", "k", "m", "n", "p", "r", "s", "t", "u", "v", "w", "x", "y", "z", "2", "3", "4", "5", "6", "7", "8"],
  alphanum: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  numbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
};

function randomStr(len: number, chars: ReadonlyArray<string>){
  // NOTE: Confusing characters are erased
  const randomArr = window.crypto.getRandomValues(new Uint32Array(len));
  return Array.from(randomArr).map(n => chars[n % chars.length]).join('');
}

// Text from Web Share Target API
function getShareTargetText(): string | null {
  return new URL(window.location.toString()).searchParams.get("text");
}

const server_url_ref = ref<Vue>();
const secret_path_ref = ref<Vue>();

const sendOrGet = ref<'send' | 'get'>('send');

const serverUrl = ref<string>(defaultServerUrls[0]);
const initialSecretPath = randomStr(4, chars.numbers);
const secretPath = ref<string>(initialSecretPath);
const inputText = ref<string>((() => {
  const shareTargetText = getShareTargetText();
  return shareTargetText === null ? '' :  shareTargetText;
})());
watch(inputText, () => {
  // NOTE: inputText can be null after cleared
  if (inputText.value === null) {
    inputText.value = '';
  }
});
const inputFiles = ref<FilePondFile[]>([]);
const serverUrlHistory = ref<string[]>([]);
const protectionType = ref<Protection["type"]>('passwordless');
const password = ref<string>('');
const showsPassword = ref<boolean>(false);
const passwordlessSendAndVerify = ref<boolean>(false);
const showsMoreOptions = ref<boolean>(false);

// Random strings for suggested secret paths
const randomStrs = ref<string[]>([
  // mini
  '',
]);

const uploadCount = ref<number>(0);
const viewCount = ref<number>(0);
const downloadCount = ref<number>(0);
const expandedPanels = ref<
  (
    {type: 'data_uploader', props: DataUploaderProps} |
    {type: 'data_viewer', props: DataViewerProps} |
    {type: 'data_downloader', props: DataDownloaderProps}
  )[]
>([]);
// Indexes of expanded expansion-panel
const expandedPanelIds = ref<number[]>([]);

// Show snackbar
const showsSnackbar = ref<boolean>(false);
// Message of snackbar
const snackbarMessage = ref<string>('');
const swDownloadId = ref<string>('');
const download_button = ref<Vue>();

// FIXME: Should be removed
// This for lazy v-model of Combobox
const shouldBeRemoved = ref({
  latestServerUrl: serverUrl.value,
  latestSecretPath: secretPath.value,
});
const halfWidthLatestSecretPath = computed(() =>
  shouldBeRemoved.value.latestSecretPath.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
)

// FIXME: Should be removed
// NOTE: This is for update by clicking listed auto-complete
watch(serverUrl, () => {
  shouldBeRemoved.value.latestServerUrl = serverUrl.value;
});

watch(secretPath, () => {
  // NOTE: <v-combobox> "clearable" makes it null or undefined (maybe)
  if (secretPath.value === null || secretPath.value === undefined) {
    secretPath.value = '';
  }

  // FIXME: Should be removed
  // NOTE: This is for update by clicking listed auto-complete
  shouldBeRemoved.value.latestSecretPath = secretPath.value;
});

function onUpdateServerUrl() {
  window.localStorage.setItem(keys.selectedServerUrl, serverUrl.value);
}

const filePondLabelIdle = computed<string | undefined>(() => {
  if (strings.value === undefined) {
    return undefined;
  }
  // If files are nothing
  if (inputFiles.value.length === 0) {
    // Hint with file icon
    return `<img src='img/file-icon.svg' style='width: 2em'><br>${strings.value['drop_a_file_here_or_browse']}`;
  } else {
    return strings.value['drop_a_file_here_or_browse'];
  }
});

const enablePasswordProtection = computed<boolean>(() => protectionType.value === 'password');

// eslint-disable-next-line vue/return-in-computed-property
const protection = computed<Protection>(() => {
  switch (protectionType.value) {
    case 'raw':
    case 'passwordless':
      return {type: protectionType.value, alwaysSendVerify: !passwordlessSendAndVerify.value};
    case 'password':
      return {type: protectionType.value, password: password.value};
  }
});

function updateRandomStrs() {
  randomStrs.value = [
    initialSecretPath,
    randomStr(5, chars.numbers),
    randomStr(6, chars.numbers),
  ];
}

const suggestedSecretPaths = computed<string[]>(() => {
  const candidates: string[] = (() => {
    if (inputFiles.value.length === 0 && inputText.value === '') {
      // NOTE: This is for simplicity of UI
      //       Not show suggested secret path on initial status
      return [];
    }
    return randomStrs.value;
  })();

  return candidates.filter(c => secretPath.value !== c);
});

function onEnablePasswordProtection(enable: boolean) {
  protectionType.value = enable ? 'password' : 'raw';
}

function onEnablePasswordlessProtection(enable: boolean) {
  protectionType.value = enable ? 'passwordless' : 'raw';
}

// TODO: move
watch(download_button, () => {
  const a = download_button.value?.$el as HTMLAnchorElement | undefined;
  if (a === undefined) {
    return;
  }
  // NOTE: Service Worker does not work when "download" attribute attached in Chrome 108 and Safari 16
  a.href = getSwDownloadUrl(swDownloadId.value);
  a.target = "_blank";
});

onMounted(() => {
  // Update random strings
  updateRandomStrs();

  (async () => {
    await navigator.serviceWorker.ready;
    const x = await reserveDownload();
    console.log("reserve", x);
    swDownloadId.value = x.swDownloadId;
    // nextTick(() => {
    //   const a = download_button.value!.$el as HTMLAnchorElement;
    //   // NOTE: Service Worker does not work when "download" attribute attached in Chrome 108 and Safari 16
    //   a.href = getSwDownloadUrl(x.swDownloadId);
    //   a.target = "_blank";
    // });
  })();

  // Load from Local Storage
  const savedServerUrl = window.localStorage.getItem(keys.selectedServerUrl);
  if (savedServerUrl !== null) {
    serverUrl.value = savedServerUrl;
  }

  // FIXME: Combobox is lazy to update v-model
  // This is for updating server URL in real-time
  server_url_ref.value!.$el.querySelector('input')!.addEventListener('keyup', (ev)=>{
    // NOTE: [Send] button is hidden by auto-complete list if assigning to this.serverUrl
    shouldBeRemoved.value.latestServerUrl = (ev.target as any).value;
  });
  // FIXME: Combobox is lazy to update v-model
  // This is for updating secret path in real-time
  secret_path_ref.value!.$el.querySelector('input')!.addEventListener('keyup', (ev)=>{
    // NOTE: [Send] button is hidden by auto-complete list if assigning to this.secretPath
    shouldBeRemoved.value.latestSecretPath = (ev.target as any).value;
  });

  // Load server URL history from local storage
  const savedServerUrlHistory: string[] | undefined = loadLocalStorageWithValidation(t.array(t.string), keys.serverUrlHistory);
  // If none
  if (savedServerUrlHistory === undefined) {
    // Set default
    serverUrlHistory.value = defaultServerUrls.slice();
  } else {
    // Load from storage
    serverUrlHistory.value = savedServerUrlHistory;
  }
});

function onFilePondMounted() {
  preloadForUserExperience();
}

function preloadForUserExperience() {
  DataUploader();
  DataViewer();
  DataDownloader();
  import("jwk-thumbprint");
  import("@/utils/openpgp-utils");
  import("file-type/browser");
  import("linkifyjs/html");
  import("sanitize-html");
  import("jszip");

  const logoImage = new Image();
  logoImage.src = require('@/assets/logo.svg');
  logoImage.style.display = 'none';
  document.body.appendChild(logoImage);
}

// FIXME: Should be removed
function applyLatestServerUrlAndSecretPath() {
  // FIXME: should be removed after fix
  // NOTE: This set the latest secret path because v-model of Combobox is lazy
  serverUrl.value = shouldBeRemoved.value.latestServerUrl;
  // FIXME: should be removed after fix
  // NOTE: This set the latest secret path because v-model of Combobox is lazy
  secretPath.value = shouldBeRemoved.value.latestSecretPath;
}

async function send() {
  if (strings.value === undefined) {
    alert("error: language is not loaded");
    return;
  }
  applyLatestServerUrlAndSecretPath();

  if (inputText.value === '' && inputFiles.value.length === 0) {
    // Show error message
    showSnackbar(strings.value['error_input_file_or_text']);
    return;
  }
  // If secret path is empty
  if (secretPath.value === '') {
    // Show error message
    showSnackbar(strings.value['error_secret_path_not_specified']);
    return;
  }

  // If enabling password protection and password is empty
  if (protectionType.value === 'password' && password.value === '') {
    // Show error message
    showSnackbar(strings.value['password_is_required']);
    return;
  }

  const files: File[] = inputFiles.value.map(f => new File([f.file], f.file.name, f.file));
  const body: File[] | string = (() => {
    if (inputFiles.value.length === 0) {
      return inputText.value;
    }
    if (inputText.value !== '') {
      return [new File([inputText.value], "input.txt", { type: 'text/plain' }), ...files];
    }
    return files;
  })();

  // Increment upload counter
  uploadCount.value++;
  // Delegate data uploading
  expandedPanels.value.unshift({
    type: 'data_uploader',
    props: {
      uploadNo: uploadCount.value,
      data: body,
      serverUrl: serverUrl.value,
      secretPath: secretPath.value,
      protection: protection.value,
    }
  });
  // Open by default
  expandedPanelIds.value.push(expandedPanels.value.length-1);

  // If history is enable and user-input server URL is new
  if (recordsServerUrlHistory.value && !serverUrlHistory.value.map(normalizeUrl).includes(normalizeUrl(serverUrl.value))) {
    // Enroll server URLs
    serverUrlHistory.value.push(serverUrl.value);
    // Save to local storage
    window.localStorage.setItem(keys.serverUrlHistory, JSON.stringify(serverUrlHistory.value));
  }

  // If history is enable and user-input secret path is new
  if (recordsSecretPathHistory.value) {
    // Add secret path
    addSecretPath();
  }
}

// Add secret path: latest-used path is the top
function addSecretPath(): void {
  const tmpHistory = secretPathHistory.value.slice();
  // Remove element
  const idx = tmpHistory.indexOf(secretPath.value);
  if (idx !== -1) {
    tmpHistory.splice(idx, 1);
  }
  // Enrol secret path
  tmpHistory.unshift(secretPath.value);
  secretPathHistory.value = tmpHistory;
}

// NOTE: Some file types are displayed inline
async function get() {
  if (strings.value === undefined) {
    alert("error: language is not loaded");
    return;
  }
  applyLatestServerUrlAndSecretPath();

  // If secret path is empty
  if (secretPath.value === '') {
    // Show error message
    showSnackbar(strings.value['error_secret_path_not_specified']);
    return;
  }

  const urlJoin = await urlJoinAsync();
  // If enabling password protection and password is empty
  if (protectionType.value === 'password' && password.value === '') {
    // Show error message
    showSnackbar(strings.value['password_is_required']);
    return;
  }

  downloadCount.value++;
  // Delegate data downloading
  expandedPanels.value.unshift({
    type: 'data_downloader',
    props: {
      downloadNo: downloadCount.value,
      serverUrl: serverUrl.value,
      secretPath: secretPath.value,
      protection: protection.value,
      // TODO: not always
      swDownloadId: swDownloadId.value,
    }
  });
  expandedPanelIds.value.push(expandedPanels.value.length-1);
}

async function view() {
  if (strings.value === undefined) {
    alert("error: language is not loaded");
    return;
  }
  applyLatestServerUrlAndSecretPath();

  // If secret path is empty
  if (secretPath.value === '') {
    // Show error message
    showSnackbar(strings.value['error_secret_path_not_specified']);
    return;
  }

  // If enabling password protection and password is empty
  if (enablePasswordProtection.value && password.value === '') {
    // Show error message
    showSnackbar(strings.value['password_is_required']);
    return;
  }

  viewCount.value++;
  expandedPanels.value.unshift({
    type: 'data_viewer',
    props: {
      viewNo: viewCount.value,
      serverUrl: serverUrl.value,
      secretPath: secretPath.value,
      protection: protection.value,
    }
  });
  // Open by default
  expandedPanelIds.value.push(expandedPanels.value.length-1);
}

// Show error message
function showSnackbar(message: string): void {
  showsSnackbar.value = true;
  snackbarMessage.value = message;
}

function attachProtocolToUrl(): void {
  // FIXME: Don't use setTimeout()
  // @blur is called before the value changed.
  setTimeout(() => {
    if (serverUrl.value.match(/^https?:\/\//) === null) {
      serverUrl.value = `https://${serverUrl.value}`;
    }
  }, 100);
}

function deleteServerUrl(url: string): void {
  // Remove path
  serverUrlHistory.value = serverUrlHistory.value.filter(u => u !== url);
  // Save to local storage
  window.localStorage.setItem(keys.serverUrlHistory, JSON.stringify(serverUrlHistory.value));
}

function deleteSecretPath(path: string): void {
  // Remove path
  secretPathHistory.value = secretPathHistory.value.filter(p => p !== path);
}

async function reserveDownload(): Promise<{ swDownloadId: string }> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    if (!("serviceWorker" in navigator)) {
      reject(new Error("Service Worker not supported"));
      return;
    }
    if (navigator.serviceWorker.controller === null) {
      reject(new Error("navigator.serviceWorker.controller is null"));
      return;
    }
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (e: MessageEvent) => resolve({
      swDownloadId: e.data.swDownloadId,
    });
    navigator.serviceWorker.controller.postMessage({ type: 'reserve-download'}, [messageChannel.port2]);

    // if (canTransferReadableStream()) {
    //   const messageChannel = new MessageChannel();
    //   messageChannel.port1.onmessage = (e: MessageEvent) => resolve({
    //     swDownloadId: e.data.swDownloadId,
    //   });
    //
    //   return;
    // }
    // console.log("Fallback to posting chunks of ReadableStream over MessageChannel, instead of transferring the stream directly")
    // const messageChannel = new MessageChannel();
    // messageChannel.port1.onmessage = (e: MessageEvent) => resolve({
    //   swDownloadId: e.data.swDownloadId,
    // });
    // navigator.serviceWorker.controller.postMessage({
    //   type: 'enroll-download-with-channel',
    //   headers,
    // }, [messageChannel.port2]);
    //
    // const reader = readableStream.getReader();
    // while (true) {
    //   const result = await reader.read();
    //   if (result.done) {
    //     messageChannel.port1.postMessage({ done: true });
    //     break;
    //   }
    //   // .slice() is needed otherwise OpenPGP.js causes "TypeError: attempting to access detached ArrayBuffer"
    //   messageChannel.port1.postMessage(result, [result.value.buffer.slice(0)]);
    // }
  });
}
</script>

<style scoped>
.icon-and-text-margin {
  margin-right: 0.3em;
}

.readable-font {
  /* Fonts used in GitHub code */
  /* easier to distinguish similar words */
  font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;
}
</style>
