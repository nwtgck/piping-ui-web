// Check support for streaming-download via Service Worker
export const supportsSwDownload: Promise<boolean> = (async () => {
  try {
    const res = await fetch('/sw-download-support');
    return await res.text() === 'OK';
  } catch {
    return false;
  }
})();
