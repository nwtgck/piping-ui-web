<template>
  <v-alert type="info">
    <span style="font-size: 1.2em">{{ strings['verification_code'] }}: <b>{{ value }}</b></span>
  </v-alert>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import {globalStore} from "@/vue-global";
import {stringsByLang} from "@/strings";

@Component
export default class VerificationCode extends Vue {
  @Prop() public value!: string;

  // for language support
  private get strings() {
    return stringsByLang(globalStore.language);
  }
}
</script>
