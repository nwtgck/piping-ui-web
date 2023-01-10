import {ecJsonWebKeyType, jsonWebKeyType, type Protection} from "@/datatypes";
import {sha256} from "@/utils/sha256";
import * as openPgpUtils from "@/utils/openpgp-utils";
import {jwkThumbprintByEncoding} from "jwk-thumbprint";
import {stringToUint8Array} from 'binconv/dist/src/stringToUint8Array';
import {uint8ArrayToBase64} from 'binconv/dist/src/uint8ArrayToBase64';
import {uint8ArrayToString} from 'binconv/dist/src/uint8ArrayToString';
import {base64ToUint8Array} from 'binconv/dist/src/base64ToUint8Array';
import {uint8ArrayToHexString} from 'binconv/dist/src/uint8ArrayToHexString';
import urlJoin from "url-join";
import {z} from "zod";
import {KEY_EXCHANGE_VERSION} from "@/piping-ui-auth/KEY_EXCHANGE_VERSION";
import {makeKeyExchangeFailForLegacy} from "@/piping-ui-auth/for-legacy";

export const keyExchangeParcelType = z.object({
  format: z.literal("piping_ui_auth"),
  version: z.number(),
}).passthrough();
export type KeyExchangeParcel = z.infer<typeof keyExchangeParcelType>;

export const keyExchangeV4ParcelType = z.object({
  format: z.literal("piping_ui_auth"),
  version: z.literal(4),
  public_signing_jwk: jsonWebKeyType,
  payload: z.string(),
  signature: z.string(),
});
export type KeyExchangeV4Parcel = z.infer<typeof keyExchangeV4ParcelType>;

// Ensure KeyExchangeVXParcel is subtype of KeyExchangeParcel
type IsSubTypeOf<A extends B, B> = void;
type __DUMMY1__ = IsSubTypeOf<KeyExchangeV4Parcel, KeyExchangeParcel>;

export const keyExchangeParcelPayloadType = z.object({
  // Public encryption JWK
  public_encrypt_jwk: ecJsonWebKeyType,
  // For mitigating path collision
  main_path_factor: z.string(),
});
export type keyExchangeParcelPayloadType = z.infer<typeof keyExchangeParcelPayloadType>;

export const verifiedParcelType = z.object({
  verified: z.boolean(),
  extension: z.union([z.unknown(), z.undefined()]),
});
export type VerifiedParcel = z.infer<typeof verifiedParcelType>

export type VerificationStep =
  {type: 'initial'} |
  {type: 'error'} |
  {type: 'verification_code_arrived', mainPath: string, verificationCode: string, key: Uint8Array} |
  {type: 'verified', verified: boolean};

const verifiedExtensionType = z.object({
  version: z.literal(2),
  mimeType: z.union([z.string(), z.undefined()]),
  fileExtension: z.union([z.string(), z.undefined()]),
});

async function keyExchangePath(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  if (type === 'sender') {
    return secretPath;
  }
  return `${secretPath}/receiver-sender`;
}

async function verifiedPath(mainPath: string): Promise<string> {
  return await sha256(`${mainPath}/verified`);
}

export async function verify(serverUrl: string, mainPath: string, key: Uint8Array, verified: boolean, parcelExtension: z.infer<typeof verifiedExtensionType>, canceledPromise: Promise<void>) {
  const verifiedParcel: VerifiedParcel = {
    verified,
    extension: parcelExtension,
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

export type KeyExchangeError =
  { code: 'send_failed' } |
  { code: 'receive_failed' } |
  { code: 'invalid_parcel_format' } |
  { code: 'payload_not_verified' } |
  { code: 'invalid_v3_parcel_format' } |
  { code: 'key_exchange_version_mismatch', peerVersion: number };

type KeyExchangeResult =
  {type: "key", key: Uint8Array, mainPath: string, verificationCode: string} |
  {type: "error", keyExchangeError: KeyExchangeError} |
  {type: "canceled"};

export async function keyExchange(serverUrl: string, type: 'sender' | 'receiver', secretPath: string, ecdsaP384SigningKeyPair: CryptoKeyPair, canceledPromise: Promise<void>): Promise<KeyExchangeResult> {
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
    public_encrypt_jwk: publicEncryptJwk,
    main_path_factor: uint8ArrayToHexString(new Uint8Array(await crypto.subtle.digest('SHA-256', crypto.getRandomValues(new Uint8Array(32))))),
  };
  const payload = JSON.stringify(payloadJson);
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: "SHA-384" } },
    ecdsaP384SigningKeyPair.privateKey,
    new TextEncoder().encode(payload),
  );
  const publicSigningJwk = await crypto.subtle.exportKey('jwk', ecdsaP384SigningKeyPair.publicKey);
  const keyExchangeParcel: KeyExchangeV4Parcel = {
    format: 'piping_ui_auth',
    version: KEY_EXCHANGE_VERSION,
    public_signing_jwk: publicSigningJwk,
    payload,
    signature: uint8ArrayToBase64(new Uint8Array(signature)),
  };
  const myPath = await keyExchangePath(type, secretPath);
  const peerPath = await keyExchangePath(type === 'sender' ? 'receiver' : 'sender', secretPath);
  const abortController = new AbortController();
  const oldKeyExchangeAbortController = new AbortController();
  makeKeyExchangeFailForLegacy(serverUrl, type, secretPath, oldKeyExchangeAbortController);
  canceledPromise.then(() => {
    abortController.abort();
    oldKeyExchangeAbortController.abort();
  });
  // Exchange
  const postResPromise = fetch(urlJoin(serverUrl, myPath), {
    method: 'POST',
    // Indent JSON to let command-line users to know Piping UI Auth enabled
    body: JSON.stringify(keyExchangeParcel, null, 2),
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
    return {type: "error", keyExchangeError: {code: 'send_failed'}};
  }
  if (postRes.status !== 200) {
    return {type: "error", keyExchangeError: {code: 'send_failed'}};
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
    return {type: "error", keyExchangeError: {code: 'receive_failed'}};
  }
  if (peerRes.status !== 200) {
    return {type: "error", keyExchangeError: {code: 'receive_failed'}};
  }
  oldKeyExchangeAbortController.abort();
  const peerKeyExchangeParseReturn: z.SafeParseReturnType<unknown, KeyExchangeParcel> = keyExchangeParcelType.safeParse(JSON.parse(await peerRes.text()));
  if (!peerKeyExchangeParseReturn.success) {
    return {type: "error", keyExchangeError: { code: 'invalid_parcel_format' }};
  }
  const peerKeyExchange = peerKeyExchangeParseReturn.data;
  if (KEY_EXCHANGE_VERSION !== peerKeyExchange.version) {
    return {type: "error", keyExchangeError: {code: 'key_exchange_version_mismatch', peerVersion: peerKeyExchange.version}};
  }
  const peerExchangeV3ParseReturn = keyExchangeV4ParcelType.safeParse(peerKeyExchange);
  if (!peerExchangeV3ParseReturn.success) {
    return {type: "error", keyExchangeError: {code: 'invalid_v3_parcel_format'}};
  }
  const peerKeyExchangeV3 = peerExchangeV3ParseReturn.data;
  const peerPublicSigningKey: CryptoKey = await crypto.subtle.importKey(
    'jwk',
    peerKeyExchangeV3.public_signing_jwk,
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
    return {type: "error", keyExchangeError: {code: 'payload_not_verified'}};
  }
  const peerKeyExchangePayloadParseReturn = keyExchangeParcelPayloadType.safeParse(JSON.parse(peerKeyExchangeV3.payload));
  if (!peerKeyExchangePayloadParseReturn.success) {
    return {type: "error", keyExchangeError: {code: 'invalid_v3_parcel_format'}};
  }
  const peerKeyExchangePayload = peerKeyExchangePayloadParseReturn.data;
  const peerPublicEncryptKey = await crypto.subtle.importKey(
    'jwk',
    peerKeyExchangePayload.public_encrypt_jwk,
    {name: 'ECDH', namedCurve: 'P-256'},
    false,
    []
  );
  const keyBits: ArrayBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicEncryptKey },
    encryptKeyPair.privateKey,
    KEY_BITS,
  );
  const mainPath = await generateMainPath(payloadJson.main_path_factor, peerKeyExchangePayload.main_path_factor);
  const verificationCode = await generateVerificationCode(publicSigningJwk, peerKeyExchangeV3.public_signing_jwk);
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
  { code: 'key_exchange_error', keyExchangeError: KeyExchangeError } |
  { code: 'sender_not_verified' };

export async function keyExchangeAndReceiveVerified(serverUrl: string, secretPath: string, protection: Protection, signingKeyPair: CryptoKeyPair, setVerificationStep: (step: VerificationStep) => void, canceledPromise: Promise<void>):
  Promise<
    {type: 'key', protectionType: 'raw', key: undefined } |
    {type: 'key', protectionType: 'password', key: string} |
    {type: 'key', protectionType: 'passwordless', key: Uint8Array, mainPath: string, verificationCode: string, fileType: { mimeType: string | undefined, fileExtension: string | undefined } } |
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
          error: { code: 'key_exchange_error', keyExchangeError: keyExchangeRes.keyExchangeError },
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
      const verifiedParcelParseReturn: z.SafeParseReturnType<unknown, VerifiedParcel> = verifiedParcelType.safeParse(JSON.parse(uint8ArrayToString(decryptedBody)));
      if (!verifiedParcelParseReturn.success) {
        return {
          type: "error",
          error: { code: 'key_exchange_error', keyExchangeError: { code: 'invalid_parcel_format' }},
        };
      }
      const {verified, extension} = verifiedParcelParseReturn.data;
      setVerificationStep({type: 'verified', verified});
      if (!verified) {
        return {
          type: "error",
          error: { code: 'sender_not_verified' },
        };
      }
      const verifiedExtensionParseReturn = verifiedExtensionType.safeParse(extension);
      if (!verifiedExtensionParseReturn.success) {
        return {
          type: "error",
          error: { code: 'key_exchange_error', keyExchangeError: { code: 'invalid_parcel_format' }},
        };
      }
      return {
        type: 'key',
        key,
        protectionType: 'passwordless',
        mainPath,
        verificationCode,
        fileType: {
          mimeType: verifiedExtensionParseReturn.data.mimeType,
          fileExtension: verifiedExtensionParseReturn.data.fileExtension,
        },
      };
    }
  }
}
