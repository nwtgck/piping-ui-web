import urlJoin from "url-join";

// Check fetch() upload streaming support with Piping Server
export async function supportsFetchUploadStreaming(pipingServerUrl: string): Promise<boolean> {
  try {
    const stream = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array([65, 66, 67]));
        controller.close();
      }
    });
    const path = Math.random().toString(36).slice(-8);
    const url = urlJoin(pipingServerUrl, path)
    const postResPromise: Promise<Response | "fetch_error"> = fetch(url, {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit)
      // Without this, Safari causes an error "Unhandled Promise Rejection: NotSupportedError: ReadableStream uploading is not supported"
      .catch(() => "fetch_error");
    const getResPromise = fetch(url);
    const postRes = await postResPromise;
    if (postRes === "fetch_error") {
      return false;
    }
    if (postRes.status !== 200) {
      return false;
    }
    const getRes = await getResPromise;
    if (getRes.status !== 200) {
      return false;
    }
    const text = await getRes.text();
    return text === 'ABC';
  } catch (e) {
    console.error("failed to detect fetch upload streaming", e);
    return false;
  }
}
