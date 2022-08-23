<template>
  <v-card>
    <v-list>
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <img :src="require('../assets/logo.svg')" alt="Piping UI" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>Piping UI</v-list-item-title>
            <v-list-item-subtitle>{{ strings['version'] }}</v-list-item-subtitle>
            <a href="https://github.com/nwtgck/piping-ui-web" target="_blank">
              <font-awesome-icon :icon="['fab', 'github']" />
              {{ strings['view_on_github'] }}
            </a>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list-item>
        <v-list-item-action>
          <v-select v-model="language"
                    :items="availableLanguages"
                    :label="strings['language']"
                    item-text="str"
                    item-value="lang"
                    outlined/>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings['dark_theme'] }}</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="enableDarkTheme"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings['record_server_url'] }}</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="recordsServerUrlHistory"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings['record_secret_path'] }}</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="recordsSecretPathHistory"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item @click="input(true)">
        <v-list-item-title>{{ strings['open_source_licenses'] }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop, Emit } from 'vue-property-decorator';
import {globalStore} from "@/vue-global";
import {keys} from "@/local-storage-keys";
import {stringsByLang} from "@/strings/strings-by-lang";
import enableDarkTheme from "@/enable-dark-theme";
import {language} from "@/language";


// Available languages
type Language = 'en' | 'ja';

@Component
export default class MenuContent extends Vue {
  // v-model is licenseDialog
  @Prop() public value!: boolean;
  @Emit() public input(value: boolean) {}

  private enableDarkTheme: boolean = false;
  private availableLanguages: {lang: Language, str: string}[] = [
    {lang: 'en', str: 'English'},
    {lang: 'ja', str: '日本語'},
  ];
  // for language support
  private get strings() {
    return stringsByLang(language.value);
  }

  set language(l: string){
    language.value = l;
  }
  get language(): string {
    return language.value;
  }

  private get recordsServerUrlHistory(): boolean {
    return globalStore.recordsServerUrlHistory;
  }
  private set recordsServerUrlHistory(b: boolean) {
    globalStore.recordsServerUrlHistory = b;
    window.localStorage.setItem(keys.recordsServerUrlHistory, b+"");
  }

  private get recordsSecretPathHistory(): boolean {
    return globalStore.recordsSecretPathHistory;
  }
  private set recordsSecretPathHistory(b: boolean) {
    globalStore.recordsSecretPathHistory = b;
    window.localStorage.setItem(keys.recordsSecretPathHistory, b+"");
  }

  mounted () {
    this.enableDarkTheme = enableDarkTheme();

    // Load server url recording setting
    const recordsServerUrlHistory = window.localStorage.getItem((keys.recordsServerUrlHistory));
    if (recordsServerUrlHistory !== null) {
      globalStore.recordsServerUrlHistory = recordsServerUrlHistory === "true";
    }

    // Load secret path recording setting
    const recordsSecretPathHistory = window.localStorage.getItem((keys.recordsSecretPathHistory));
    if (recordsSecretPathHistory !== null) {
      globalStore.recordsSecretPathHistory = recordsSecretPathHistory === "true";
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
