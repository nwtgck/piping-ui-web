<template>
  <v-app>
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
import { Component, Vue, Watch } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';
import {keys} from "@/local-storage-keys";

@Component({
  components: {
    HelloWorld
  }
})
export default class App extends Vue {
  enableDarkTheme: boolean = false;

  mounted () {
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
