// (from: https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)

// Backup the native ReadableStream because OpenPGP.js might modify it on Firefox
const NativeReadableStream = ReadableStream;
importScripts('openpgp/openpgp.min.js');
import {createReadableStreamWrapper} from '@mattiasbuelens/web-streams-adapter';


/**
 * Convert a native ReadableStream to polyfill ReadableStream if ReadableStream class is polyfill.
 *
 * @param readableStream Native ReadableStream
 * @returns {*}
 */
function toPolyfillReadableIfNeed(readableStream) {
  // If not polyfilled
  if (NativeReadableStream === ReadableStream) {
    return readableStream;
  // If ReadableStream is polyfill
  } else {
    // (base: https://github.com/MattiasBuelens/web-streams-adapter/tree/d76e3789d67b1ab3c91699ecc0c42bde897d2298)
    // NOTE: ReadableStream is polyfill ReadableStream in this condition
    const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);
    // Convert a native ReadableStream to polyfill ReadableStream
    return toPolyfillReadable(readableStream);
  }
}

/**
 * Convert a polyfill ReadableStream to native ReadableStream if ReadableStream class is polyfill.
 *
 * @param readableStream Native ReadableStream or polyfill ReadableStream
 * @returns {*}
 */
function toNativeReadableIfNeed(readableStream) {
  // If not polyfilled
  if (NativeReadableStream === ReadableStream) {
    return readableStream;
    // If ReadableStream is polyfill
  } else {
    // (base: https://github.com/MattiasBuelens/web-streams-adapter/tree/d76e3789d67b1ab3c91699ecc0c42bde897d2298)
    const toNativeReadable = createReadableStreamWrapper(NativeReadableStream);
    // Convert a polyfill ReadableStream to native ReadableStream
    return toNativeReadable(readableStream);
  }
}

// Generate random string with specific length
function generateRandomString(len){
  const alphas  = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const chars   = [...alphas, ...numbers];

  const randomArr = crypto.getRandomValues(new Uint32Array(len));
  return [...randomArr].map(n => chars[n % chars.length]).join('');
}

// ID => download-info
const idToDownloadInfo = {};

// Generate unique download-info ID
function generateUniqueDownloadInfoId() {
  // eslint-disable-next-line no-constant-condition
  while(true) {
    const downloadInfoId = generateRandomString(128);
    if (!(downloadInfoId in idToDownloadInfo)) {
      return downloadInfoId;
    }
  }
}

// (from: https://gist.github.com/borismus/1032746#gistcomment-1493026)
function base64ToUint8Array(base64Str) {
  const raw = atob(base64Str);
  return Uint8Array.from(Array.prototype.map.call(raw, (x) => {
    return x.charCodeAt(0);
  }));
}

// This is the code piece that GenerateSW mode can't provide for us.
// This code listens for the user's confirmation to update the app.
self.addEventListener('message', (e) => {
  if (!e.data) {
    return;
  }

  switch(e.data.type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;
    case 'enroll-download-info': {
      // Get download info
      const downloadInfo = e.data.downloadInfo;
      if (!("url" in downloadInfo)) {
        console.error('downloadInfo.url is missing');
        return;
      }
      if (!("filename" in downloadInfo)) {
        console.error('downloadInfo.filename is missing');
        return;
      }
      if (!("protection" in downloadInfo)) {
        console.error('downloadInfo.protection is missing');
        return;
      }
      if (!("type" in downloadInfo.protection)) {
        console.error('downloadInfo.protection.type is missing');
        return;
      }
      if (!("decryptErrorMessage" in downloadInfo)) {
        console.error('downloadInfo.decryptErrorMessage is missing');
        return;
      }
      // Generate unique ID
      const id = generateUniqueDownloadInfoId();
      // Enroll info with the ID
      idToDownloadInfo[id] = downloadInfo;
      e.ports[0].postMessage({
        downloadInfoId: id,
      });
      break;
    }
    default:
      // NOOP
      break;
  }
});

// Support for stream download
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/sw-download-support') {
    // Return "OK"
    event.respondWith(new Response(
      new NativeReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([79, 75]));
          controller.close();
        }
      })
    ));
  } else if (url.pathname === '/sw-download') {
    // Get download-info ID
    const downloadInfoId = decodeURIComponent(url.hash.substring(1));

    if (!(downloadInfoId in idToDownloadInfo)) {
      console.error(`download-info ID ${downloadInfoId} not found`);
      return;
    }

    // Get download info
    const downloadInfo = idToDownloadInfo[downloadInfoId];
    // Delete the entry
    delete idToDownloadInfo[downloadInfoId];

    const targetUrl = downloadInfo.url;
    let filename = downloadInfo.filename;
    const protection = downloadInfo.protection;
    const decryptErrorMessage = downloadInfo.decryptErrorMessage;

    const password = (() => {
      switch (protection.type) {
        case "raw":
          return undefined;
        case "string":
          return protection.key;
        case "uint8array":
          return base64ToUint8Array(protection.key);
        default:
          console.error(`Unexpected protection.type: ${protection.type}`);
          return undefined;
      }
    })();

    event.respondWith((async () => {
      const res = await fetch(targetUrl);
      const headers = new Headers([...res.headers.entries()]);
      // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
      // Make filename RFC5987 compatible
      filename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
      headers.set('Content-Disposition', "attachment; filename*=UTF-8''" + filename);
      // Plain ReadableStream
      let plainStream = res.body;
      // If encrypted
      if (password !== undefined) {
        try {
          // Allow unauthenticated stream
          // (see: https://github.com/openpgpjs/openpgpjs/releases/tag/v4.0.0)
          openpgp.config.allow_unauthenticated_stream = true;
          // Decrypt the response body
          const decrypted = await openpgp.decrypt({
            message: await openpgp.message.read(toPolyfillReadableIfNeed(res.body)),
            passwords: [password],
            format: 'binary'
          });
          plainStream = decrypted.data;
        } catch (err) {
          // Show "Password might be wrong" message
          // This message should be displayed in browser
          return new Response(decryptErrorMessage, {
            status: 400,
          });
        }
      }

      const downloadableRes = new Response(toNativeReadableIfNeed(plainStream), {
        headers
      });
      return downloadableRes;
    })());
  }
});

workbox.core.clientsClaim();

// The precaching code provided by Workbox.
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
