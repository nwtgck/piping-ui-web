<template>
  <v-alert type="info">
    <span style="font-size: 1.2em">{{ strings['verification_code'] }}: <b>{{ value }}</b></span>
  </v-alert>
</template>

<script setup lang="ts">
import {defineProps, computed} from "vue";
import {globalStore} from "@/vue-global";
import {stringsByLang} from "@/strings/strings-by-lang";

const props = defineProps<{
  value: string,
}>()

const strings = computed(() => stringsByLang(globalStore.language))
</script>
