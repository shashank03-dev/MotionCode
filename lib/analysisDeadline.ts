// The browser deadline includes frame preparation, the API call, and body reads.
// Leave time beyond each plan's server model budget for auth and transport.
export const ANALYSIS_TIMEOUT_MS = 65_000;

export async function withAnalysisDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  timeoutMs = ANALYSIS_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  if (signal?.aborted) {
    throw new DOMException("Analysis cancelled.", "AbortError");
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const interrupted = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Analysis took too long. Please retry; your frames are still ready."));
      controller.abort();
    }, timeoutMs);
    onAbort = () => {
      reject(new DOMException("Analysis cancelled.", "AbortError"));
      controller.abort();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([operation(controller.signal), interrupted]);
  } finally {
    clearTimeout(timer);
    if (onAbort) signal?.removeEventListener("abort", onAbort);
  }
}
