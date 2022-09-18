const openpgpAsync = () => import("@/openpgp-import");

export async function encrypt<T extends Uint8Array | ReadableStream<Uint8Array>>(stream: T, password: string | Uint8Array): Promise<T> {
  const {openpgp} = await openpgpAsync();
  // Encrypt with PGP
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ binary: stream }),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary',
  });
  return encrypted as T;
}

export async function decrypt(encrypted: Uint8Array, password: string | Uint8Array): Promise<Uint8Array> {
  const {openpgp} = await openpgpAsync();
  const plain = (await openpgp.decrypt({
    message: await openpgp.readMessage({ binaryMessage: encrypted }),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary'
  })).data;
  return plain as Uint8Array;
}

export async function decryptStream(encrypted: ReadableStream<Uint8Array>, password: string | Uint8Array): Promise<ReadableStream<Uint8Array>> {
  const {openpgp, toPolyfillReadableIfNeed, toNativeReadableIfNeed} = await openpgpAsync();
  const plain = (await openpgp.decrypt({
    message: await openpgp.readMessage({ binaryMessage: toPolyfillReadableIfNeed(encrypted) }),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary',
  })).data;
  return toNativeReadableIfNeed(plain as ReadableStream<Uint8Array>) as ReadableStream<Uint8Array>;
}
