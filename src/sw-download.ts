// Check support for streaming-download via Service Worker
export const supportsSwDownload: Promise<boolean> = (async () => {
  // Safari is always unsupported
  if (typeof (window as any).safari !== 'undefined') {
    return false;
  }
  if (!("serviceWorker" in navigator)) {
    return false;
  }
  // Wait until Service Worker is active
  await navigator.serviceWorker.ready;
  for (let retryLimit = 3; retryLimit !== 0; retryLimit--) {
    // Sleep
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      // Check whether response can be received
      const res = await fetch('/sw-download-support/v2');
      // Success
      if (res.status === 200) {
        return await res.text() === 'OK';
      }
    } catch(err) {
      // Noop
      (() => {})();
    }
  }
  return false;
})();
