<template>
  <v-layout>
    <v-flex xs12 sm8 offset-sm2 offset-md3 md6>
      <v-card style="padding: 1em;">

        <v-btn-toggle v-model="sendOrGet" mandatory style="margin-bottom: 2em;">
          <v-btn text value="send">
            Send
            <v-icon right dark>file_upload</v-icon>
          </v-btn>
          <v-btn text value="get">
            Get
            <v-icon right dark>file_download</v-icon>
          </v-btn>
        </v-btn-toggle>

        <file-pond v-if="sendOrGet === 'send'"
                   ref="pond"
                   label-idle="<img src='img/file-icon.svg' style='width: 2em'><br>Drop a file here or <span class='filepond--label-action'>Browse</span>"
                   allow-multiple="false"
                   maxFiles="1"
        />
        <v-text-field label="Server URL"
                      v-model="serverUrl"
        />
        <v-text-field label="Secret path"
                      v-model="secretPath"
                      placeholder="e.g. mypath374"
        />

        <v-btn v-if="sendOrGet === 'send'"
               color="primary"
               v-on:click="send()"
               block>
          Send
          <v-icon right dark>file_upload</v-icon>
        </v-btn>
        <v-btn v-if="sendOrGet === 'get'"
               color="secondary"
               v-on:click="get()"
               block>
          Get
          <v-icon right dark>file_download</v-icon>
        </v-btn>

<!--        <v-progress-linear-->
<!--                v-show="progressSetting.show"-->
<!--                :indeterminate="progressSetting.indeterminate"-->
<!--                :value="progressSetting.percentage"-->
<!--        />-->
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';

// Create component
const FilePond = vueFilePond();

@Component({
  components: {
    FilePond,
  },
})
export default class PipingUI extends Vue {
  private sendOrGet: 'send' | 'get' = 'send';
  // TODO: Hard code
  private serverUrl: string = 'https://ppng.ml';
  private secretPath: string = "";

  // TODO: impl
  private send() {
    console.log('todo impl');
  }

  // TODO: impl
  private get() {
    console.log('todo impl');
  }
}
</script>
