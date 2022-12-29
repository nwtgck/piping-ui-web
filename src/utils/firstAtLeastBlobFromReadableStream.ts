export async function firstAtLeastBlobFromReadableStream(stream: ReadableStream<Uint8Array>, size: number): Promise<Blob> {
  const reader = stream.getReader();
  let totalBytes = 0;
  const bytes: Uint8Array[] = [];
  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    bytes.push(result.value);
    totalBytes += result.value.byteLength;
    if (totalBytes >= size) {
      break;
    }
  }
  reader.releaseLock();
  return new Blob(bytes);
}
