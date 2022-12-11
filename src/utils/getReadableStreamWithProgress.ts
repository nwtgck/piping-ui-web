export function getReadableStreamWithProgress(baseStream: ReadableStream<Uint8Array>, onRead: (n: number) => void): ReadableStream<Uint8Array> {
  const reader = baseStream.getReader();
  return new ReadableStream({
    async pull(ctrl) {
      const result = await reader.read();
      if (result.done) {
        ctrl.close();
        return;
      }
      ctrl.enqueue(result.value);
      onRead(result.value.byteLength);
    }
  });
}
