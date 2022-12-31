/**
 * Feature detection whether ReadableStream is Transferable or not
 */
export function canTransferReadableStream(): boolean {
  // const messageChannel = new MessageChannel();
  // const r = new ReadableStream();
  // try {
  //   messageChannel.port1.postMessage(r, {
  //     transfer: [r] as any as Transferable[],
  //   });
  //   return true;
  // } catch (e) {
  //   // Safari causes an error "DataCloneError: The object can not be cloned."
  //   return false;
  // }
  return false;
}
