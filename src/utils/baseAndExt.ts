export function baseAndExt(name: string): { baseName: string, ext: string } {
  const m = name.match(/(.*)(\..*?)$/);
  if (m === null) {
    return {baseName: '', ext: ''};
  } else {
    return {baseName: m[1], ext: m[2]};
  }
}
