export function readableBytesString(bytes: number, fractionDigits: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let n = 1;
  let prevBytes = bytes;
  for (const [idx, unit] of units.entries()) {
    n *= 1024;
    const div = bytes / n;
    if (div < 1 || idx === units.length - 1) {
      return `${prevBytes.toFixed(fractionDigits)}${unit}`;
    }
    prevBytes = div;
  }
  // NOTE: Never execute
  return '';
}
