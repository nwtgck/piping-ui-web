export function getReadableStreamWithProgress(baseStream: ReadableStream<Uint8Array>, onRead: (n: number) => void): {stream: ReadableStream<Uint8Array>, cancel: () => void} {
  const reader = baseStream.getReader();
  const stream = new ReadableStream({
    async pull(ctrl) {
      const result = await reader.read();
      if (result.done) {
        ctrl.close();
        return;
      }
      ctrl.enqueue(result.value);
      onRead(result.value.byteLength);
    },
  });
  return {
    stream,
    // TODO: locked stream could not be canceled. find better way
    async cancel() {
      await reader.cancel();
    },
  }
}
