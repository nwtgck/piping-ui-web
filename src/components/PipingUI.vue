<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em; margin-bottom: 1em;">

        <div style="text-align: center">
          <v-btn-toggle v-model="sendOrGet" mandatory>
            <v-btn text value="send" data-testid="send_menu_button">
              {{ strings?.['send'] }}
              <v-icon right dark>{{ icons.mdiUpload }}</v-icon>
            </v-btn>
            <v-btn text value="get" data-testid="get_menu_button">
              {{ strings?.['get'] }}
              <v-icon right dark>{{ icons.mdiDownload }}</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>

        <div v-show="sendOrGet === 'send'">
          <div :class="`d-flex justify-end`">
            <v-switch
                    inset
                    v-model="isTextMode">
              <template v-slot:label>
                <v-icon class="icon-and-text-margin">{{ icons.mdiText }}</v-icon>
                {{ strings?.['text_mode'] }}
              </template>
            </v-switch>
          </div>
          <file-pond-wrapper v-if="!isTextMode"
                             v-model="files"
                             :label-idle="filePondLabelIdle"
                             data-testid="file_input"
          />
          <v-textarea v-if="isTextMode"
                      :label="strings?.['text_placeholder']"
                      v-model="inputText"
                      clearable
                      :clear-icon="icons.mdiClose"
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
                    :clear-icon="icons.mdiClose"
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
                <v-icon>{{ icons.mdiDelete }}</v-icon>
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
                    :clear-icon="icons.mdiClose"
                    data-testid="secret_path_input"
        >
          <template v-slot:item="{ index, item }">
            <span class="readable-font">{{ item }}</span>
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
                  class="ma-0 readable-font"
                  label
                  outlined
                  style="font-size: 1em;"
          >
            {{ suggestedSecretPath }}
          </v-chip>
        </div>

        <v-col class="pa-0">
          <v-row align="center" class="ma-0" style="padding-top: 0.4em;">
            <v-switch :input-value="protectionType === 'passwordless'"
                      @change="onEnablePasswordlessProtection"
                      inset
                      data-testid="passwordless_switch"
                      style="margin-right: 2.5rem;">
              <template v-slot:label>
                <v-icon class="icon-and-text-margin" :color="protectionType === 'passwordless' ? 'blue' : ''">{{ icons.mdiShieldHalfFull }}</v-icon>
                {{ strings?.['passwordless_protection'] }}
              </template>
            </v-switch>

            <v-switch v-if="sendOrGet === 'send' && protectionType === 'passwordless'"
                      v-model="passwordlessSendAndVerify"
                      inset
                      data-testid="passwordless_send_and_verify_switch">
              <template v-slot:label>
                <v-icon class="icon-and-text-margin" :color="passwordlessSendAndVerify ? 'blue' : ''">{{ icons.mdiShieldCheck }}</v-icon>
                {{ "Verify and send" }}
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
                <v-icon class="icon-and-text-margin" :color="protectionType === 'password' ? 'blue' : ''">{{ icons.mdiKey }}</v-icon>
                {{ protectionType === 'password' ? '' : strings?.['protect_with_password'] }}
              </template>
            </v-switch>

            <v-text-field v-if="protectionType === 'password'"
                          v-model="password"
                          :type="showsPassword ? 'text' : 'password'"
                          :label="strings?.['password']"
                          :append-icon="showsPassword ? icons.mdiEye : icons.mdiEyeOff"
                          @click:append="showsPassword = !showsPassword"
                          single-line
                          class="pa-0"
                          style="margin-left: 0.5em;"
                          data-testid="password_input" />
          </v-row>
        </v-col>

        <v-btn @click="showsMoreOptions = !showsMoreOptions" depressed style="margin-bottom: 1rem; text-transform: none" data-testid="more_options_button">
          <v-icon left dark>
            {{ showsMoreOptions ? icons.mdiCollapseAll : icons.mdiExpandAll }}
          </v-icon>
          {{ showsMoreOptions ? "Hide options" : "More options" }}
        </v-btn>

        <div style="margin-top: 1.2em;">
          <v-btn v-if="sendOrGet === 'send'"
                 color="primary"
                 v-on:click="send()"
                 block
                 data-testid="send_button">
            {{ strings?.['send'] }}
            <v-icon right dark>{{ icons.mdiUpload }}</v-icon>
          </v-btn>
          <v-layout v-if="sendOrGet === 'get'">
            <v-flex xs6>
              <v-btn color="light-blue"
                     dark
                     @click="view()"
                     block
                     data-testid="view_button">
                {{ strings?.['view'] }}
                <v-icon right dark>{{ icons.mdiFileFind }}</v-icon>
              </v-btn>
            </v-flex>
            <v-flex xs6>
              <v-btn color="blue"
                     @click="get()"
                     dark
                     block
                     data-testid="download_button">
                {{ strings?.['download'] }}
                <v-icon right dark>{{ icons.mdiDownload }}</v-icon>
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
        <v-icon>{{ icons.mdiClose }}</v-icon>
      </v-btn>
    </v-snackbar>
  </v-layout>
</template>

<script setup lang="ts">
import Vue, { ref, watch, computed, onMounted } from 'vue';
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
import {mdiUpload, mdiDownload, mdiDelete, mdiFileFind, mdiClose, mdiEye, mdiEyeOff, mdiKey, mdiShieldHalfFull, mdiText, mdiShieldCheck, mdiExpandAll, mdiCollapseAll} from "@mdi/js";

import {keys} from "@/local-storage-keys";
import {strings} from "@/strings/strings";
import {type FilePondFile, type ActualFileObject} from "filepond";
import {type Protection} from "@/datatypes";
import buildConstants from "@/build-constants";
import {baseAndExt} from "@/utils/baseAndExt";
import {recordsServerUrlHistory} from "@/settings/recordsServerUrlHistory";
import {recordsSecretPathHistory} from "@/settings/recordsSecretPathHistory";

const defaultServerUrls: ReadonlyArray<string> = buildConstants.pipingServerUrls;

function normalizeUrl(url: string): string {
  return new URL(url).href;
}

// Load from local storage with validation
function loadLocalStorage<T>(typeC: t.Type<T>, key: string): T | undefined {
  const item: string | null = window.localStorage.getItem(key);
  if (item !== null) {
    const either = typeC.decode(JSON.parse(item));
    if (either._tag === 'Left') return undefined;
    return either.right;
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

// Text from Web Share Target API
function getShareTargetText(): string | null {
  return new URL(window.location.toString()).searchParams.get("text");
}

const server_url_ref = ref<Vue>();
const secret_path_ref = ref<Vue>();

const sendOrGet = ref<'send' | 'get'>('send');

const serverUrl = ref<string>(defaultServerUrls[0]);
const secretPath = ref<string>("");
const isTextMode = ref<boolean>(getShareTargetText() !== null);
const inputText = ref<string>((() => {
  const shareTargetText = getShareTargetText();
  return shareTargetText === null ? '' :  shareTargetText;
})());
const files = ref<FilePondFile[]>([]);
const serverUrlHistory = ref<string[]>([]);
const secretPathHistory = ref<string[]>([]);
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

const icons = {
  mdiUpload,
  mdiDownload,
  mdiDelete,
  mdiFileFind,
  mdiClose,
  mdiEye,
  mdiEyeOff,
  mdiKey,
  mdiShieldHalfFull,
  mdiText,
  mdiShieldCheck,
  mdiExpandAll,
  mdiCollapseAll,
};

// FIXME: Should be removed
// This for lazy v-model of Combobox
const shouldBeRemoved = ref({
  latestServerUrl: serverUrl.value,
  latestSecretPath: secretPath.value,
});

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
  if (files.value.length === 0) {
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
  randomStrs.value[0] = randomStr(3, chars.nonConfusing);
}

const suggestedSecretPaths = computed<string[]>(() => {
  const candidates: string[] = (() => {
    if ((!isTextMode.value && files.value.length === 0) || (isTextMode.value && inputText.value === '')) {
      // NOTE: This is for simplicity of UI
      //       Not show suggested secret path on initial status
      return [];
    } else if (isTextMode.value) {
      return [...randomStrs.value.map(s => `${s}.txt`), ...randomStrs.value];
    } else if (files.value.length === 1) {
      const fileName = files.value[0].filename;
      const {ext} = baseAndExt(fileName);
      return [
        fileName,
        ...randomStrs.value.map(s => `${s}${ext}`),
        ...randomStrs.value,
      ];
    } else if(files.value.length > 1) {
      if(secretPath.value.endsWith('.zip')) {
        return [];
      } else {
        return [
          ...(secretPath.value === '' ? [] : [`${secretPath.value}.zip`]),
          ...randomStrs.value.map(s => `${s}.zip`),
          ...randomStrs.value,
        ];
      }
    } else {
      return randomStrs.value;
    }
  })();

  return candidates.filter(c => secretPath.value !== c);
});

function onEnablePasswordProtection(enable: boolean) {
  protectionType.value = enable ? 'password' : 'raw';
}

function onEnablePasswordlessProtection(enable: boolean) {
  protectionType.value = enable ? 'passwordless' : 'raw';
}

onMounted(() => {
  // Update random strings
  updateRandomStrs();

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
  const savedServerUrlHistory: string[] | undefined = loadLocalStorage(t.array(t.string), keys.serverUrlHistory);
  // If none
  if (savedServerUrlHistory === undefined) {
    // Set default
    serverUrlHistory.value = defaultServerUrls.slice();
  } else {
    // Load from storage
    serverUrlHistory.value = savedServerUrlHistory;
  }

  // Load server URL history from local storage
  const savedSecretPathHistory: string[] | undefined = loadLocalStorage(t.array(t.string), keys.secretPathHistory);
  if (savedSecretPathHistory !== undefined) {
    secretPathHistory.value = savedSecretPathHistory;
  }

  preloadForUserExperience();
});

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

  if (!isTextMode.value && files.value.length === 0) {
    // Show error message
    showSnackbar(strings.value['error_file_not_selected']);
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

  const body: ActualFileObject[] | string = isTextMode.value ? inputText.value : files.value.map(f => f.file);

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
    // Save to local storage
    window.localStorage.setItem(keys.secretPathHistory, JSON.stringify(secretPathHistory.value));
  }
}

// Add secret path: latest-used path is the top
function addSecretPath(): void {
  // Remove element
  const idx = secretPathHistory.value.indexOf(secretPath.value);
  if (idx !== -1) {
    secretPathHistory.value.splice(idx, 1);
  }
  // Enrol secret path
  secretPathHistory.value.unshift(secretPath.value);
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
  // Save to local storage
  window.localStorage.setItem(keys.secretPathHistory, JSON.stringify(secretPathHistory.value));
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
