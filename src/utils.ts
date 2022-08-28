/* eslint-disable no-console */
import {type ActualFileObject} from "filepond";

const JSZipAsync = () => import('jszip').then(p => p.default);
const sanitizeHtmlAsync  = () => import("sanitize-html").then(p => p.default);
const openpgpAsync = () => import("@/openpgp-import");

const uint8ArrayToHexStringAsync = () => import("binconv/dist/src/uint8ArrayToHexString").then(p => p.default);
const uint8ArrayToReadableStreamAsync = () => import("binconv/dist/src/uint8ArrayToReadableStream").then(p => p.default);
const readableStreamToUint8ArrayAsync = () => import("binconv/dist/src/readableStreamToUint8Array").then(p => p.default);
const urlJoinAsync = () => import('url-join').then(p => p.default);

export function readableBytesString(bytes: number, fractionDigits: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let n = 1;
  let prevBytes = bytes;
  for (const [idx, unit] of units.entries()) {
    n *= 1024;
    const div = bytes / n;
    if (div < 1 || idx === units.length - 1) {
      return `${prevBytes.toFixed(fractionDigits)}${unit}`;
    }
    prevBytes = div;
  }
  // NOTE: Never execute
  return '';
}

export function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsText(blob);
    reader.onload = () => {
      resolve(reader.result as string);
    }
  });
}

export function baseAndExt(name: string): {baseName: string, ext: string} {
  const m = name.match(/(.*)(\..*?)$/);
  if (m === null) {
    return {baseName: '', ext: ''};
  } else {
    return {baseName: m[1], ext: m[2]};
  }
}

export async function zipFilesAsBlob(files: ActualFileObject[]): Promise<Blob> {
  const JSZip = await JSZipAsync();
  const zip = new JSZip();
  // NOTE: Should not be null because it is new folder
  const directory = zip.folder('files')!;
  for (const file of files) {
    // Name not-duplicate name
    const name: string = (() => {
      let name: string = file.name;
      let {baseName, ext} = baseAndExt(file.name);
      // Loop until the file name is new
      for (let n = 1; directory.file(name) !== null; n++) {
        name = `${baseName}__${n}${ext}`;
      }
      return name;
    })();
    // Add file
    directory.file(name, file);
  }
  return directory.generateAsync({type : "blob"});
}

function* range(start: number, end: number): Generator<number> {
  for(let i = start; i <= end; i++) {
    yield i;
  }
}

// Whether text or not. Besed on file (1) behavior
// (from: https://stackoverflow.com/a/7392391/2885946)
export function isText(array: Uint8Array): boolean {
  const textChars: ReadonlyArray<number> = [7, 8, 9, 10, 12, 13, 27, ...range(0x20, 0xff)];
  return array.every(e => textChars.includes(e));
}

// Sanitize html, allowing <a> tag
export async function sanitizeHtmlAllowingATag(dirtyHtml: string): Promise<string> {
  const sanitizeHtml = await sanitizeHtmlAsync();
  return sanitizeHtml(dirtyHtml, {
    allowedTags: ['a'],
    allowedAttributes: {
      'a': ['href', 'target']
    },
    disallowedTagsMode: 'escape',
  });
}

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

export async function sha256(input: string): Promise<string> {
  const uint8ArrayToHexString = await uint8ArrayToHexStringAsync();
  // Calculate SHA-256
  const sha256: ArrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  // Convert array buffer to hex string
  return uint8ArrayToHexString(new Uint8Array(sha256));
}

/***
 * Make a promise which can be resolved and rejected outside of the Promise constructor
 */
export function makePromise<T>(): {promise: Promise<T>, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void} {
  let resolve = (value: T | PromiseLike<T>) => {};
  let reject = () => {};
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject  = _reject;
  });
  return {promise, resolve, reject};
}

// Check fetch() upload streaming support with Piping Server
export async function supportsFetchUploadStreaming(pipingServerUrl: string): Promise<boolean> {
  try {
    const stream = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array([65, 66, 67]));
        controller.close();
      }
    });
    const urlJoin = await urlJoinAsync();
    const path = Math.random().toString(36).slice(-8);
    const url = urlJoin(pipingServerUrl, path)
    const postResPromise: Promise<Response | "fetch_error"> = fetch(url, {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit)
      // Without this, Safari causes an error "Unhandled Promise Rejection: NotSupportedError: ReadableStream uploading is not supported"
      .catch(() => "fetch_error");
    const getResPromise = fetch(url);
    const postRes = await postResPromise;
    if (postRes === "fetch_error") {
      return false;
    }
    if (postRes.status !== 200) {
      return false;
    }
    const getRes = await getResPromise;
    if (getRes.status !== 200) {
      return false;
    }
    const text = await getRes.text();
    return text === 'ABC';
  } catch (e) {
    console.error("failed to detect fetch upload streaming", e);
    return false;
  }
}

/**
 * Feature detection whether ReadableStream is Transferable or not
 */
export function canTransferReadableStream(): boolean {
  const messageChannel = new MessageChannel();
  const r = new ReadableStream();
  try {
    messageChannel.port1.postMessage(r, {
      transfer: [r] as any as Transferable[],
    });
    return true;
  } catch (e) {
    // Safari causes an error "DataCloneError: The object can not be cloned."
    return false;
  }
}
