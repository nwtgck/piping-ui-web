import urlJoin from "url-join";
import {AsyncSemaphore} from "@/utils/AsyncSemaphore";

const N_TRANSFERS = 2;
const CHUNKS_BYTE_SIZE_THRESHOLD = 1048576; // 1MB

async function send(serverUrl: string, path: string, data: AsyncIterator<ReadableStream<Uint8Array>, void>): Promise<void> {
  let num = 1;
  const url = () => urlJoin(serverUrl, path, num+'');
  const semaphore = new AsyncSemaphore(N_TRANSFERS);
  while(true) {
    await semaphore.acquire();
    const bodyResult = await data.next();
    if (bodyResult.done) {
      break;
    }
    // TODO: should not send 0-byte ReadableStream because 0-byte means done. how to know its length? but not critical issue because send everything.
    // no await
    ensureSend(url(), bodyResult.value).then(() => {
      semaphore.release();
    });
    num++;
  }
  // Notify finished
  await ensureSend(url(), new Uint8Array());
}

async function ensureSend(url: string, body: Uint8Array | ReadableStream<Uint8Array>) {
  while(true) {
    let timer;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => {
        console.debug('POST timeout: ', url);
        controller.abort();
      }, 60 * 1000);
      // TODO: support resend ReadableStream
      // TODO: support for fetch-upload-streaming-not-supported browsers
      console.log('sending', url);
      const res = await fetch(url, {
        method: 'POST',
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

export async function sendReadableStream(serverUrl: string, path: string, stream: ReadableStream<Uint8Array>): Promise<void> {
  const data = chunkReadableStream(stream, CHUNKS_BYTE_SIZE_THRESHOLD);
  await send(serverUrl, path, data);
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
      if (res.headers.get('content-length') === '0') {
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
