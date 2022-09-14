<template>
  <v-alert type="info" :color="color">
    <span style="font-size: 1.2em">{{ strings['verification_code'] }}: <b>{{ value }}</b></span>
  </v-alert>
</template>

<script setup lang="ts">
import {defineProps} from "vue";
import {strings} from "@/strings/strings";

const props = defineProps<{
  value: string,
  color?: string,
}>()
</script>
