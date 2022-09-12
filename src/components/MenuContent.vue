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
          <dark-theme-switch />
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

      <v-list-item>
        <v-list-item-title>Force disable streaming upload</v-list-item-title>
        <v-list-item-action>
          <v-switch v-model="globalStore.forceDisableStreamingUpload"></v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-list-item @click="$emit('input', true)">
        <v-list-item-title>{{ strings['open_source_licenses'] }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import {defineComponent, computed, onMounted} from "vue";
import {globalStore} from "@/vue-global";
import {keys} from "@/local-storage-keys";
import {strings} from "@/strings/strings";
import {language} from "@/language";
import DarkThemeSwitch from "@/components/DarkThemeSwitch.vue";


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
    const recordsServerUrlHistory = computed<boolean>({
      get() {
        return globalStore.recordsServerUrlHistory;
      },
      set(b: boolean) {
        globalStore.recordsServerUrlHistory = b;
        window.localStorage.setItem(keys.recordsServerUrlHistory, b+"");
      },
    });
    const recordsSecretPathHistory = computed<boolean>({
      get() {
        return globalStore.recordsSecretPathHistory;
      },
      set(b: boolean) {
        globalStore.recordsSecretPathHistory = b;
        window.localStorage.setItem(keys.recordsSecretPathHistory, b+"");
      },
    });

    onMounted(() => {
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
    });

    return {
      globalStore,
      availableLanguages,
      strings,
      language,
      recordsServerUrlHistory,
      recordsSecretPathHistory,
    };
  },
});
</script>
