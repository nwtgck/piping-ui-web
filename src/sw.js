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
    const filename = url.searchParams.get('filename');

    event.respondWith((async () => {
      const res = await fetch(targetUrl);
      const headers = new Headers([...res.headers.entries()]);
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      const downloadableRes = new Response(res.body, {
        headers
      });
      return downloadableRes;
    })());
  }
});

workbox.clientsClaim();

// The precaching code provided by Workbox.
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
