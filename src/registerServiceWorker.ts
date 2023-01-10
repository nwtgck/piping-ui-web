import { register } from 'register-service-worker';
const swDownloadAsync = () => import("@/sw-download");

register(`${process.env.BASE_URL}service-worker.js`, {
  ready () {
    console.log('Service worker is ready.');
  },
  async registered () {
    console.log('Service worker has been registered.');
    // NOTE: Timing to load and evaluate supportsSwDownload is important because the support flag is cached.
    await swDownloadAsync();
  },
  cached () {
    console.log('Content has been cached for offline use.')
  },
  updatefound () {
    console.log('New content is downloading.')
  },
  updated (registration) {
    console.log('New content is available; please refresh.')
  },
  offline () {
    console.log('No internet connection found. App is running in offline mode.')
  },
  error (error) {
    console.error('Error during service worker registration:', error)
  }
});
