// No need to back up native ReadableStream
// > The web-streams-polyfill and web-streams-adapter libraries are only loaded when streaming is used, and only if TransformStreams aren't natively supported
// ref: https://github.com/openpgpjs/openpgpjs/releases/tag/v5.0.0

// OLD: Back up the native ReadableStream because OpenPGP.js modifies it on Firefox ESR 91 in OpenPGP.js 4.10.10. In the latest Firefox, it is not modified.

import {
  encrypt as openpgpEncrypt,
  decrypt as openpgpDecrypt,
  createMessage as openpgpCreateMessage,
  readMessage as  openpgpReadMessage,
} from "openpgp/lightweight";

export async function encrypt<T extends Uint8Array | ReadableStream<Uint8Array>>(stream: T, password: string | Uint8Array): Promise<T> {
  // Encrypt with PGP
  const encrypted = await openpgpEncrypt({
    message: await openpgpCreateMessage({ binary: stream }),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary',
  });
  return encrypted as T;
}

export async function decrypt(encrypted: Uint8Array, password: string | Uint8Array): Promise<Uint8Array> {
  const plain = (await openpgpDecrypt({
    message: await openpgpReadMessage({ binaryMessage: encrypted }),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary'
  })).data;
  return plain as Uint8Array;
}

export async function decryptStream(encrypted: ReadableStream<Uint8Array>, password: string | Uint8Array): Promise<ReadableStream<Uint8Array>> {
  const plain = (await openpgpDecrypt({
    message: await openpgpReadMessage({ binaryMessage: encrypted }),
    // FIXME: convert Uint8Array password to string in better way
    passwords: [password.toString()],
    format: 'binary',
    // Allow unauthenticated stream
    // (see: https://github.com/openpgpjs/openpgpjs/releases/tag/v4.0.0)
    config: { allowUnauthenticatedStream: true },
  })).data;
  return plain as ReadableStream<Uint8Array>;
}
