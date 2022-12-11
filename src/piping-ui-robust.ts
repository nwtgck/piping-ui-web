import urlJoin from "url-join";
import {AsyncSemaphore} from "@/utils/AsyncSemaphore";

// FIXME: Setting N_TRANSFERS = 2 causes "net::ERR_HTTP2_PROTOCOL_ERROR 200" in Chrome Stable 108, but Piping UI Robust recovers and keep transferring.
const N_TRANSFERS = 1;
const CHUNKS_BYTE_SIZE_THRESHOLD = 1048576; // 1MB
const FINISH_CONTENT_TYPE = 'application/x-piping-finish';

async function send(serverUrl: string, path: string, data: AsyncIterator<ReadableStream<Uint8Array>, void>, options: SendOptions | undefined): Promise<void> {
  let num = 1;
  const url = () => urlJoin(serverUrl, path, num+'');
  const semaphore = new AsyncSemaphore(N_TRANSFERS);
  while(true) {
    await semaphore.acquire();
    const bodyResult = await data.next();
    if (bodyResult.done) {
      break;
    }
    // no await
    ensureSend(url(), bodyResult.value, undefined, options).then(() => {
      semaphore.release();
    });
    num++;
  }
  // Notify finished
  await ensureSend(url(), new Uint8Array(), {
    'Content-Type': FINISH_CONTENT_TYPE,
  }, options);
}
function makeReusableReadableStream<T>(stream: ReadableStream<T>): () => ReadableStream<T> {
  let backupStream: ReadableStream<T> = stream;
  return () => {
    let mainStream: ReadableStream<T>;
    // NOTE: backupStream never blocks mainStream.
    // MDN says:
    // > If only one branch is consumed, then the entire body will be enqueued in memory. Therefore, you should not use the built-in tee() to read very large streams in parallel at different speeds.
    [mainStream, backupStream] = backupStream.tee();
    return mainStream;
  };
}

async function ensureSend(url: string, body: Uint8Array | ReadableStream<Uint8Array>, headers: HeadersInit | undefined, options: SendOptions | undefined) {
  const makeBody: () => Uint8Array | Blob | ReadableStream<Uint8Array> = await (async () => {
    if (body instanceof ReadableStream) {
      if (options?.fetchUploadStreamingSupported === true) {
        return makeReusableReadableStream(body);
      }
      const blob = await new Response(body).blob();
      return () => blob;
    }
    return () => body;
  })();
  while(true) {
    let timer;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => {
        console.debug('POST timeout: ', url);
        controller.abort();
      }, 60 * 1000);
      const body = makeBody();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: body,
        // TODO: not always?
        duplex: 'half',
        signal: controller.signal
      } as RequestInit);
      clearTimeout(timer);
      if (res.status !== 200) {
        throw new Error(`status ${res.status}`);
      }
      await res.text();
      break;
    } catch (err) {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function* chunkReadableStream(stream: ReadableStream<Uint8Array>, chunkSizeThreshold: number): AsyncGenerator<ReadableStream<Uint8Array>, void> {
  const lock = new AsyncSemaphore(1);
  const reader = stream.getReader();
  let done: boolean = false;
  while (!done) {
    await lock.acquire();
    let chunkByteSize = 0;
    yield new ReadableStream<Uint8Array>({
      async pull(ctrl) {
        const result = await reader.read();
        if (result.done) {
          done = true;
          ctrl.close();
          lock.release();
          return;
        }
        chunkByteSize += result.value.byteLength;
        ctrl.enqueue(result.value);
        if (chunkByteSize > chunkSizeThreshold) {
          ctrl.close();
          lock.release();
          return;
        }
      },
    });
  }
}

type SendOptions = { fetchUploadStreamingSupported: boolean };

export async function sendReadableStream(serverUrl: string, path: string, stream: ReadableStream<Uint8Array>, options?: SendOptions): Promise<void> {
  const data = chunkReadableStream(stream, CHUNKS_BYTE_SIZE_THRESHOLD);
  await send(serverUrl, path, data, options);
}

export function receiveReadableStream(serverUrl: string, path: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(ctrl) {
      let num = 1;
      let done = false;
      let lastPromise = Promise.resolve();
      const semaphore = new AsyncSemaphore(N_TRANSFERS);
      while(!done) {
        await semaphore.acquire();
        const url = urlJoin(serverUrl, path, num+'');
        const chunkPromise = ensureReceive(url);
        lastPromise = lastPromise
          .then(() => chunkPromise)
          .then((chunk: ArrayBuffer | 'done') => {
            semaphore.release();
            if (chunk === 'done') {
              done = true;
              ctrl.close();
              return;
            }
            ctrl.enqueue(new Uint8Array(chunk));
          });
        num++;
      }
      // TODO: cancel requests
    },
  });
}

async function ensureReceive(url: string): Promise<ArrayBuffer | 'done'> {
  while(true) {
    let timer;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => {
        console.debug('GET timeout: ', url);
        controller.abort();
      }, 60 * 1000);
      const res = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status !== 200) {
        throw new Error(`status ${res.status}`);
      }
      if (res.headers.get('content-type')?.toLowerCase() === FINISH_CONTENT_TYPE) {
        return 'done';
      }
      return await res.arrayBuffer();
    } catch (err) {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
