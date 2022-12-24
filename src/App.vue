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

    <v-main>
      <PipingUI/>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
/* eslint-disable */
import type Vue from "vue";
import {ref, onMounted} from "vue";
const PipingUI = () => import('@/components/PipingUI.vue');
const MenuContent = () => import('@/components/MenuContent.vue');
const Licenses = () => import("@/components/Licenses.vue");
import {VERSION} from '@/version';
import {mdiDotsVertical} from "@mdi/js";
import {appBarPromiseResolverWhichShouldBeUsedInAppVue} from "@/app-bar-promise";

const appBarRef = ref<Vue>();
const licenseDialog = ref(false);

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
