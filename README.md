# Piping UI
[![Cloudflare Pages](https://github.com/nwtgck/piping-ui-web/actions/workflows/cloudflare-pages.yml/badge.svg)](https://github.com/nwtgck/piping-ui-web/actions/workflows/cloudflare-pages.yml) [![E2E testing](https://github.com/nwtgck/piping-ui-web/actions/workflows/e2e-test.yml/badge.svg)](https://github.com/nwtgck/piping-ui-web/actions/workflows/e2e-test.yml)  
<a href="https://piping-ui.org"><img src="https://user-images.githubusercontent.com/9122190/28998409-c5bf7362-7a00-11e7-9b63-db56694522e7.png" alt="Launch now as Web App" height="48"></a>

Web UI for [Piping Server](https://github.com/nwtgck/piping-server) - Easy and secure file transfer between every device over HTTPS  
![Piping UI - iPhone to UI](doc_assets/iphone-to-ui.gif)

## Application

<https://piping-ui.org>

![Piping UI QR code](./doc_assets/piping-ui-qr.png)

## Features

- Download while uploading
- [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps) (PWA)
- Dark theme
- English/Japanese
- Multi-file sending with zip
- Auto completes for server URLs and secret paths
- Image/video preview
- Passwordless [E2E encryption] by [Elliptic-curve Diffie–Hellman] and [OpenPGP.js]
- Password protection powered by [OpenPGP.js]
- Share Sheet support by Web Share Target API

## Self-hosting

You can build Piping UI by yourself like the following.

```console
$ git clone https://github.com/nwtgck/piping-ui-web.git
$ cd piping-ui-web
$ npm ci
$ npm run build
```

Then, you can publish `./dist`.  
In addition, you can also use hosting services such as GitHub pages and Netlify.

### Change default Piping Server URLs at build-time

Set env `$PIPING_SERVER_URLS` to change default Piping Server URLs.

```console
$ PIPING_SERVER_URLS='["https://mypiping.server", "https://mypipi.ng"]' npm run build
```

![Build-time Piping Server URLs](doc_assets/build-time-piping-server-urls.png)

## Sitemap for telling about localized versions

Set env `$SITE_URL` to generate `sitemap.xml` for telling about localized versions. `robots.txt` has also `Sitemap: ...` section.  
(see: <https://support.google.com/webmasters/answer/189077>)  
(see: <https://developers.google.com/search/reference/robots_txt#google-supported-non-group-member-lines>)

```console
$ SITE_URL="https://mypiping.ui" npm run build
```

## Logo
<div>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>

[E2E encryption]: https://en.wikipedia.org/wiki/End-to-end_encryption
[Elliptic-curve Diffie–Hellman]: https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman
[OpenPGP.js]: https://github.com/openpgpjs/openpgpjs
