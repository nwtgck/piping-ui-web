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
        <v-icon dark left>mdi-cached</v-icon>Update
      </v-btn>
      <v-spacer></v-spacer>
      <!-- FIXME: margin-top is not good solution for adjusting middle in the bar -->
      <v-switch :label="`Dark Theme`" v-model="enableDarkTheme" style="margin-top: 1.5em;"></v-switch>
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
    text-align: center;
    /*color: #2c3e50;*/
    padding-top: 2em;
  }
</style>
