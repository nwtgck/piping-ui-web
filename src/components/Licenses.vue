<template>
  <v-card>
    <v-card-title>{{ strings['open_source_licenses'] }}</v-card-title>
    <v-divider></v-divider>
    <v-card-text>

      <!-- Library licenses -->
      <v-list-item two-line v-for="(lib, libName) in licenses" :key="libName">
        <v-list-item-content>
          <v-list-item-title>
            <a :href="lib.repository" target="_blank">{{ removeLibVersion(libName) }}</a>
            ({{ lib.licenses }})
          </v-list-item-title>
          <v-list-item-subtitle>{{ lib.publisher }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <!--  Logo license -->
      <v-list-item two-line>
        <v-list-item-content>
          <v-list-item-title>
            <div>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik" target="_blank">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon" target="_blank">www.flaticon.com</a></div>
          </v-list-item-title>
          <v-list-item-subtitle>Secondary text</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions class="justify-end">
      <v-btn color="blue darken-1" text @click="$emit('input', false)">
        {{ strings['close'] }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import licenses from '@/licenses.json';
import {strings} from "@/strings/strings";

export default defineComponent({
  props: {
    value: { type: Boolean, required: true },
  },
  emits: {
    input: (value: boolean) => {},
  },
  setup(props, context) {
    function removeLibVersion(libName: string): string {
      const idx = libName.lastIndexOf('@');
      if (idx === -1) {
        return libName;
      } else {
        return libName.substring(0, idx);
      }
    }
    return {
      licenses,
      strings,
      removeLibVersion,
    }
  }
});
</script>
