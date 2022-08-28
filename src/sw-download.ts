/* eslint-disable no-console */

let _supportsSwDownload: boolean = false;
export function supportsSwDownload(): boolean {
  return _supportsSwDownload;
}

// Check support for streaming-download via Service Worker
(async () => {
  if (!("serviceWorker" in navigator)) {
    return false;
  }
  // Wait until Service Worker is active
  await navigator.serviceWorker.ready;
  for (let retryLimit = 5; retryLimit !== 0; retryLimit--) {
    // Sleep
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      // Check whether response can be received
      const res = await fetch('/sw-download-support/v2');
      // Success
      if (res.status === 200) {
        _supportsSwDownload = await res.text() === 'OK';
        console.log('Support streaming download:', _supportsSwDownload);
        return;
      }
    } catch(err) {
      // Noop
      (() => {})();
    }
  }
  return false;
})();
