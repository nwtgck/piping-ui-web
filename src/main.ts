import Vue, {defineAsyncComponent} from 'vue'
import App from '@/App.vue'
import '@/registerServiceWorker'
import vuetify from '@/plugins/vuetify';
import metaDescription from "@/meta-description.json";
import constants from '@/constants';


(() => {
  const lang = new URLSearchParams(window.location.search).get(constants.langQueryParameterName);
  if (lang !== null) {
    const html = document.getElementsByTagName('html');
    // Set <html lang>
    html.item(0)!.lang = lang;

    // Get <meta name="description" content="...">
    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    // Modify "content" dynamically
    meta.content = (() => {
      switch (lang) {
        case "en":
        case "ja":
          return metaDescription[lang];
        default:
          return "";
      }
    })();
  }
})();

// Apply smooth scroll polyfill for window.scrollOoo
// NOTE: Import asynchronously because user's action should be lazy, even if not lazy, the problem is only in animation, not logic.
import('smoothscroll-polyfill').then(smoothscroll => smoothscroll.polyfill());

Vue.component('font-awesome-icon', defineAsyncComponent(async () => {
  // (base: https://github.com/FortAwesome/vue-fontawesome/tree/700a86cb1a3726364de7137d0cbee2e00fcfd30d#usage)
  const [{ library }, { faGithub }, {FontAwesomeIcon}] = await Promise.all([
    import('@fortawesome/fontawesome-svg-core'),
    import('@fortawesome/free-brands-svg-icons'),
    import('@fortawesome/vue-fontawesome'),
  ]);
  library.add(faGithub);
  return FontAwesomeIcon;
}));
Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app');
