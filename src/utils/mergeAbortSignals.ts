export function mergeAbortSignals(s1: AbortSignal, s2: AbortSignal): AbortController {
  const abortController = new AbortController();
  s1.addEventListener("abort", (e) => {
    abortController.abort();
  }, { once: true });
  s2.addEventListener("abort", (e) => {
    abortController.abort();
  }, { once: true });
  return abortController;
}
