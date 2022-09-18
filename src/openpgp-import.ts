// Backup the native ReadableStream because OpenPGP.js modifies it on Firefox ESR 91 in OpenPGP.js 4.10.10 but not in OpenPGP.js 5.5.0.
// In the latest Firefox, it is not modified.
const NativeReadableStream = ReadableStream;

// NOTE: Importing OpenPGP.js rewrites the native ReadableStream
// NOTE: Backing up ReadableStream fails when using `import * as openpgp from "openpgp"`.
const openpgp = require("openpgp/lightweight");

if (NativeReadableStream !== ReadableStream) {
  console.log("ReadableStream is modified by OpenPGP.js");
}

import {createReadableStreamWrapper} from '@mattiasbuelens/web-streams-adapter';

// Create convert functions
// These functions return a raw input if NativeReadableStream === ReadableStream
const toPolyfillReadableIfNeed = createReadableStreamWrapper(ReadableStream);
const toNativeReadableIfNeed = createReadableStreamWrapper(NativeReadableStream);

export {
  openpgp,
  toPolyfillReadableIfNeed,
  toNativeReadableIfNeed,
};
