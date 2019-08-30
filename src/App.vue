<template>
  <v-app :dark="setTheme">
    <v-app-bar app>
      <v-toolbar-title>
        <span>Piping </span>
        <span class="font-weight-light">UI</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- FIXME: margin-top is not good solution for adjusting middle in the bar -->
      <v-switch :label="`Dark Theme`" v-model="enableDarkTheme" style="margin-top: 1.5em;"></v-switch>
    </v-app-bar>

    <v-content>
      <HelloWorld/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import HelloWorld from './components/HelloWorld.vue';

export default Vue.extend({
  name: 'App',
  components: {
    HelloWorld,
  },
  data() {
    return {
      enableDarkTheme: false
    };
  },
  computed: {
    setTheme() {
      if (this.enableDarkTheme) {
        return (this.$vuetify.theme.dark = true);
      } else {
        return (this.$vuetify.theme.dark = false);
      }
    }
  }
});
</script>
