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
      <v-btn color="blue darken-1" text @click="input(false)">
        {{ strings['close'] }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit} from 'vue-property-decorator';
import licenses from '@/licenses.json';
import {globalStore} from "@/vue-global";
import {strings} from "@/strings";


@Component
export default class Licenses extends Vue {
  // value is licenseDialog to close
  @Prop() public value!: boolean;
  @Emit() public input(value: string) {}

  private licenses = licenses;

  // for language support
  private get strings() {
    return strings(globalStore.language);
  }

  private removeLibVersion(libName: string): string {
    const idx = libName.lastIndexOf('@');
    if (idx === -1) {
      return libName;
    } else {
      return libName.substring(0, idx);
    }
  }
}
</script>
