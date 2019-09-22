import JSZip from "jszip";

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

export function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsText(blob);
    reader.onload = () => {
      resolve(reader.result as string);
    }
  });
}

export function baseAndExt(name: string): {baseName: string, ext: string} {
  const m = name.match(/(.*)(\..*?)$/);
  if (m === null) {
    return {baseName: '', ext: ''};
  } else {
    return {baseName: m[1], ext: m[2]};
  }
}

export function zipFilesAsBlob(files: File[]): Promise<Blob> {
  const zip = JSZip();
  const directory = zip.folder('files');
  for (const file of files) {
    // Name not-duplicate name
    const name: string = (() => {
      let name: string = file.name;
      let {baseName, ext} = baseAndExt(file.name);
      // Loop until the file name is new
      for (let n = 1; directory.file(name) !== null; n++) {
        name = `${baseName}__${n}${ext}`;
      }
      return name;
    })();
    // Add file
    directory.file(name, file);
  }
  return directory.generateAsync({type : "blob"});
}
