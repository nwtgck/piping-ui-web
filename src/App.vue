<template>
  <v-app id="app">
    <v-app-bar app>
      <v-toolbar-title style="margin-right: 0.6em;">
        <!-- Show version on app title -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <span v-on="on">
              Piping
              <span class="font-weight-light">UI</span>
            </span>
          </template>
          <span>{{ version }}</span>
        </v-tooltip>
      </v-toolbar-title>

      <!-- PWA update button -->
      <v-btn v-if="pwa.updateExists"
             @click="refreshApp"
             depressed color="blue" dark small outlined>
        <v-icon dark left>mdi-cached</v-icon>{{ strings['pwa_update'] }}
      </v-btn>
      <v-spacer></v-spacer>

      <!-- Menu -->
      <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-list>
            <v-list>
              <v-list-item>
                <v-list-item-avatar>
                  <img :src="require('./assets/logo.svg')" alt="Piping UI" />
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title>Piping UI</v-list-item-title>
                  <v-list-item-subtitle>{{ strings['version'] }}</v-list-item-subtitle>
                  <a href="https://github.com/nwtgck/piping-ui-web" target="_blank">
                    <v-icon small style="margin-right: 0.3em;">fab fa-github</v-icon>{{ strings['view_on_github'] }}
                  </a>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-list-item>
              <v-list-item-action>
                <v-select v-model="language"
                          :items="availableLanguages"
                          :label="strings['language']"
                          item-text="str"
                          item-value="lang"
                          outlined/>
              </v-list-item-action>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>{{ strings['dark_theme'] }}</v-list-item-title>
              <v-list-item-action>
                <v-switch v-model="enableDarkTheme"></v-switch>
              </v-list-item-action>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>{{ strings['record_server_url'] }}</v-list-item-title>
              <v-list-item-action>
                <v-switch v-model="recordsServerUrlHistory"></v-switch>
              </v-list-item-action>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>{{ strings['record_secret_path'] }}</v-list-item-title>
              <v-list-item-action>
                <v-switch v-model="recordsSecretPathHistory"></v-switch>
              </v-list-item-action>
            </v-list-item>

            <v-list-item @click="licenseDialog = true">
              <v-list-item-title>{{ strings['open_source_licenses'] }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!--  Open source licenses -->
    <v-dialog v-model="licenseDialog" scrollable max-width="70%">
      <v-card>
        <v-card-title>{{ strings['open_source_licenses'] }}</v-card-title>
        <v-divider></v-divider>
        <v-card-text>

          <!-- Library licenses -->
          <v-list-item two-line v-for="(lib, libName) in licenses" :key="libName">
            <v-list-item-content>
              <v-list-item-title>
                <a :href="lib.repository" target="_blank">{{ libName.replace(/@.*?$/, '') }}</a>
                ({{ lib.licenses }})
              </v-list-item-title>
              <v-list-item-subtitle>{{ lib.publisher }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>

          <!--  Logo license -->
          <v-list-item two-line>
            <v-list-item-content>
              <v-list-item-title>
                <div>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik" target="_blank">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon" target="_blank">www.flaticon.com</a></div>
              </v-list-item-title>
              <v-list-item-subtitle>Secondary text</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn color="blue darken-1" text @click="licenseDialog = false">
            {{ strings['close'] }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-content>
      <PipingUI/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
const PipingUI = () => import('@/components/PipingUI.vue');
import {keys} from "@/local-storage-keys";
import {VERSION} from '@/version';
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import licenses from '@/licenses.json';

// Available languages
type Language = 'en' | 'ja';

@Component({
  components: {
    PipingUI,
  }
})
export default class App extends Vue {
  private enableDarkTheme: boolean = false;
  private licenseDialog: boolean = false;
  private licenses = licenses;
  private get recordsServerUrlHistory(): boolean {
    return globalStore.recordsServerUrlHistory;
  }
  private set recordsServerUrlHistory(b: boolean) {
    globalStore.recordsServerUrlHistory = b;
    window.localStorage.setItem(keys.recordsServerUrlHistory, b+"");
  }

  private get recordsSecretPathHistory(): boolean {
    return globalStore.recordsSecretPathHistory;
  }
  private set recordsSecretPathHistory(b: boolean) {
    globalStore.recordsSecretPathHistory = b;
    window.localStorage.setItem(keys.recordsSecretPathHistory, b+"");
  }

  // TODO: Remove any
  pwa: {refreshing: boolean, registration?: any, updateExists: boolean} = {
    refreshing: false,
    registration: undefined,
    updateExists: false
  };
  private version = VERSION;
  private availableLanguages: {lang: Language, str: string}[] = [
    {lang: 'en', str: 'English'},
    {lang: 'ja', str: '日本語'},
  ];
  // for language support
  private get strings() {
    return strings(globalStore.language);
  }

  created () {
    document.addEventListener(
      'swUpdated', this.showRefreshUI, { once: true }
    );
    navigator.serviceWorker.addEventListener(
      'controllerchange', () => {
        if (this.pwa.refreshing) return;
        this.pwa.refreshing = true;
        window.location.reload();
      }
    );
  }

  set language(l: string){
    globalStore.language = l;
    // Store to Local Storage
    window.localStorage.setItem(keys.language, l);
  }
  get language(): string {
    return globalStore.language;
  }

  // TODO: Remove any
  showRefreshUI (e: any) {
    this.pwa.registration = e.detail;
    this.pwa.updateExists = true;
  }

  // Update PWA app
  refreshApp () {
    this.pwa.updateExists = false;
    if (this.pwa.registration === undefined || !this.pwa.registration.waiting) {
      return;
    }
    this.pwa.registration.waiting.postMessage('skipWaiting');
  }

  mounted () {
    // Load environmental dark theme setting
    this.enableDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Load dark theme setting
    const darkThemeStr = window.localStorage.getItem(keys.darkTheme);
    if (darkThemeStr !== null) {
      this.enableDarkTheme = darkThemeStr === "true";
    }

    // Load server url recording setting
    const recordsServerUrlHistory = window.localStorage.getItem((keys.recordsServerUrlHistory));
    if (recordsServerUrlHistory !== null) {
      globalStore.recordsServerUrlHistory = recordsServerUrlHistory === "true";
    }

    // Load secret path recording setting
    const recordsSecretPathHistory = window.localStorage.getItem((keys.recordsSecretPathHistory));
    if (recordsSecretPathHistory !== null) {
      globalStore.recordsSecretPathHistory = recordsSecretPathHistory === "true";
    }
  }

  @Watch('enableDarkTheme')
  onEnableDarkTheme() {
    // Enable dark theme
    this.$vuetify.theme.dark = this.enableDarkTheme;
    // Save dark theme setting in Local Storage
    window.localStorage.setItem(keys.darkTheme, this.enableDarkTheme.toString());
  }
}
</script>

<style>
  #app {
    /*font-family: 'Avenir', Helvetica, Arial, sans-serif;*/
    /*-webkit-font-smoothing: antialiased;*/
    /*-moz-osx-font-smoothing: grayscale;*/
    /*text-align: center;*/
    /*color: #2c3e50;*/
    padding-top: 2em;
  }
</style>
