type DataMeta = {
  fileName: string | undefined,
  fileExtension: string | undefined,
};

export function decideFileName({ topPriorityDataMeta, secretPath, sniffedFileExtension }: { topPriorityDataMeta: DataMeta | undefined, secretPath: string, sniffedFileExtension: string | undefined } ): string {
  if (topPriorityDataMeta !== undefined && topPriorityDataMeta.fileName !== undefined) {
    return topPriorityDataMeta.fileName;
  }
  const fileExtension: string | undefined = topPriorityDataMeta?.fileExtension ?? sniffedFileExtension;
  let fileName = secretPath;
  if (fileExtension !== undefined && !fileName.match(/^.+\..+$/)) {
    fileName = `${fileName}.${fileExtension}`;
  }
  return fileName;
}
