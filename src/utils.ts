type SendByInlineMultipartCallbacks = {
  onProgress(progress: number): void;
  onError(): void;
};

/**
 * Send data to Piping Server by multipart with "Content-Disposition: inline"
 *
 * NOTE: When Piping Server < 0.9.4, it does not support preflight request.
 * NOTE: By using FormData, there is no way to set "Content-Disposition: inline" in my search.
 * Thus, this implementation resolve the issues above, sending data to Piping Server < 0.9.4 and receiver can get data inline in browser.
 * @param url
 * @param data
 * @param callbacks
 */
export function sendByInlineMultipart(url: string, data: string | File, callbacks: SendByInlineMultipartCallbacks): void {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  // TODO: Generate randomly
  const boundary = "----WebKitFormBoundayO5quBRiT4G7Vm3R7";
  xhr.setRequestHeader("Content-Type", `multipart/form-data; boundary=${boundary}`);
  // Get data length
  const {contentLength, contentType} = (() => {
    switch (typeof data) {
      case 'string':
        return {
          contentLength: url.length,
          contentType: 'text/plain',
        };
      default:
        return {
          contentLength: data.size,
          contentType: data.type,
        };
    }
  })();

  const body = new Blob([
    `--${boundary}\r\n`,
    "Content-Disposition: inline\r\n",
    `Content-Type: ${contentType}\r\n`,
    `Content-Size: ${contentLength}\r\n`,
    "\r\n",
    data,
    "\r\n",
    `--${boundary}--\r\n`
  ]);

  xhr.upload.onprogress = (ev) => {
    const progress = ev.loaded / ev.total * 100;
    callbacks.onProgress(progress);
  };

  xhr.upload.onerror = () => {
    callbacks.onError()
  };

  xhr.onreadystatechange = () => {
    // Send finished
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      callbacks.onProgress(100);
    }
  };

  xhr.send(body);
}
