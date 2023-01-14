<template>
  <v-btn color="warning" x-large block @click="update()">
    <v-icon >{{ mdiRefresh }}</v-icon>
    {{ strings?.['update_the_app'] }}
  </v-btn>
</template>

<script setup lang="ts">
import {strings} from "@/strings/strings";
import {mdiRefresh} from "@mdi/js";

function update() {
  window.location.reload();
}
</script>
