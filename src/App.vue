<template>
  <v-app id="app">
    <v-app-bar app ref="appBarRef">
      <v-toolbar-title style="margin-right: 0.6em;">
        <!-- Show version on app title -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <span v-on="on">
              Piping
              <span class="font-weight-light">UI</span>
            </span>
          </template>
          <span>{{ VERSION }}</span>
        </v-tooltip>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-responsive class="ma-0 pa-0" :style="{ maxWidth: `${Math.max(10, (latestPipingServerUrlWithoutProtocol ?? '').length - 1)}em` }">
        <v-combobox
          v-model="pipingServerUrlWithoutProtocol"
          :items="pipingServerUrlHistory"
          :label="strings?.['server']"
          @focus="pipingServerUrlClearable = true"
          @blur="removeHttpsFromPipingServerUrl(); pipingServerUrlClearable = false"
          @keyup="setLatestPipingServerUrlWithoutProtocol($event)"
          :clearable="pipingServerUrlClearable"
          :clear-icon="mdiClose"
          outlined
          dense
          class="readable-font"
          style="margin-top: 1.6rem">
          <template v-slot:item="{ index, item }">
            <span class="readable-font">{{ item }}</span>
            <div class="flex-grow-1"></div>
            <v-list-item-action @click.stop>
              <v-btn icon @click.stop.prevent="deleteServerUrl(item)">
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-combobox>
      </v-responsive>

      <!-- Menu -->
      <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>{{ mdiDotsVertical }}</v-icon>
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

    <v-main style="padding-top: 2.2rem;">
      <PipingUI/>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
/* eslint-disable */
import type Vue from "vue";
import {onMounted, ref, watch} from "vue";
import {VERSION} from '@/version';
import {mdiClose, mdiDelete, mdiDotsVertical} from "@mdi/js";
import {appBarPromiseResolverWhichShouldBeUsedInAppVue} from "@/app-bar-promise";
import {strings} from "@/strings/strings";
import {pipingServerUrl} from "@/states/pipingServerUrl";
import {pipingServerUrlHistory} from "@/states/pipingServerUrlHistory";

const PipingUI = () => import('@/components/PipingUI.vue');
const MenuContent = () => import('@/components/MenuContent.vue');
const Licenses = () => import("@/components/Licenses.vue");


const appBarRef = ref<Vue>();
const licenseDialog = ref(false);
// NOTE: Clearing input makes inputtingPipingServerUrl null
const pipingServerUrlWithoutProtocol = ref<string | null>(pipingServerUrl.value);
removeHttpsFromPipingServerUrl();
const latestPipingServerUrlWithoutProtocol = ref(pipingServerUrlWithoutProtocol.value);
watch(pipingServerUrlWithoutProtocol, () => {
  latestPipingServerUrlWithoutProtocol.value = pipingServerUrlWithoutProtocol.value;
});
const pipingServerUrlClearable = ref(false);
watch(latestPipingServerUrlWithoutProtocol, () => {
  pipingServerUrl.value = attachHttpsToUrlIfNeed(latestPipingServerUrlWithoutProtocol.value);
});

function setLatestPipingServerUrlWithoutProtocol(event: any) {
  if (typeof event.target.value !== "string") {
    throw new Error("event.target.value is not string");
  }
  latestPipingServerUrlWithoutProtocol.value = event.target.value;
}

function removeHttpsFromPipingServerUrl() {
  const url = pipingServerUrlWithoutProtocol.value;
  if (url === null) {
    return;
  }
  pipingServerUrlWithoutProtocol.value = url.replace(/^https:\/\//, "");
}

function deleteServerUrl(url: string): void {
  // Remove path
  pipingServerUrlHistory.value = pipingServerUrlHistory.value.filter(u => u !== url);
}
function attachHttpsToUrlIfNeed(url: string | null) {
  url = url ?? "";
  return (url.startsWith("http://") || url === "") ? url : `https://${url}`;
}

onMounted(() => {
  // Resolve app bar element
  appBarPromiseResolverWhichShouldBeUsedInAppVue(appBarRef.value!.$el);
});
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
