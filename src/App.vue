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
        <v-icon dark left>{{ icons.mdiCached }}</v-icon>{{ strings['pwa_update'] }}
      </v-btn>
      <v-spacer></v-spacer>

      <!-- Menu -->
      <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>{{ icons.mdiDotsVertical }}</v-icon>
          </v-btn>
        </template>

        <MenuContent v-model="licenseDialog" />
      </v-menu>
    </v-app-bar>

    <!--  Open source licenses -->
    <v-dialog v-model="licenseDialog" scrollable max-width="70%">
      <!-- `v-if="licenseDialog"` enables to load <Licenses> asynchronously-->
      <Licenses v-model="licenseDialog" v-if="licenseDialog"/>
    </v-dialog>

    <v-content>
      <PipingUI/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
const PipingUI = () => import('@/components/PipingUI.vue');
const MenuContent = () => import('@/components/MenuContent.vue');
const Licenses = () => import("@/components/Licenses.vue");
import {VERSION} from '@/version';
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";
import {mdiCached, mdiDotsVertical} from "@mdi/js";

@Component({
  components: {
    PipingUI,
    MenuContent,
    Licenses,
  }
})
export default class App extends Vue {
  private licenseDialog: boolean = false;
  private icons = {
    mdiCached,
    mdiDotsVertical,
  };

  // TODO: Remove any
  pwa: {refreshing: boolean, registration?: any, updateExists: boolean} = {
    refreshing: false,
    registration: undefined,
    updateExists: false
  };
  private version = VERSION;

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
