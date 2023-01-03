<template>
  <file-pond :value="value"
             @input="input"
             :label-idle="labelIdle"
             :allow-multiple="true"
             :allow-paste="true"
  />
</template>

<script lang="ts">
import Vue, {PropType} from "vue";
import {type FilePondFile} from "filepond";
import * as filePond from "filepond";
const FilePond = () => import('vue-filepond').then(vueFilePond => vueFilePond.default());

(async () => require('filepond/dist/filepond.min.css'))();

export default Vue.extend({
  components: {
    FilePond,
  },
  props: {
    value: Array as PropType<FilePondFile[]>,
    labelIdle: String,
  },
  methods: {
    input(value: FilePondFile[]) {
      this.$emit("input", value);
    },
  },
  created() {
    // Disable "Powered by PQINA" link
    filePond.setOptions({
      credits: false,
    });
  }
});
</script>
