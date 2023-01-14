<template>
  <file-pond :value="value"
             @input="input"
             ref="filePond"
             :label-idle="labelIdle"
             :allow-multiple="true"
             :allow-paste="true"
             credits=""
  />
</template>

<script lang="ts">
import Vue, {PropType} from "vue";
import {type FilePondFile} from "filepond";

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
  watch: {
    value() {
      if (this.$props.value?.length === 0) {
        (this.$refs.filePond as any).removeFiles();
      }
    }
  },
  methods: {
    input(value: FilePondFile[]) {
      this.$emit("input", value);
    },
  },
});
</script>
