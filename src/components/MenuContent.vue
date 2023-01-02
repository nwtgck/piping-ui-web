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
            <v-list-item-subtitle>{{ strings?.['version'] }}</v-list-item-subtitle>
            <a href="https://github.com/nwtgck/piping-ui-web" target="_blank">
              <font-awesome-icon :icon="['fab', 'github']" />
              {{ strings?.['view_on_github'] }}
            </a>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list-item>
        <v-list-item-action>
          <v-select v-model="language"
                    :items="availableLanguages"
                    :label="strings?.['language']"
                    item-text="str"
                    item-value="lang"
                    outlined/>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings?.['dark_theme'] }}</v-list-item-title>
        <v-list-item-action>
          <dark-theme-switch />
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings?.['record_server_url'] }}</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="recordsServerUrlHistory"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings?.['record_secret_path'] }}</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="recordsSecretPathHistory"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>Force disable streaming upload</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="forceDisableStreamingUpload"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item @click="$emit('input', true)">
        <v-list-item-title>{{ strings?.['open_source_licenses'] }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {strings} from "@/strings/strings";
import {language} from "@/language";
import DarkThemeSwitch from "@/components/DarkThemeSwitch.vue";
import {recordsServerUrlHistory} from "@/settings/recordsServerUrlHistory";
import {recordsSecretPathHistory} from "@/settings/recordsSecretPathHistory";
import {forceDisableStreamingUpload} from "@/settings/forceDisableStreamingUpload";

// Available languages
type Language = 'en' | 'ja';

export default defineComponent({
  components: {
    DarkThemeSwitch,
  },
  // v-model is licenseDialog
  props: {
    value: { type: Boolean, required: true },
  },
  emits: {
    input: (value: boolean) => {},
  },
  setup(props, context) {
    const availableLanguages: {lang: Language, str: string}[] = [
      {lang: 'en', str: 'English'},
      {lang: 'ja', str: '日本語'},
    ];

    return {
      availableLanguages,
      strings,
      language,
      recordsServerUrlHistory,
      recordsSecretPathHistory,
      forceDisableStreamingUpload,
    };
  },
});
</script>
