// (from: https://vuetifyjs.com/ja/customization/icons#installing-iconfonts)
import '@mdi/font/css/materialdesignicons.css'

// (from: https://vuetifyjs.com/en/framework/icons#icons)
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import vuetify from './plugins/vuetify';

// (from: https://e-joint.jp/474/)
import '@fortawesome/fontawesome';
import '@fortawesome/fontawesome-free-solid';
import '@fortawesome/fontawesome-free-regular';
import '@fortawesome/fontawesome-free-brands';

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app');
