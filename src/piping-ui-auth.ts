import {
  KeyExchangeParcel,
  keyExchangeParcelPayloadType,
  keyExchangeParcelType,
  KeyExchangeV3Parcel,
  keyExchangeV3ParcelType,
  Protection,
  VerificationStep,
  VerifiedParcel,
  verifiedParcelType
} from "@/datatypes";
import type {Validation} from "io-ts";
import {sha256} from "@/utils/sha256";

const openPgpUtilsAsync = () => import("@/utils/openpgp-utils");

const jwkThumbprintAsync  = () => import("jwk-thumbprint");
const uint8ArrayToStringAsync = () => import('binconv/dist/src/uint8ArrayToString').then(p => p.uint8ArrayToString);
const stringToUint8ArrayAsync = () => import('binconv/dist/src/stringToUint8Array').then(p => p.stringToUint8Array);
const uint8ArrayToBase64Async = () => import('binconv/dist/src/uint8ArrayToBase64').then(p => p.uint8ArrayToBase64);
const base64ToUint8ArrayAsync = () => import('binconv/dist/src/base64ToUint8Array').then(p => p.base64ToUint8Array);
const uint8ArrayToHexStringAsync = () => import('binconv/dist/src/uint8ArrayToHexString').then(p => p.uint8ArrayToHexString);
const urlJoinAsync = () => import('url-join').then(p => p.default);

async function keyExchangePath(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  return await sha256(`${secretPath}/key_exchange/${type}`);
}

async function verifiedPath(mainPath: string): Promise<string> {
  return await sha256(`${mainPath}/verified`);
}

export async function verify(serverUrl: string, mainPath: string, key: Uint8Array, verified: boolean, canceledPromise: Promise<void>) {
  const openPgpUtils = await openPgpUtilsAsync();
  const urlJoin = await urlJoinAsync();
  const stringToUint8Array = await stringToUint8ArrayAsync();
  const verifiedParcel: VerifiedParcel = {
    verified,
  };
  const encryptedVerifiedParcel = await openPgpUtils.encrypt(
    stringToUint8Array(JSON.stringify(verifiedParcel)),
    key,
  );
  const path = urlJoin(serverUrl, await verifiedPath(mainPath));
  const abortController = new AbortController();
  canceledPromise.then(() => {
    abortController.abort();
  });
  while (true) {
    try {
      // Send verified or not
      const res = await fetch(path, {
        method: 'POST',
        body: encryptedVerifiedParcel,
        signal: abortController.signal,
      });
      if (res.status === 200) {
        await res.text();
        break;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

export type KeyExchangeErrorCode = 'send_failed' | 'receive_failed' | 'invalid_parcel_format' | 'invalid_v1_parcel_format' | 'different_key_exchange_version';
type KeyExchangeResult =
  {type: "key", key: Uint8Array, mainPath: string, verificationCode: string} |
  {type: "error", errorCode: KeyExchangeErrorCode} |
  {type: "canceled"};

export async function keyExchange(serverUrl: string, type: 'sender' | 'receiver', secretPath: string, ecdsaP384SigningKeyPair: CryptoKeyPair, canceledPromise: Promise<void>): Promise<KeyExchangeResult> {
  const KEY_EXCHANGE_VERSION = 3;
  // 256 is max value for deriveBits()
  const KEY_BITS = 256;
  // Create ECDH key pair
  const encryptKeyPair: CryptoKeyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256'},
    false,
    ['deriveKey', 'deriveBits']
  );
  // Get public key as JWK
  // NOTE: kty should be 'EC' because it's ECDH key
  const publicEncryptJwk = await crypto.subtle.exportKey(
    'jwk',
    encryptKeyPair.publicKey
  ) as JsonWebKey & {kty: 'EC'};
  const payloadJson: keyExchangeParcelPayloadType = {
    publicEncryptJwk,
    pathFactor: (await uint8ArrayToHexStringAsync())(new Uint8Array(await crypto.subtle.digest('SHA-256', crypto.getRandomValues(new Uint8Array(32))))),
  };
  const payload = JSON.stringify(payloadJson);
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: "SHA-384" } },
    ecdsaP384SigningKeyPair.privateKey,
    new TextEncoder().encode(payload),
  );
  const publicSigningJwk = await crypto.subtle.exportKey('jwk', ecdsaP384SigningKeyPair.publicKey);
  const keyExchangeParcel: KeyExchangeV3Parcel = {
    version: KEY_EXCHANGE_VERSION,
    publicSigningJwk,
    payload,
    signature: (await uint8ArrayToBase64Async())(new Uint8Array(signature)),
  };
  const urlJoin = await urlJoinAsync();
  const myPath = await keyExchangePath(type, secretPath);
  const peerPath = await keyExchangePath(type === 'sender' ? 'receiver' : 'sender', secretPath);
  const abortController = new AbortController();
  canceledPromise.then(() => {
    abortController.abort();
  });
  // Exchange
  const postResPromise = fetch(urlJoin(serverUrl, myPath), {
    method: 'POST',
    body: JSON.stringify(keyExchangeParcel),
    signal: abortController.signal,
  });
  const peerResPromise = fetch(urlJoin(serverUrl, peerPath), {
    signal: abortController.signal,
  });
  let postRes: Response;
  try {
    postRes = await postResPromise;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return {type: "canceled"};
    }
    return {type: "error", errorCode: 'send_failed'};
  }
  if (postRes.status !== 200) {
    return {type: "error", errorCode: 'send_failed'};
  }
  let peerRes: Response;
  try {
    [, peerRes] = await Promise.all([
      postRes.text(),
      peerResPromise,
    ]);
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return {type: "canceled"};
    }
    return {type: "error", errorCode: 'receive_failed'};
  }
  if (peerRes.status !== 200) {
    return {type: "error", errorCode: 'receive_failed'};
  }
  const peerKeyExchangeEither: Validation<KeyExchangeParcel> = keyExchangeParcelType.decode(JSON.parse(await peerRes.text()));
  if (peerKeyExchangeEither._tag === 'Left') {
    return {type: "error", errorCode: 'invalid_parcel_format'};
  }
  const peerKeyExchange = peerKeyExchangeEither.right;
  if (KEY_EXCHANGE_VERSION !== peerKeyExchange.version) {
    return {type: "error", errorCode: 'different_key_exchange_version'};
  }
  const peerExchangeV3Either = keyExchangeV3ParcelType.decode(peerKeyExchange);
  if (peerExchangeV3Either._tag === 'Left') {
    return {type: "error", errorCode: 'invalid_v1_parcel_format'};
  }
  const peerKeyExchangeV3 = peerExchangeV3Either.right;
  const peerPublicSigningKey: CryptoKey = await crypto.subtle.importKey(
    'jwk',
    peerKeyExchangeV3.publicSigningJwk,
    { name: 'ECDSA', namedCurve: 'P-384' },
    false,
    ["verify"],
  );
  const payloadVerified: boolean = await window.crypto.subtle.verify(
    { name: 'ECDSA', hash: { name: "SHA-384" } },
    peerPublicSigningKey,
    (await base64ToUint8ArrayAsync())(peerKeyExchangeV3.signature),
    new TextEncoder().encode(peerKeyExchangeV3.payload),
  );
  if (!payloadVerified) {
    // TODO: create new error code and use it here
    return {type: "error", errorCode: 'invalid_v1_parcel_format'};
  }
  const peerKeyExchangePayloadEither = keyExchangeParcelPayloadType.decode(JSON.parse(peerKeyExchangeV3.payload));
  if (peerKeyExchangePayloadEither._tag === 'Left') {
    return {type: "error", errorCode: 'invalid_v1_parcel_format'};
  }
  const peerKeyExchangePayload = peerKeyExchangePayloadEither.right;
  const peerPublicEncryptKey = await crypto.subtle.importKey(
    'jwk',
    peerKeyExchangePayload.publicEncryptJwk,
    {name: 'ECDH', namedCurve: 'P-256'},
    false,
    []
  );
  const keyBits: ArrayBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicEncryptKey },
    encryptKeyPair.privateKey,
    KEY_BITS,
  );
  const mainPath = await generateMainPath(payloadJson.pathFactor, peerKeyExchangePayload.pathFactor);
  const verificationCode = await generateVerificationCode(publicSigningJwk, peerKeyExchangeV3.publicSigningJwk);
  return {
    type: 'key',
    key: new Uint8Array(keyBits),
    mainPath,
    verificationCode,
  };
}

async function generateMainPath(pathFactor1: string, pathFactor2: string) {
  const factors = [pathFactor1, pathFactor2];
  const sha256: ArrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(factors.sort().join('-')));
  return (await uint8ArrayToBase64Async())(new Uint8Array(sha256).slice(0, 16)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function generateVerificationCode(publicJwk1: JsonWebKey, publicJwk2: JsonWebKey) {
  const {jwkThumbprintByEncoding} = await jwkThumbprintAsync();
  const hashes = [
    jwkThumbprintByEncoding(publicJwk1, 'SHA-256', 'hex'),
    jwkThumbprintByEncoding(publicJwk2, 'SHA-256', 'hex'),
  ];
  return (await sha256(hashes.sort().join('-'))).substring(0, 32);
}

type KeyExchangeAndReceiveVerifiedError =
  { code: 'key_exchange_error', keyExchangeErrorCode: KeyExchangeErrorCode } |
  { code: 'sender_not_verified' };

export async function keyExchangeAndReceiveVerified(serverUrl: string, secretPath: string, protection: Protection, signingKeyPair: CryptoKeyPair, setVerificationStep: (step: VerificationStep) => void, canceledPromise: Promise<void>):
  Promise<
    {type: 'key', protectionType: 'raw', key: undefined } |
    {type: 'key', protectionType: 'password', key: string} |
    {type: 'key', protectionType: 'passwordless', key: Uint8Array, mainPath: string, verificationCode: string} |
    {type: 'error', error: KeyExchangeAndReceiveVerifiedError } |
    {type: 'canceled' }
  > {
  switch (protection.type) {
    case 'raw':
      return {
        type: 'key',
        protectionType: 'raw',
        key: undefined,
      };
    case 'password':
      return {
        type: 'key',
        protectionType: 'password',
        key: protection.password,
      };
    case 'passwordless': {
      // Key exchange
      const keyExchangeRes = await keyExchange(serverUrl, 'receiver', secretPath, signingKeyPair, canceledPromise);
      if (keyExchangeRes.type === 'canceled') {
        return { type: "canceled" };
      }
      if (keyExchangeRes.type === 'error') {
        setVerificationStep({type: 'error'});
        return {
          type: "error",
          error: { code: 'key_exchange_error', keyExchangeErrorCode: keyExchangeRes.errorCode },
        };
      }
      const {key, mainPath, verificationCode} = keyExchangeRes;
      setVerificationStep({type: 'verification_code_arrived', mainPath, verificationCode, key});
      const uint8ArrayToString = await uint8ArrayToStringAsync();
      const urlJoin = await urlJoinAsync();
      const path = urlJoin(serverUrl, await verifiedPath(mainPath));
      const abortController = new AbortController();
      canceledPromise.then(() => {
        abortController.abort();
      });
      // Get verified or not
      let encryptedVerified: Uint8Array;
      while (true) {
        try {
          const res = await fetch(path, {
            signal: abortController.signal,
          });
          if (res.status === 200) {
            encryptedVerified = new Uint8Array(await res.arrayBuffer());
            break;
          }
        } catch (e: any) {
          if (e.name === 'AbortError') {
            return {type: "canceled"};
          }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      const utils = await openPgpUtilsAsync();
      // Decrypt body
      const decryptedBody: Uint8Array = await utils.decrypt(encryptedVerified, key);
      // Parse
      const verifiedParcelEither: Validation<VerifiedParcel> = verifiedParcelType.decode(JSON.parse(uint8ArrayToString(decryptedBody)));
      if (verifiedParcelEither._tag === "Left") {
        return {
          type: "error",
          error: { code: 'key_exchange_error', keyExchangeErrorCode: 'invalid_parcel_format'},
        };
      }
      const {verified} = verifiedParcelEither.right;
      setVerificationStep({type: 'verified', verified});
      if (!verified) {
        return {
          type: "error",
          error: { code: 'sender_not_verified' },
        };
      }
      return {
        type: 'key',
        key,
        protectionType: 'passwordless',
        mainPath,
        verificationCode,
      };
    }
  }
}
