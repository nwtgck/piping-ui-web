<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>
        <span>Piping </span>
        <span class="font-weight-light">UI</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- FIXME: margin-top is not good solution for adjusting middle in the bar -->
      <v-switch :label="`Dark Theme`" @change="toggleLightDarkTheme" style="margin-top: 1.5em;"></v-switch>
    </v-app-bar>

    <v-content>
      <HelloWorld/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';

@Component({
  components: {
    HelloWorld
  }
})
export default class App extends Vue {
  toggleLightDarkTheme(isDark: boolean) {
    this.$vuetify.theme.dark = isDark;
  }
}
</script>
