import {
  KeyExchangeParcel,
  keyExchangeParcelType,
  KeyExchangeV1Parcel,
  keyExchangeV1ParcelType,
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
const urlJoinAsync = () => import('url-join').then(p => p.default);

async function keyExchangePath(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  return await sha256(`${secretPath}/key_exchange/${type}`);
}

async function verifiedPath(secretPath: string): Promise<string> {
  return await sha256(`${secretPath}/verified`);
}

export async function verify(serverUrl: string, secretPath: string, key: Uint8Array, verified: boolean, canceledPromise: Promise<void>) {
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
  const path = urlJoin(serverUrl, await verifiedPath(secretPath));
  const abortController = new AbortController();
  canceledPromise.then(() => {
    abortController.abort();
  });
  // Send verified or not
  const res = await fetch(path, {
    method: 'POST',
    body: encryptedVerifiedParcel,
    signal: abortController.signal,
  });
  // TODO: check res status
  await res.text();
}

export type KeyExchangeErrorCode = 'send_failed' | 'receive_failed' | 'invalid_parcel_format' | 'invalid_v1_parcel_format' | 'different_key_exchange_version';
type KeyExchangeResult =
  {type: "key", key: Uint8Array, verificationCode: string} |
  {type: "error", errorCode: KeyExchangeErrorCode} |
  {type: "canceled"};

export async function keyExchange(serverUrl: string, type: 'sender' | 'receiver', secretPath: string, canceledPromise: Promise<void>): Promise<KeyExchangeResult> {
  const KEY_EXCHANGE_VERSION = 2;
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
  const keyExchangeParcel: KeyExchangeV1Parcel = {
    version: KEY_EXCHANGE_VERSION,
    encryptPublicJwk: publicKeyJwk,
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
  const peerPublicKeyExchangeEither: Validation<KeyExchangeParcel> = keyExchangeParcelType.decode(JSON.parse(await peerRes.text()));
  if (peerPublicKeyExchangeEither._tag === 'Left') {
    return {type: "error", errorCode: 'invalid_parcel_format'};
  }
  const peerPublicKeyExchange = peerPublicKeyExchangeEither.right;
  if (KEY_EXCHANGE_VERSION !== peerPublicKeyExchange.version) {
    return {type: "error", errorCode: 'different_key_exchange_version'};
  }
  const peerPublicKeyExchangeV1Either = keyExchangeV1ParcelType.decode(peerPublicKeyExchange);
  if (peerPublicKeyExchangeV1Either._tag === 'Left') {
    return {type: "error", errorCode: 'invalid_v1_parcel_format'};
  }
  const peerPublicKeyExchangeV1 = peerPublicKeyExchangeV1Either.right;
  const peerPublicKey = await crypto.subtle.importKey(
    'jwk',
    peerPublicKeyExchangeV1.encryptPublicJwk,
    {name: 'ECDH', namedCurve: 'P-256'},
    false,
    []
  );
  const keyBits: ArrayBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    keyPair.privateKey,
    KEY_BITS,
  );
  const verificationCode = await generateVerificationCode(publicKeyJwk, peerPublicKeyExchangeV1.encryptPublicJwk);
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
  return (await sha256(hashes.sort().join('-'))).substring(0, 32);
}

type KeyExchangeAndReceiveVerifiedError =
  { code: 'key_exchange_error', keyExchangeErrorCode: KeyExchangeErrorCode } |
  { code: 'sender_not_verified' };

export async function keyExchangeAndReceiveVerified(serverUrl: string, secretPath: string, protection: Protection, setVerificationStep: (step: VerificationStep) => void, canceledPromise: Promise<void>):
  Promise<
    {type: 'key', key: string | Uint8Array | undefined} |
    {type: 'error', error: KeyExchangeAndReceiveVerifiedError } |
    {type: 'canceled' }
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
      const keyExchangeRes = await keyExchange(serverUrl, 'receiver', secretPath, canceledPromise);
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
      const {key, verificationCode} = keyExchangeRes;
      setVerificationStep({type: 'verification_code_arrived', verificationCode, key});
      const uint8ArrayToString = await uint8ArrayToStringAsync();
      const urlJoin = await urlJoinAsync();
      const path = urlJoin(serverUrl, await verifiedPath(secretPath));
      const abortController = new AbortController();
      canceledPromise.then(() => {
        abortController.abort();
      });
      // Get verified or not
      let res: Response;
      try {
        res = await fetch(path, {
          signal: abortController.signal,
        });
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return {type: "canceled"};
        }
        // TODO: return { type: "error" }
        throw e;
      }
      // TODO: check res status
      const utils = await openPgpUtilsAsync();
      // Decrypt body
      const decryptedBody: Uint8Array = await utils.decrypt(new Uint8Array(await res.arrayBuffer()), key);
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
      };
    }
  }
}
