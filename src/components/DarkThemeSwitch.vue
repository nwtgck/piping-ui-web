<template>
  <v-switch v-model="enableDarkTheme"></v-switch>
</template>

<script lang="ts">
import Vue from 'vue';
import {enableDarkTheme} from "@/enable-dark-theme";

export default Vue.extend({
  computed: {
    enableDarkTheme: {
      get () {
        return enableDarkTheme.value;
      },
      set (v: boolean) {
        enableDarkTheme.value = v;
        // Enable dark theme
        // NOTE: `this.$vuetify.theme.dark` is not available in Composition API
        this.$vuetify.theme.dark = v;
      },
    },
  }
});
</script>
