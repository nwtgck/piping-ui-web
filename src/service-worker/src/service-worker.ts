// (from: https://dev.to/wtho/custom-service-worker-logic-in-typescript-on-vite-4f27)
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

// Generate random string with specific length
function generateRandomString(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomArr = crypto.getRandomValues(new Uint32Array(len));
  return [...randomArr].map(n => chars.charAt(n % chars.length)).join('');
}

type SwDownload = {
  headers: [string, string][],
  readableStream: ReadableStream,
};

const idToSwDownload: Map<string, SwDownload> = new Map();

// Generate unique sw-download ID
function generateUniqueSwDownloadId(): string {
  // eslint-disable-next-line no-constant-condition
  while(true) {
    const id = generateRandomString(128);
    if (!idToSwDownload.has(id)) {
      return id;
    }
  }
}

function isHeaders(arg: unknown): arg is [string, string][] {
  return Array.isArray(arg) && arg.every(e => Array.isArray(e) && e.length === 2 && typeof e[0] === "string" && typeof e[1] === "string");
}

sw.addEventListener('activate', (e: ExtendableEvent) => {
  // Activate Service Worker's "fetch" without user reload at the first time
  // (from: https://stackoverflow.com/a/41224941)
  e.waitUntil(sw.clients.claim());
});

// This is the code piece that GenerateSW mode can't provide for us.
// This code listens for the user's confirmation to update the app.
sw.addEventListener('message', (e: ExtendableMessageEvent) => {
  if (!e.data) {
    return;
  }

  switch(e.data.type) {
    case 'skip-waiting':
      sw.skipWaiting();
      break;
    case 'enroll-download': {
      const {headers, readableStream} = e.data;
      if (!isHeaders(headers)) {
        console.error('data.headers is invalid');
        return;
      }
      if (!(readableStream instanceof ReadableStream)) {
        console.error('data.readableStream is not ReadableStream');
        return;
      }
      // Generate unique ID
      const id = generateUniqueSwDownloadId();
      // Enroll info with the ID
      idToSwDownload.set(id, {
        headers,
        readableStream,
      });
      e.ports[0].postMessage({
        swDownloadId: id,
      });
      break;
    }
    case 'enroll-download-with-channel': {
      const {headers} = e.data;
      if (!isHeaders(headers)) {
        console.error('data.headers is invalid');
        return;
      }
      // Create ReadableStream from chunks over the channel
      const readableStream = new ReadableStream({
        start(ctrl) {
          e.ports[0].onmessage = (ev) => {
            if (ev.data.done) {
              ctrl.close();
              return;
            }
            ctrl.enqueue(ev.data.value);
          };
        }
      });
      // Generate unique ID
      const id = generateUniqueSwDownloadId();
      // Enroll info with the ID
      idToSwDownload.set(id, {
        headers,
        readableStream,
      });
      e.ports[0].postMessage({
        swDownloadId: id,
      });
      break;
    }
    default:
      // NOOP
      break;
  }
});

// Support for stream download
sw.addEventListener('fetch', (event: FetchEvent) => {
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
    // Get sw-download ID
    const id = fragmentQuery.get("id");
    if (id === null) {
      console.error("id not found", url);
      return;
    }
    const swDownload = idToSwDownload.get(id);
    if (swDownload === undefined) {
      console.error(`download ID ${id} not found`);
      return;
    }
    idToSwDownload.delete(id);
    const headers = new Headers(swDownload.headers);
    event.respondWith(new Response(swDownload.readableStream, {
      headers,
    }));
  }
});
