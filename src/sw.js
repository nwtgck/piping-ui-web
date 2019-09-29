// (from: https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)

importScripts('openpgp/openpgp.min.js');

// This is the code piece that GenerateSW mode can't provide for us.
// This code listens for the user's confirmation to update the app.
self.addEventListener('message', (e) => {
  if (!e.data) {
    return;
  }

  switch (e.data) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    default:
      // NOOP
      break;
  }
});

// Support for stream download
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/sw-download-support') {
    // Return "OK"
    event.respondWith(new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([79, 75]));
          controller.close();
        }
      })
    ));
  } else if (url.pathname === '/sw-download') {
    // Get download info
    const downloadInfo = JSON.parse(decodeURIComponent(url.hash.substring(1)));
    if (!("url" in downloadInfo)) {
      console.error('downloadInfo.url is missing');
      return;
    }
    if (!("filename" in downloadInfo)) {
      console.error('downloadInfo.filename is missing');
      return;
    }
    // NOTE: .password should always be required
    //       .password === '' means non-password protection
    if (!("password" in downloadInfo)) {
      console.error('downloadInfo.password is missing');
      return;
    }
    const targetUrl = downloadInfo.url;
    let filename = downloadInfo.filename;
    const password = downloadInfo.password;

    event.respondWith((async () => {
      const res = await fetch(targetUrl);
      const headers = new Headers([...res.headers.entries()]);
      // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
      // Make filename RFC5987 compatible
      filename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
      headers.set('Content-Disposition', "attachment; filename*=UTF-8''" + filename);
      // Plain ReadableStream
      const plainStream = await (async () => {
        // If password protection is disabled
        if (password === '') {
          return res.body;
        } else {
          // Decrypt the response body
          const decrypted = await openpgp.decrypt({
            message: await openpgp.message.read(res.body),
            passwords: [password],
            format: 'binary'
          });
          return decrypted.data;
        }
      })();
      const downloadableRes = new Response(plainStream, {
        headers
      });
      return downloadableRes;
    })());
  }
});

workbox.core.clientsClaim();

// The precaching code provided by Workbox.
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
