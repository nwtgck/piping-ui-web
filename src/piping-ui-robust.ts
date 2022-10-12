import urlJoin from "url-join";
import {AsyncSemaphore} from "@/utils/AsyncSemaphore";

async function send(serverUrl: string, path: string, data: AsyncIterator<Blob, void>): Promise<void> {
  let num = 1;
  const url = () => urlJoin(serverUrl, path, num+'');
  const semaphore = new AsyncSemaphore(2);
  while(true) {
    await semaphore.acquire();
    const bodyResult = await data.next();
    if (bodyResult.done) {
      break;
    }
    if (bodyResult.value.size === 0) {
      continue;
    }
    // no await
    ensureSend(url(), bodyResult.value).then(() => {
      semaphore.release();
    });
    num++;
  }
  // Notify finished
  await ensureSend(url(), new Uint8Array());
}

async function ensureSend(url: string, body: BodyInit) {
  while(true) {
    let timer;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => {
        console.debug('POST timeout: ', url);
        controller.abort();
      }, 60 * 1000);
      const res = await fetch(url, {
        method: 'POST',
        body: body,
        signal: controller.signal
      });
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

export async function sendReadableStream(serverUrl: string, path: string, stream: ReadableStream<Uint8Array>): Promise<void> {
  const reader = stream.getReader();
  const chunksByteSizeThreshold = 2 * 1048576; // 2MB
  const chunks: Uint8Array[] = [];
  let chunksByteSize = 0;
  const data = (async function* () {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      chunks.push(result.value);
      chunksByteSize += result.value.byteLength;
      if (chunksByteSize > chunksByteSizeThreshold) {
        yield new Blob(chunks);
        chunks.length = 0;
        chunksByteSize = 0;
      }
    }
    if (chunks.length !== 0) {
      yield new Blob(chunks);
    }
  })();
  await send(serverUrl, path, data);
}

async function* receive(serverUrl: string, path: string): AsyncIterableIterator<Uint8Array> {
  let num = 1;
  let done = false;
  const semaphore = new AsyncSemaphore(2);
  while(!done) {
    await semaphore.acquire();
    const url = urlJoin(serverUrl, path, num+'');
    yield ensureReceive(url).then((chunk: ArrayBuffer | 'done') => {
      semaphore.release();
      if (chunk === 'done') {
        done = true;
        return new Uint8Array();
      }
      return new Uint8Array(chunk);
    });
    num++;
  }
  // TODO: cancel requests
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

export function receiveReadableStream(serverUrl: string, path: string): ReadableStream<Uint8Array> {
  const iter = receive(serverUrl, path);
  return new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      const result = await iter.next();
      if (result.done) {
        ctrl.close();
        return;
      }
      ctrl.enqueue(result.value);
    },
  });
}
