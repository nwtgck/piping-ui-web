<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em; margin-bottom: 1em;">

        <div style="text-align: center; margin-bottom: 1.2rem;">
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

        <div v-show="sendOrGet === 'send'">
          <file-pond-wrapper v-model="inputFiles"
                             :label-idle="filePondLabelIdle"
                             data-testid="file_input"
          />
          <v-textarea :label="strings?.['text_placeholder']"
                      v-model="inputText"
                      clearable
                      :clear-icon="mdiClose"
                      :prepend-inner-icon="mdiPencil"
                      rows="2"
                      auto-grow
                      outlined
          ></v-textarea>
        </div>

        <v-combobox :label="strings?.['secret_path']"
                    v-model="secretPath"
                    :items="secretPathHistory"
                    :placeholder="strings?.['secret_path_placeholder']"
                    ref="secret_path_ref"
                    inputmode="numeric"
                    class="ma-0 pa-0 readable-font"
                    outlined
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

        <div style="text-align: right;">
          <template v-if="suggestedSecretPaths.length !== 0" >
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
          <v-row align="center" class="ma-0">
            <div>
              <v-switch :input-value="protectionType === 'passwordless'"
                        @change="onEnablePasswordlessProtection"
                        inset
                        style="display: inline-block"
                        data-testid="passwordless_switch">
                <template v-slot:label>
                  <v-icon class="icon-and-text-margin" :color="protectionType === 'passwordless' ? 'blue' : ''">{{ mdiShieldHalfFull }}</v-icon>
                  {{ strings?.['passwordless_protection'] }}
                </template>
              </v-switch>

              <v-tooltip top :open-on-hover="tooltipOpenOnHover">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon dark v-bind="attrs" v-on="on" small class="tooltip-icon-after-switch" style="margin-right: 1.5rem;">
                    {{ mdiInformation }}
                  </v-icon>
                </template>
                <div v-html="strings?.['passwordless_protection_info_html']" style="width: 20rem" />
              </v-tooltip>
            </div>

            <div v-if="sendOrGet === 'send' && protectionType === 'passwordless'">
              <v-switch v-model="passwordlessSendAndVerify"
                        inset
                        style="display: inline-block"
                        data-testid="passwordless_send_and_verify_switch">
                <template v-slot:label>
                  <v-icon class="icon-and-text-margin" :color="passwordlessSendAndVerify ? 'blue' : ''">{{ mdiShieldCheck }}</v-icon>
                  {{ strings?.['passwordless_verify_and_send'] }}
                </template>
              </v-switch>

              <v-tooltip top :open-on-hover="tooltipOpenOnHover">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon dark v-bind="attrs" v-on="on" small class="tooltip-icon-after-switch">
                    {{ mdiInformation }}
                  </v-icon>
                </template>
                <div v-html="strings?.['passwordless_verify_and_send_info_html']" style="width: 20rem" />
              </v-tooltip>
            </div>
          </v-row>

          <v-row v-if='showsMoreOptions' align="center" class="ma-0" style="padding-top: 0.5em;">
            <div>
              <v-switch :input-value="protectionType === 'password'"
                        @change="onEnablePasswordProtection"
                        inset
                        color="blue"
                        class="ma-0 pa-0"
                        style="display: inline-block"
                        data-testid="password_switch">
                <template v-slot:label>
                  <v-icon class="icon-and-text-margin" :color="protectionType === 'password' ? 'blue' : ''">{{ mdiKey }}</v-icon>
                  {{ protectionType === 'password' ? '' : strings?.['protect_with_password'] }}
                </template>
              </v-switch>

              <v-tooltip top :open-on-hover="tooltipOpenOnHover">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon dark v-bind="attrs" v-on="on" small class="tooltip-icon-after-switch">
                    {{ mdiInformation }}
                  </v-icon>
                </template>
                <div v-html="strings?.['password_info_html']" style="width: 20rem" />
              </v-tooltip>
            </div>

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
              <v-btn color="blue"
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

        <v-btn @click="showsMoreOptions = !showsMoreOptions" depressed plain style="margin-top: 1.2rem; text-transform: none" data-testid="more_options_button">
          <v-icon left dark>
            {{ showsMoreOptions ? mdiCollapseAll : mdiExpandAll }}
          </v-icon>
          {{ showsMoreOptions ? strings?.['hide_options'] : strings?.['more_options'] }}
        </v-btn>

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
import Vue, {computed, onMounted, ref, watch} from 'vue';
import {type DataUploaderProps} from '@/components/DataUploader.vue';
import {type DataViewerProps} from "@/components/DataViewer.vue";
import {type DataDownloaderProps} from "@/components/DataDownloader.vue";
import {mdiAlert, mdiClose, mdiCollapseAll, mdiDelete, mdiDownload, mdiExpandAll, mdiEye, mdiEyeOff, mdiFileFind, mdiKey, mdiShieldCheck, mdiShieldHalfFull, mdiUpload, mdiPencil, mdiInformation} from "@mdi/js";
import {strings} from "@/strings/strings";
import {type FilePondFile} from "filepond";
import {type Protection} from "@/datatypes";
import {recordsServerUrlHistory} from "@/states/recordsServerUrlHistory";
import {recordsSecretPathHistory} from "@/states/recordsSecretPathHistory";
import {secretPathHistory} from "@/states/secretPathHistory";
import {pipingServerUrl} from "@/states/pipingServerUrl";
import {pipingServerUrlHistory} from "@/states/pipingServerUrlHistory";

const urlJoinAsync = () => import('url-join').then(p => p.default);
const DataUploader = () => import('@/components/DataUploader.vue');
const DataViewer = () => import("@/components/DataViewer.vue");
const DataDownloader = () => import('@/components/DataDownloader.vue');
// NOTE: Use `const FilePond = () => import('vue-filepond').then(vueFilePond => vueFilePond.default())` and <file-pond> in template causes "[Vue warn]: Failed to mount component: template or render function not defined."
const FilePondWrapper = () => import("@/components/FilePondWrapper.vue");


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

const secret_path_ref = ref<Vue>();

const sendOrGet = ref<'send' | 'get'>('send');
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
const protectionType = ref<Protection["type"]>('passwordless');
const password = ref<string>('');
const showsPassword = ref<boolean>(false);
const passwordlessSendAndVerify = ref<boolean>(false);
const showsMoreOptions = ref<boolean>(false);
// Tooltip does not show in iOS Safari without `:open-on-hover="false"`
// https://github.com/vuetifyjs/vuetify/issues/7114#issuecomment-695188818
const tooltipOpenOnHover: boolean = !matchMedia('(hover: none), (pointer: coarse)').matches;

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

// FIXME: Should be removed
// This for lazy v-model of Combobox
const shouldBeRemoved = ref({
  latestSecretPath: secretPath.value,
});
const halfWidthLatestSecretPath = computed(() =>
  shouldBeRemoved.value.latestSecretPath.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
)

watch(secretPath, () => {
  // NOTE: <v-combobox> "clearable" makes it null or undefined (maybe)
  if (secretPath.value === null || secretPath.value === undefined) {
    secretPath.value = '';
  }

  // FIXME: Should be removed
  // NOTE: This is for update by clicking listed auto-complete
  shouldBeRemoved.value.latestSecretPath = secretPath.value;
});

const filePondLabelIdle = computed<string | undefined>(() => {
  if (strings.value === undefined) {
    return undefined;
  }
  // If files are nothing
  if (inputFiles.value.length === 0) {
    // Hint with file icon
    return `<img src='img/file-icon.svg' style='width: 2em'><br>${strings.value['drop_files_here_or_browse']}`;
  } else {
    return strings.value['drop_files_here_or_browse'];
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
    if (shouldBeRemoved.value.latestSecretPath) {
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

onMounted(() => {
  // Update random strings
  updateRandomStrs();

  // FIXME: Combobox is lazy to update v-model
  // This is for updating secret path in real-time
  secret_path_ref.value!.$el.querySelector('input')!.addEventListener('keyup', (ev)=>{
    // NOTE: [Send] button is hidden by auto-complete list if assigning to this.secretPath
    shouldBeRemoved.value.latestSecretPath = (ev.target as any).value;
  });

  window.addEventListener('load', () => {
    preloadForUserExperience();
  });
});

function preloadForUserExperience() {
  DataUploader();
  DataViewer();
  DataDownloader();
  import("jwk-thumbprint");
  import("@/utils/openpgp-utils");
  import("file-type/browser");
  import("linkifyjs");
  import("linkify-string");
  import("jszip");
  import("@/components/MenuContent.vue");

  const logoImage = new Image();
  logoImage.src = require('@/assets/logo.svg');
  logoImage.style.display = 'none';
  document.body.appendChild(logoImage);
}

// FIXME: Should be removed
function applyLatestServerUrlAndSecretPath() {
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

  const sendingFilePondFiles: FilePondFile[] = inputFiles.value;
  const sendingText: string = inputText.value;
  // Increment upload counter
  uploadCount.value++;
  // Delegate data uploading
  expandedPanels.value.unshift({
    type: 'data_uploader',
    props: {
      uploadNo: uploadCount.value,
      data: body,
      inputFileName: Array.isArray(body) && body.length === 1 ? body[0].name : undefined,
      serverUrl: pipingServerUrl.value,
      secretPath: secretPath.value,
      protection: protection.value,
      // NOTE: This may leak when not succeeded
      onSentSuccessfully() {
        if (inputFiles.value === sendingFilePondFiles) {
          // clear input files
          inputFiles.value = [];
        }
        if (inputText.value === sendingText) {
          // clear input text
          inputText.value = '';
        }
      },
    }
  });
  // Open by default
  expandedPanelIds.value.push(expandedPanels.value.length-1);

  // If history is enable and user-input server URL is new
  if (recordsServerUrlHistory.value && !pipingServerUrlHistory.value.map(normalizeUrl).includes(normalizeUrl(pipingServerUrl.value))) {
    // Enroll server URLs
    pipingServerUrlHistory.value = [...pipingServerUrlHistory.value, pipingServerUrl.value];
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
      serverUrl: pipingServerUrl.value,
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
      serverUrl: pipingServerUrl.value,
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

function deleteSecretPath(path: string): void {
  // Remove path
  secretPathHistory.value = secretPathHistory.value.filter(p => p !== path);
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

.tooltip-icon-after-switch {
  margin-left: 0.5rem;
  margin-bottom: 0.6rem;
}
</style>
