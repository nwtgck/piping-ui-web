import {z} from "zod";

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

const rsaOtherPrimesInfoType = z.object({
  d: z.string(),
  r: z.string(),
  t: z.string(),
}).partial();

export const jsonWebKeyType = z.object({
  alg: z.string(),
  crv: z.string(),
  d: z.string(),
  dp: z.string(),
  dq: z.string(),
  e: z.string(),
  ext: z.boolean(),
  k: z.string(),
  key_ops: z.array(z.string()),
  n: z.string(),
  oth: z.array(rsaOtherPrimesInfoType),
  p: z.string(),
  q: z.string(),
  qi: z.string(),
  use: z.string(),
  x: z.string(),
  y: z.string(),
}).partial()
  .passthrough();

export const ecJsonWebKeyType = z.intersection(
  z.object({
    kty: z.literal('EC'),
  }),
  jsonWebKeyType,
);
