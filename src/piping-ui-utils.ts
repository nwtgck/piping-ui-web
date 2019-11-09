const FileSaverAsync = () => import('file-saver');
const binconvAsync = () => import('binconv');
const swDownloadAsync = () => import("@/sw-download");
const utilsAsync = () => import("@/utils");

// Decrypt & Download
export async function decryptingDownload(
  {downloadUrl, fileName, enablePasswordProtection, password, decryptErrorMessage}:
  {downloadUrl: string, fileName: string, enablePasswordProtection: boolean, password: string, decryptErrorMessage: string}
) {
  const swDownload = await swDownloadAsync();
  // If supporting stream-download via Service Worker
  if (await swDownload.supportsSwDownload) {
    // Create download info to tell to Service Worker
    const downloadInfo = {
      url: downloadUrl,
      filename: fileName,
      password: enablePasswordProtection ? password : '',
      decryptErrorMessage: decryptErrorMessage,
    };
    // Download via Service Worker
    const aTag = document.createElement('a');
    // NOTE: '/sw-download' can be received by Service Worker in src/sw.js
    // NOTE: URL fragment is passed to Service Worker but not passed to Web server
    aTag.href = `/sw-download#${encodeURIComponent(JSON.stringify(downloadInfo))}`;
    aTag.target = "_blank";
    aTag.click();
  } else {
    const binconv = await binconvAsync();
    // If password-protection is disabled
    if (enablePasswordProtection) {
      // Get response
      const res = await fetch(downloadUrl);
      const resBody = await binconv.blobToUint8Array(await res.blob());
      // Decrypt the response body
      const plain = await (await utilsAsync()).decrypt(resBody, password);
      // Save
      const FileSaver = await FileSaverAsync();
      FileSaver.saveAs(binconv.uint8ArrayToBlob(plain), fileName);
    } else {
      // Download or show on browser sometimes
      const aTag = document.createElement('a');
      aTag.href = downloadUrl;
      aTag.target = "_blank";
      aTag.download = fileName;
      aTag.click();
    }
  }
}
