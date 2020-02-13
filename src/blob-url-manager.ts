/**
 * Blob URL manager for preventing memory leak
 */
export class BlobUrlManager {
  private blobUrl: string | undefined = undefined;

  set(blob: Blob) {
    this.clearIfNeed();
    this.blobUrl = URL.createObjectURL(blob);
  }

  clearIfNeed() {
    if (this.blobUrl !== undefined) {
      URL.revokeObjectURL(this.blobUrl);
    }
  }

  get url(): string | undefined {
    return this.blobUrl;
  }
}
