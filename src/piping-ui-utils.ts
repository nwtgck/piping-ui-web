import {
  KeyExchangeParcel,
  keyExchangeParcelFormat,
  Protection, VerificationStep,
  VerifiedParcel,
  verifiedParcelFormat
} from "@/datatypes";
import {validatingParse} from 'ts-json-validator';
import {strings} from "@/strings";

const FileSaverAsync = () => import('file-saver');
const urlJoinAsync = () => import('url-join').then(p => p.default);
const binconvAsync = () => import('binconv');
const swDownloadAsync = () => import("@/sw-download");
const utilsAsync = () => import("@/utils");
const jwkThumbprintAsync  = () => import("jwk-thumbprint");
const uint8ArrayToStringAsync = () => import('binconv/dist/src/uint8ArrayToString').then(p => p.uint8ArrayToString);

// Decrypt & Download
export async function decryptingDownload(
  {downloadUrl, fileName, key, decryptErrorMessage}:
  {downloadUrl: string, fileName: string, key: string | Uint8Array | undefined, decryptErrorMessage: string}
) {
  type Protection = {type: 'raw'} | {type: 'string', key: string} | {type: 'uint8array', key: string};

  const swDownload = await swDownloadAsync();
  // If supporting stream-download via Service Worker
  if (await swDownload.supportsSwDownload) {
    const utils = await utilsAsync();
    const protection: Protection = (() => {
      if (key === undefined) {
        return {type: 'raw'} as const;
      } else if (typeof key === 'string') {
        return {type: 'string', key: key} as const;
      } else {
        return {
          type: 'uint8array',
          key: utils.uint8ArrayToBase64(key),
        } as const;
      }
    })();

    // Create download info to tell to Service Worker
    const downloadInfo = {
      url: downloadUrl,
      filename: fileName,
      protection,
      decryptErrorMessage: decryptErrorMessage,
    };
    // Download via Service Worker
    const aTag = document.createElement('a');
    // NOTE: '/sw-download' can be received by Service Worker in src/sw.js
    // NOTE: URL fragment is passed to Service Worker but not passed to Web server
    aTag.href = `/sw-download#${encodeURIComponent(JSON.stringify(downloadInfo))}`;
    aTag.target = "_blank";
    aTag.click();
  } else {
    const binconv = await binconvAsync();
    // If password-protection is disabled
    if (key === undefined) {
      // Download or show on browser sometimes
      const aTag = document.createElement('a');
      aTag.href = downloadUrl;
      aTag.target = "_blank";
      aTag.download = fileName;
      aTag.click();
    } else {
      // Get response
      const res = await fetch(downloadUrl);
      const resBody = await binconv.blobToUint8Array(await res.blob());
      // Decrypt the response body
      const plain = await (await utilsAsync()).decrypt(resBody, key);
      // Save
      const FileSaver = await FileSaverAsync();
      FileSaver.saveAs(binconv.uint8ArrayToBlob(plain), fileName);
    }
  }
}


async function keyExchangePath(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  const utils = await utilsAsync();
  return utils.sha256(`${secretPath}/key_exchange/${type}`);
}

export async function verifiedPath(secretPath: string): Promise<string> {
  const utils = await utilsAsync();
  return utils.sha256(`${secretPath}/verified`);
}

export type KeyExchangeErrorCode = 'invalid_parcel_format' | 'different_key_exchange_version';
type KeyExchangeResult =
  {type: "key", key: Uint8Array, verificationCode: string} |
  {type: "error", errorCode: KeyExchangeErrorCode};

export async function keyExchange(serverUrl: string, type: 'sender' | 'receiver', secretPath: string): Promise<KeyExchangeResult> {
  const KEY_EXCHANGE_VERSION = 1;
  // 256 is max value for deriveBits()
  const KEY_BITS = 256;
  // Create ECDH key pair
  const keyPair: CryptoKeyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256'},
    false,
    ['deriveKey', 'deriveBits']
  );
  // Get public key as JWK
  // NOTE: kty should be 'EC' because it's ECDH key
  const publicKeyJwk = await crypto.subtle.exportKey(
    'jwk',
    keyPair.publicKey
  ) as JsonWebKey & {kty: 'EC'};
  const keyExchangeParcel: KeyExchangeParcel = {
    version: KEY_EXCHANGE_VERSION,
    encryptPublicJwk: publicKeyJwk,
  };
  const urlJoin = await urlJoinAsync();
  const myPath = await keyExchangePath(type, secretPath);
  const peerPath = await keyExchangePath(type === 'sender' ? 'receiver' : 'sender', secretPath);
  // Exchange
  const [_, peerRes] = await Promise.all([
    fetch(urlJoin(serverUrl, myPath), {method: 'POST', body: JSON.stringify(keyExchangeParcel)}),
    fetch(urlJoin(serverUrl, peerPath)),
  ]);
  const peerPublicKeyExchange: KeyExchangeParcel | undefined = validatingParse(keyExchangeParcelFormat, await peerRes.text());
  if (peerPublicKeyExchange === undefined) {
    return {type: "error", errorCode: 'invalid_parcel_format'};
  }
  if (KEY_EXCHANGE_VERSION !== peerPublicKeyExchange.version) {
    return {type: "error", errorCode: 'different_key_exchange_version'};
  }
  const peerPublicKey = await crypto.subtle.importKey(
    'jwk',
    peerPublicKeyExchange.encryptPublicJwk,
    {name: 'ECDH', namedCurve: 'P-256'},
    false,
    []
  );
  const keyBits: ArrayBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    keyPair.privateKey,
    KEY_BITS,
  );
  const verificationCode = await generateVerificationCode(publicKeyJwk, peerPublicKeyExchange.encryptPublicJwk);
  return {
    type: 'key',
    key: new Uint8Array(keyBits),
    verificationCode,
  };
}

async function generateVerificationCode(publicJwk1: JsonWebKey, publicJwk2: JsonWebKey) {
  const {jwkThumbprintByEncoding} = await jwkThumbprintAsync();
  const hashes = [
    jwkThumbprintByEncoding(publicJwk1, 'SHA-256', 'hex'),
    jwkThumbprintByEncoding(publicJwk2, 'SHA-256', 'hex'),
  ];
  const utils = await utilsAsync();
  return (await utils.sha256(hashes.sort().join('-'))).substring(0, 32);
}

export async function keyExchangeAndReceiveVerified(serverUrl: string, secretPath: string, protection: Protection, setVerificationStep: (step: VerificationStep) => void):
  Promise<
    {type: 'key', key: string | Uint8Array | undefined} |
    {type: 'error', errorMessage: (lang: string) => string}
  > {
  switch (protection.type) {
    case 'raw':
      return {
        type: 'key',
        key: undefined,
      };
    case 'password':
      return {
        type: 'key',
        key: protection.password,
      };
    case 'passwordless': {
      // Key exchange
      const keyExchangeRes = await keyExchange(serverUrl, 'receiver', secretPath);
      if (keyExchangeRes.type === 'error') {
        setVerificationStep({type: 'error'});
        return {
          type: "error",
          errorMessage(lang) {
            return strings(lang)['key_exchange_error'](keyExchangeRes.errorCode);
          }
        };
      }
      const {key, verificationCode} = keyExchangeRes;
      setVerificationStep({type: 'verification_code_arrived', verificationCode, key});
      const uint8ArrayToString = await uint8ArrayToStringAsync();
      const urlJoin = await urlJoinAsync();
      const path = urlJoin(serverUrl, await verifiedPath(secretPath));
      // Get verified or not
      const res = await fetch(path);
      const utils = await utilsAsync();
      // Decrypt body
      const decryptedBody: Uint8Array = await utils.decrypt(new Uint8Array(await res.arrayBuffer()), key);
      // Parse
      const verifiedParcel: VerifiedParcel | undefined = validatingParse(verifiedParcelFormat, uint8ArrayToString(decryptedBody));
      if (verifiedParcel === undefined) {
        return {
          type: "error",
          errorMessage(lang) {
            return strings(lang)['key_exchange_error']('invalid_parcel_format');
          }
        };
      }
      const {verified} = verifiedParcel;
      setVerificationStep({type: 'verified', verified});
      if (!verified) {
        return {
          type: "error",
          errorMessage(lang) {
            return strings(lang)['sender_not_verified'];
          }
        };
      }
      return {
        type: 'key',
        key,
      };
    }
  }
}
