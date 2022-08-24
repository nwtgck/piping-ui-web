/// <reference lib="webworker" />
// (from: https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)

// export empty type because of tsc --isolatedModules flag
// (from: https://www.devextent.com/create-service-worker-typescript/)
export type {};
declare const self: ServiceWorkerGlobalScope;

// Generate random string with specific length
function generateRandomString(len: number): string {
  const alphas  = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const chars   = [...alphas, ...numbers];

  const randomArr = crypto.getRandomValues(new Uint32Array(len));
  return [...randomArr].map(n => chars[n % chars.length]).join('');
}

const idToReadableStream: Map<string, ReadableStream> = new Map();

// Generate unique download ID
function generateUniqueDownloadId(): string {
  // eslint-disable-next-line no-constant-condition
  while(true) {
    const downloadInfoId = generateRandomString(128);
    if (!idToReadableStream.has(downloadInfoId)) {
      return downloadInfoId;
    }
  }
}

// This is the code piece that GenerateSW mode can't provide for us.
// This code listens for the user's confirmation to update the app.
self.addEventListener('message', (e: ExtendableMessageEvent) => {
  if (!e.data) {
    return;
  }

  switch(e.data.type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;
    case 'enroll-download': {
      const readableStream = e.data.readableStream;
      if (!(readableStream instanceof ReadableStream)) {
        console.error('data.readableStream is not ReadableStream');
        return;
      }
      // Generate unique ID
      const id = generateUniqueDownloadId();
      // Enroll info with the ID
      idToReadableStream.set(id, readableStream);
      e.ports[0].postMessage({
        downloadId: id,
      });
      break;
    }
    default:
      // NOOP
      break;
  }
});

// Support for stream download
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/sw-download-support/v2') {
    // Return "OK"
    event.respondWith(new Response(
      new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
          controller.enqueue(new Uint8Array([79, 75]));
          controller.close();
        }
      })
    ));
  } else if (url.pathname === '/sw-download/v2') {
    const fragmentQuery = new URL(`a://a${url.hash.substring(1)}`).searchParams;
    // Get download ID
    const id = fragmentQuery.get("id");
    if (id === null) {
      console.error("id not found", url);
      return;
    }
    const filename = fragmentQuery.get("filename");
    if (filename === null) {
      console.error("filename not found", url);
      return;
    }
    const readableStream = idToReadableStream.get(id);
    if (readableStream === undefined) {
      console.error(`download ID ${id} not found`);
      return;
    }
    idToReadableStream.delete(id);

    // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
    // Make filename RFC5987 compatible
    const escapedFilename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
    const headers = new Headers([
      ['Content-Disposition', "attachment; filename*=UTF-8''" + escapedFilename],
    ]);
    event.respondWith(new Response(readableStream, {
      headers,
    }));
  }
});

workbox.core.clientsClaim();

// The precaching code provided by Workbox.
(self as any).__precacheManifest = [].concat((self as any).__precacheManifest || []);
workbox.precaching.precacheAndRoute((self as any).__precacheManifest, {});
