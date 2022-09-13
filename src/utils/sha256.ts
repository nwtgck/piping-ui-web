import {uint8ArrayToHexString} from "binconv/dist/src/uint8ArrayToHexString";

export async function sha256(input: string): Promise<string> {
  // Calculate SHA-256
  const sha256: ArrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  // Convert array buffer to hex string
  return uint8ArrayToHexString(new Uint8Array(sha256));
}
