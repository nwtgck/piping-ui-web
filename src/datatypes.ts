import * as t from 'io-ts';

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
  alwaysSendVerify: boolean,
};

const rsaOtherPrimesInfoType = t.partial({
  d: t.string,
  r: t.string,
  t: t.string,
});
export const jsonWebKeyType = t.partial({
  alg: t.string,
  crv: t.string,
  d: t.string,
  dp: t.string,
  dq: t.string,
  e: t.string,
  ext: t.boolean,
  k: t.string,
  key_ops: t.array(t.string),
  n: t.string,
  oth: t.array(rsaOtherPrimesInfoType),
  p: t.string,
  q: t.string,
  qi: t.string,
  use: t.string,
  x: t.string,
  y: t.string,
});
export const ecJsonWebKeyType = t.intersection([
  t.type({
    kty: t.literal('EC'),
  }),
  jsonWebKeyType,
]);
