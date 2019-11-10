import {KeyExchangeParcel, keyExchangeParcelFormat} from "@/datatypes";
import {validatingParse} from 'ts-json-validator';

const FileSaverAsync = () => import('file-saver');
const urlJoinAsync = () => import('url-join').then(p => p.default);
const binconvAsync = () => import('binconv');
const swDownloadAsync = () => import("@/sw-download");
const utilsAsync = () => import("@/utils");

// Decrypt & Download
export async function decryptingDownload(
  {downloadUrl, fileName, enablePasswordProtection, password, decryptErrorMessage}:
  {downloadUrl: string, fileName: string, enablePasswordProtection: boolean, password: string, decryptErrorMessage: string}
) {
  const swDownload = await swDownloadAsync();
  // If supporting stream-download via Service Worker
  if (await swDownload.supportsSwDownload) {
    // Create download info to tell to Service Worker
    const downloadInfo = {
      url: downloadUrl,
      filename: fileName,
      password: enablePasswordProtection ? password : '',
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
    if (enablePasswordProtection) {
      // Get response
      const res = await fetch(downloadUrl);
      const resBody = await binconv.blobToUint8Array(await res.blob());
      // Decrypt the response body
      const plain = await (await utilsAsync()).decrypt(resBody, password);
      // Save
      const FileSaver = await FileSaverAsync();
      FileSaver.saveAs(binconv.uint8ArrayToBlob(plain), fileName);
    } else {
      // Download or show on browser sometimes
      const aTag = document.createElement('a');
      aTag.href = downloadUrl;
      aTag.target = "_blank";
      aTag.download = fileName;
      aTag.click();
    }
  }
}


async function keyExchangePath(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  const utils = await utilsAsync();
  return utils.sha256(`${secretPath}/key_exchange/${type}`);
}

export async function keyExchange(serverUrl: string, type: 'sender' | 'receiver', secretPath: string): Promise<Uint8Array | {errorMessage: string}> {
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
    // TODO: i8n
    return {errorMessage: 'Key exchange format is invalid'};
  }
  if (KEY_EXCHANGE_VERSION !== peerPublicKeyExchange.version) {
    // TODO: i8n
    return {errorMessage: 'Key exchange versions are not same'};
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
  return new Uint8Array(keyBits);
}
