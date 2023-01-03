import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import {enableDarkTheme} from "@/states/enableDarkTheme";

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg',
  },
  theme: {
    dark: enableDarkTheme.value,
  },
});
