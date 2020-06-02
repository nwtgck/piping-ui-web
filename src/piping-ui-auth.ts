// NOTE: Use `const pipingUiAuthAsync = import(/* webpackChunkName: "piping-ui-auth" */ "@/piping-ui-auth");` to import this file

import {
  KeyExchangeParcel,
  keyExchangeParcelFormat,
  Protection, VerificationStep,
  VerifiedParcel,
  verifiedParcelFormat
} from "@/datatypes";
import {validatingParse} from 'ts-json-validator';
import {strings} from "@/strings";
const utilsAsync = () => import("@/utils");

const jwkThumbprintAsync  = () => import("jwk-thumbprint");
const uint8ArrayToStringAsync = () => import('binconv/dist/src/uint8ArrayToString').then(p => p.uint8ArrayToString);
const urlJoinAsync = () => import('url-join').then(p => p.default);

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
