// Check support for streaming-download via Service Worker
export const supportsSwDownload: Promise<boolean> = (async () => {
  // Safari is always unsupported
  if (typeof (window as any).safari !== 'undefined') {
    return false;
  }
  let res: Response | undefined;
  for (let retryLimit = 3; retryLimit !== 0; retryLimit--) {
    try {
      // Check whether response can be received
      res = await fetch('/sw-download-support');
    } catch(err) {
      // Noop
      (() => {})();
    }
    // Success
    if (res !== undefined && res.status === 200) {
      return await res.text() === 'OK';
    }
    // Sleep
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
})();
