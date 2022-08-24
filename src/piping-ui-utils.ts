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
  const swDownload = await swDownloadAsync();
  // If supporting stream-download via Service Worker
  if (await swDownload.supportsSwDownload) {
    const utils = await utilsAsync();
    const res = await fetch(downloadUrl);
    const readableStream: ReadableStream<Uint8Array> = await (() => {
      if (key === undefined) {
        return res.body!;
      }
      return utils.decrypt(res.body!, key);
    })();
    // Enroll download ReadableStream
    const enrollDownloadRes: MessageEvent = await enrollDownloadReadableStream(readableStream);
    // Get download ID
    const {downloadId} = enrollDownloadRes.data;
    // Download via Service Worker
    const aTag = document.createElement('a');
    // NOTE: '/sw-download/v2' can be received by Service Worker in src/sw.js
    // NOTE: URL fragment is passed to Service Worker but not passed to Web server
    aTag.href = `/sw-download/v2#?id=${downloadId}&filename=${fileName}`;
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

// (base: https://googlechrome.github.io/samples/service-worker/post-message/)
export function enrollDownloadReadableStream(readableStream: ReadableStream): Promise<MessageEvent> {
  return new Promise((resolve, reject) => {
    if (!("serviceWorker" in navigator)) {
      reject(new Error("Service Worker not supported"));
      return;
    }
    if (navigator.serviceWorker.controller === null) {
      reject(new Error("navigator.serviceWorker.controller is null"));
      return;
    }
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = resolve;
    navigator.serviceWorker.controller.postMessage({
      type: 'enroll-download',
      readableStream,
    }, [messageChannel.port2, readableStream] as Transferable[]);
  });
}
