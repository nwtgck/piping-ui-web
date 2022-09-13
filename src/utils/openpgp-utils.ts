const openpgpAsync = () => import("@/openpgp-import");

export async function encrypt<T extends Uint8Array | ReadableStream<Uint8Array>>(stream: T, password: string | Uint8Array): Promise<T> {
  const {openpgpWithWorker} = await openpgpAsync();
  const openpgp = await openpgpWithWorker;
  // Encrypt with PGP
  const encryptResult = await openpgp.encrypt({
    message: openpgp.message.fromBinary(stream),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    armor: false
  });
  // Get encrypted
  const encrypted: T = encryptResult.message.packets.write();
  return encrypted;
}

export async function decrypt(encrypted: Uint8Array, password: string | Uint8Array): Promise<Uint8Array> {
  const {openpgpWithWorker} = await openpgpAsync();
  const openpgp = await openpgpWithWorker;
  const plain = (await openpgp.decrypt({
    message: await openpgp.message.read(encrypted),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary'
  })).data;
  return plain;
}

export async function decryptStream(encrypted: ReadableStream<Uint8Array>, password: string | Uint8Array): Promise<ReadableStream<Uint8Array>> {
  const {openpgpWithWorker, toPolyfillReadableIfNeed, toNativeReadableIfNeed} = await openpgpAsync();
  const openpgp = await openpgpWithWorker;
  const plain = (await openpgp.decrypt({
    message: await openpgp.message.read(toPolyfillReadableIfNeed(encrypted)),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary',
  })).data;
  return toNativeReadableIfNeed(plain) as ReadableStream<Uint8Array>;
}
