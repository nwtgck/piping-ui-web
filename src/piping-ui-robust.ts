import urlJoin from "url-join";

function sleep(millis: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, millis));
}

export async function send(serverUrl: string, path: string, data: AsyncIterator<string | Uint8Array | Blob, void>): Promise<void> {
  let num = 1;
  while(true) {
    const body = await data.next();
    if (body.done) {
      break;
    }
    while(true) {
      const url = urlJoin(serverUrl, path, num+'');
      let timer;
      try {
        const controller = new AbortController();
        timer = setTimeout(() => {
          console.debug('POST timeout: ', url);
          controller.abort();
        }, 60 * 1000);
        const res = await fetch(url, {
          method: 'POST',
          body: body.value,
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
        await sleep(100);
      }
    }
    num++;
  }
}

export async function sendReadableStream(serverUrl: string, path: string, stream: ReadableStream<Uint8Array>): Promise<void> {
  const reader = stream.getReader();
  const chunkMaxSize = 16;
  const chunks: Uint8Array[] = [];
  const data = (async function* () {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      chunks.push(result.value);
      if (chunks.length == chunkMaxSize) {
        yield new Blob(chunks);
        chunks.length = 0;
      }
    }
    yield new Blob(chunks);
  })();
  await send(serverUrl, path, data);
}

export async function* receive(serverUrl: string, path: string): AsyncIterableIterator<Uint8Array> {
  let num = 1;
  while(true) {
    let chunk: ArrayBuffer;
    while(true) {
      const url = urlJoin(serverUrl, path, num+'');
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
        chunk = await res.arrayBuffer();
        break;
      } catch (err) {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        await sleep(100);
      }
    }
    yield new Uint8Array(chunk);
    num++;
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
