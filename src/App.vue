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
        <v-icon dark left>mdi-cached</v-icon>{{ strings('pwa_update') }}
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
            <v-list-item>
              <v-list-item-action>
                <v-select v-model="language"
                          :items="availableLanguages"
                          :label="strings('language')"
                          item-text="str"
                          item-value="lang"
                          outlined/>
              </v-list-item-action>
            </v-list-item>

            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="enableDarkTheme"></v-switch>
              </v-list-item-action>
              <v-list-item-title>{{ strings('dark_theme') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-content>
      <PipingUI/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import HelloWorld from '@/components/HelloWorld.vue';
import PipingUI from '@/components/PipingUI.vue';
import {keys} from "@/local-storage-keys";
import {VERSION} from '@/version';
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";

// Available languages
type Language = 'en' | 'ja';

@Component({
  components: {
    HelloWorld,
    PipingUI,
  }
})
export default class App extends Vue {
  enableDarkTheme: boolean = false;
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
