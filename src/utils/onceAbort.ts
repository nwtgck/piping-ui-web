export function onceAbort(abortSignal: AbortSignal, listener: (this: AbortSignal, ev: AbortSignalEventMap["abort"]) => any): () => void {
  abortSignal.addEventListener("abort", listener, { once: true });
  return () => abortSignal.removeEventListener("abort", listener);
}
