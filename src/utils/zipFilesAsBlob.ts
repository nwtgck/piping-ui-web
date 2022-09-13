import JSZip from "jszip";
import {baseAndExt} from "@/utils/baseAndExt";
import {type ActualFileObject} from "filepond";

export async function zipFilesAsBlob(files: ActualFileObject[]): Promise<Blob> {
  const zip = new JSZip();
  // NOTE: Should not be null because it is new folder
  const directory = zip.folder('files')!;
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
  return directory.generateAsync({type: "blob"});
}
