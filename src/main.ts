import Vue from 'vue'
import App from '@/App.vue'
import '@/registerServiceWorker'
import vuetify from '@/plugins/vuetify';
// @ts-ignore
import AsyncComputed from 'vue-async-computed';
import {supportsSwDownload} from "@/sw-download";

// (from: https://github.com/FortAwesome/vue-fontawesome/tree/700a86cb1a3726364de7137d0cbee2e00fcfd30d#usage)
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'


library.add(faGithub);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;
Vue.use(AsyncComputed);

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app');

(async () => {
  console.log('Support streaming download:', await supportsSwDownload);
})();
