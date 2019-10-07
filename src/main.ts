import Vue from 'vue'
import App from '@/App.vue'
import '@/registerServiceWorker'
import vuetify from '@/plugins/vuetify';
// @ts-ignore
import AsyncComputed from 'vue-async-computed';

// (from: https://e-joint.jp/474/)
import '@fortawesome/fontawesome';
import '@fortawesome/fontawesome-free-brands';
import {supportsSwDownload} from "@/sw-download";

Vue.config.productionTip = false;
Vue.use(AsyncComputed);

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app');

(async () => {
  console.log('Support streaming download:', await supportsSwDownload);
})();
