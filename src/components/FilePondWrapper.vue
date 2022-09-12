<template>
  <file-pond :value="value"
             @input="input"
             :label-idle="labelIdle"
             :allow-multiple="true"
             :allow-paste="true"
  />
</template>

<script lang="ts">
import {Vue, Component, Emit, Prop,} from "vue-property-decorator";
import {type FilePondFile} from "filepond";
import * as filePond from "filepond";
const FilePond = () => import('vue-filepond').then(vueFilePond => vueFilePond.default());

(async () => require('filepond/dist/filepond.min.css'))();

@Component({
  components: {
    FilePond,
  }
})
export default class FilePondWrapper extends Vue {
  @Prop() public value!: FilePondFile[];
  @Emit() public input(value: FilePondFile[]) {}

  @Prop() public labelIdle!: string;

  created() {
    // Disable "Powered by PQINA" link
    filePond.setOptions({
      credits: false,
    });
  }
}
</script>
