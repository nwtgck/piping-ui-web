<template>
  <v-switch v-model="enableDarkTheme"></v-switch>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import {enableDarkTheme} from "@/enable-dark-theme";

@Component
export default class DarkThemeSwitch extends Vue {
  get enableDarkTheme() {
    return enableDarkTheme.value;
  }
  set enableDarkTheme(v: boolean) {
    enableDarkTheme.value = v;
    // Enable dark theme
    // NOTE: `this.$vuetify.theme.dark` is not available in Composition API
    this.$vuetify.theme.dark = v;
  }
}
</script>
