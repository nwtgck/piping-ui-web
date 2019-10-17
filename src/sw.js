// (from: https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)

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
    const targetUrl = url.searchParams.get('url');
    let filename = url.searchParams.get('filename');

    event.respondWith((async () => {
      const res = await fetch(targetUrl);
      const headers = new Headers([...res.headers.entries()]);
      // (from: https://github.com/jimmywarting/StreamSaver.js/blob/314e64b8984484a3e8d39822c9b86a345eb36454/sw.js#L120-L122)
      // Make filename RFC5987 compatible
      filename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
      headers.set('Content-Disposition', "attachment; filename*=UTF-8''" + filename);
      const downloadableRes = new Response(res.body, {
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
