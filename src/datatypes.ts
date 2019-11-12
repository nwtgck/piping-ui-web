import {bool, num, str, literal, opt, arr, obj, TsType} from 'ts-json-validator';

export type Protection = NoProtection | PasswordProtection| PasswordlessProtection;
type NoProtection = {
  type: 'raw'
};
type PasswordProtection = {
  type: 'password',
  password: string,
};
// Password-inputless protection
type PasswordlessProtection = {
  type: 'passwordless',
};

const rsaOtherPrimesInfoFormat = obj({
  d: opt(str),
  r: opt(str),
  t: opt(str),
});
const ecJsonWebKeyFormat = obj({
  alg: opt(str),
  crv: opt(str),
  d: opt(str),
  dp: opt(str),
  dq: opt(str),
  e: opt(str),
  ext: opt(bool),
  k: opt(str),
  key_ops: opt(arr(str)),
  kty: literal('EC' as const),
  n: opt(str),
  oth: opt(arr(rsaOtherPrimesInfoFormat)),
  p: opt(str),
  q: opt(str),
  qi: opt(str),
  use: opt(str),
  x: opt(str),
  y: opt(str),
});
export const keyExchangeParcelFormat = obj({
  version: num,
  // Public JWK for encryption
  encryptPublicJwk: ecJsonWebKeyFormat,
});
export type KeyExchangeParcel = TsType<typeof keyExchangeParcelFormat>;

export const verifiedParcelFormat = obj({
  verified: bool,
});
export type VerifiedParcel = TsType<typeof verifiedParcelFormat>;
