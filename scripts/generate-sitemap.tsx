// NOTE: When $SITE_URL is defined, sitemap XML should be printed to stdout.
import * as React from 'react';
import {ReactElement} from "react";
import {renderToString} from 'react-dom/server';
import constants from '../src/constants';

// (from: https://github.com/Microsoft/TypeScript/issues/15449#issuecomment-298104181)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

function renderXmlToString(xml: ReactElement): string {
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + renderToString(xml);
}

function urlWithLang(siteUrl: string, lang: string): string {
  const url = new URL(siteUrl);
  url.searchParams.set(constants.langQueryParameterName, lang);
  return url.href;
}

// XML support: (from: https://itnext.io/using-react-for-xml-svg-470792625278)
const XhtmlLink = ({ children, ...props }: any) => {
  return React.createElement("xhtml:link", props, children);
};

// Localized: (from: https://support.google.com/webmasters/answer/189077)
const sitemap: string = (() => {
  if (process.env.SITE_URL) {
    const siteUrl = process.env.SITE_URL;
    const sitemapElement = <urlset
      xmlns={"http://www.sitemaps.org/schemas/sitemap/0.9"}
      {...{"xmlns:xhtml": "http://www.w3.org/1999/xhtml"}}>
      <url>
        <loc>{new URL(siteUrl).href}</loc>
        <XhtmlLink rel="alternate" hreflang="en" href={urlWithLang(siteUrl, "en")} />
        <XhtmlLink rel="alternate" hreflang="ja" href={urlWithLang(siteUrl, "ja")} />
      </url>
    </urlset>;
    return renderXmlToString(sitemapElement);
  } else {
    return "";
  }
})();

// Print sitemap XML
console.log(sitemap);
