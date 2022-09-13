import {range} from "@/utils/range";

// Whether text or not. Based on file (1) behavior
// (from: https://stackoverflow.com/a/7392391/2885946)
export function uint8ArrayIsText(array: Uint8Array): boolean {
  const textChars: ReadonlyArray<number> = [7, 8, 9, 10, 12, 13, 27, ...range(0x20, 0xff)];
  return array.every(e => textChars.includes(e));
}
