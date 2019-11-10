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
  // Ephemeral password
  password: Uint8Array,
};
