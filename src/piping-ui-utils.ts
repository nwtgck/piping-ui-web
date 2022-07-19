const FileSaverAsync = () => import('file-saver');
const binconvAsync = () => import('binconv');
const swDownloadAsync = () => import("@/sw-download");
const utilsAsync = () => import("@/utils");
import {appBarPromise} from "@/app-bar-promise";

// Decrypt & Download
export async function decryptingDownload(
  {downloadUrl, fileName, key, decryptErrorMessage}:
  {downloadUrl: string, fileName: string, key: string | Uint8Array | undefined, decryptErrorMessage: string}
) {
  type Protection = {type: 'raw'} | {type: 'string', key: string} | {type: 'uint8array', key: string};

  const swDownload = await swDownloadAsync();
  // If supporting stream-download via Service Worker
  if (await swDownload.supportsSwDownload) {
    const binconv = await binconvAsync();
    const protection: Protection = (() => {
      if (key === undefined) {
        return {type: 'raw'} as const;
      } else if (typeof key === 'string') {
        return {type: 'string', key: key} as const;
      } else {
        return {
          type: 'uint8array',
          key: binconv.uint8ArrayToBase64(key),
        } as const;
      }
    })();

    const utils = await utilsAsync();
    // Create download info to tell to Service Worker
    const downloadInfo = {
      url: downloadUrl,
      filename: fileName,
      protection,
      decryptErrorMessage: decryptErrorMessage,
    };
    // Enroll download-info
    const enrollDownloadInfoRes: MessageEvent = await utils.sendToServiceWorker({
      type: 'enroll-download-info',
      downloadInfo,
    });
    // Get download-info ID
    const {downloadInfoId} = enrollDownloadInfoRes.data;
    // Download via Service Worker
    const aTag = document.createElement('a');
    // NOTE: '/sw-download' can be received by Service Worker in src/sw.js
    // NOTE: URL fragment is passed to Service Worker but not passed to Web server
    aTag.href = `/sw-download#${downloadInfoId}`;
    aTag.target = "_blank";
    aTag.click();
  } else {
    const binconv = await binconvAsync();
    // If password-protection is disabled
    if (key === undefined) {
      // Download or show on browser sometimes
      const aTag = document.createElement('a');
      aTag.href = downloadUrl;
      aTag.target = "_blank";
      aTag.download = fileName;
      aTag.click();
    } else {
      // Get response
      const res = await fetch(downloadUrl);
      const resBody = await binconv.blobToUint8Array(await res.blob());
      // Decrypt the response body
      const plain = await (await utilsAsync()).decrypt(resBody, key);
      // Save
      const FileSaver = await FileSaverAsync();
      FileSaver.saveAs(binconv.uint8ArrayToBlob(plain), fileName);
    }
  }
}


/**
 * Scroll to the specific element considering the app bar
 * @param element
 */
export async function scrollTo(element: Element): Promise<void> {
  const appBar = await appBarPromise;
  const moveTop = element.getBoundingClientRect().y - appBar.clientHeight;
  window.scrollBy({ top: moveTop, left: 0, behavior: 'smooth' });
}
