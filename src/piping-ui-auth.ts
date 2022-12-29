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
import * as openPgpUtils from "@/utils/openpgp-utils";
import {jwkThumbprintByEncoding} from "jwk-thumbprint";
import {stringToUint8Array} from 'binconv/dist/src/stringToUint8Array';
import {uint8ArrayToBase64} from 'binconv/dist/src/uint8ArrayToBase64';
import {uint8ArrayToString} from 'binconv/dist/src/uint8ArrayToString';
import {base64ToUint8Array} from 'binconv/dist/src/base64ToUint8Array';
import {uint8ArrayToHexString} from 'binconv/dist/src/uint8ArrayToHexString';
import urlJoin from "url-join";


async function keyExchangePath(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  return await sha256(`${secretPath}/key_exchange/${type}`);
}

async function verifiedPath(mainPath: string): Promise<string> {
  return await sha256(`${mainPath}/verified`);
}

export async function verify(serverUrl: string, mainPath: string, key: Uint8Array, verified: boolean, canceledPromise: Promise<void>) {
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

export type KeyExchangeErrorCode = 'send_failed' | 'receive_failed' | 'invalid_parcel_format' | 'payload_not_verified' | 'invalid_v3_parcel_format' | 'different_key_exchange_version';
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
    mainPathFactor: uint8ArrayToHexString(new Uint8Array(await crypto.subtle.digest('SHA-256', crypto.getRandomValues(new Uint8Array(32))))),
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
    signature: uint8ArrayToBase64(new Uint8Array(signature)),
  };
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
    return {type: "error", errorCode: 'invalid_v3_parcel_format'};
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
    base64ToUint8Array(peerKeyExchangeV3.signature),
    new TextEncoder().encode(peerKeyExchangeV3.payload),
  );
  if (!payloadVerified) {
    return {type: "error", errorCode: 'payload_not_verified'};
  }
  const peerKeyExchangePayloadEither = keyExchangeParcelPayloadType.decode(JSON.parse(peerKeyExchangeV3.payload));
  if (peerKeyExchangePayloadEither._tag === 'Left') {
    return {type: "error", errorCode: 'invalid_v3_parcel_format'};
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
  const mainPath = await generateMainPath(payloadJson.mainPathFactor, peerKeyExchangePayload.mainPathFactor);
  const verificationCode = await generateVerificationCode(publicSigningJwk, peerKeyExchangeV3.publicSigningJwk);
  return {
    type: 'key',
    key: new Uint8Array(keyBits),
    mainPath,
    verificationCode,
  };
}

async function generateMainPath(mainPathFactor1: string, mainPathFactor2: string) {
  const factors = [mainPathFactor1, mainPathFactor2];
  const sha256: ArrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(factors.sort().join('-')));
  return uint8ArrayToBase64(new Uint8Array(sha256).slice(0, 16)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function generateVerificationCode(publicJwk1: JsonWebKey, publicJwk2: JsonWebKey) {
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
      // Decrypt body
      const decryptedBody: Uint8Array = await openPgpUtils.decrypt(encryptedVerified, key);
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
