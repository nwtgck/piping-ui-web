import JSZip from "jszip";
import {baseAndExt} from "@/utils/baseAndExt";

export async function zipFilesAsReadableStream(files: readonly File[]): Promise<ReadableStream<Uint8Array>> {
  const zip = new JSZip();
  // NOTE: Should not be null because it is new folder
  const directory = zip.folder('files')!;
  for (const file of files) {
    // Name not-duplicate name
    const name: string = (() => {
      let name: string = file.name;
      const {baseName, ext} = baseAndExt(file.name);
      // Loop until the file name is new
      for (let n = 1; directory.file(name) !== null; n++) {
        name = `${baseName}__${n}${ext}`;
      }
      return name;
    })();
    // Add file
    directory.file(name, file);
  }

  return new ReadableStream<Uint8Array>({
    start(ctrl) {
      // (base: https://github.com/Stuk/jszip/issues/345#issuecomment-242940379)
      directory.generateInternalStream({type: "uint8array"})
        .on('data', data => ctrl.enqueue(data))
        .on('error', err => ctrl.error(err))
        .on('end', () => ctrl.close())
        .resume();
    },
  });
}
