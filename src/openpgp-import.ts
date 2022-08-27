/* eslint-disable no-console */

// Backup the native ReadableStream because OpenPGP.js modifies it on Firefox ESR 91.
// In the latest Firefox, it is not modified.
const NativeReadableStream = ReadableStream;

// NOTE: Importing OpenPGP.js rewrites the native ReadableStream
// NOTE: Backing up ReadableStream fails when using `import * as openpgp from "openpgp"`.
const openpgp = require("openpgp");

if (NativeReadableStream !== ReadableStream) {
  console.log("ReadableStream is modified by OpenPGP.js");
}

// Allow unauthenticated stream
// (see: https://github.com/openpgpjs/openpgpjs/releases/tag/v4.0.0)
openpgp.config.allow_unauthenticated_stream = true;

const openpgpWithWorker = (async () => {
  await openpgp.initWorker({ path: 'openpgp/openpgp.worker.min.js' })
  return openpgp;
})();

import {createReadableStreamWrapper} from '@mattiasbuelens/web-streams-adapter';

// Create convert functions
// These functions return a raw input if NativeReadableStream === ReadableStream
const toPolyfillReadableIfNeed = createReadableStreamWrapper(ReadableStream);
const toNativeReadableIfNeed = createReadableStreamWrapper(NativeReadableStream);

export {
  openpgpWithWorker,
  toPolyfillReadableIfNeed,
  toNativeReadableIfNeed,
};
