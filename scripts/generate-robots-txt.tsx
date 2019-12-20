// NOTE: When $SITE_URL is defined, robots.txt should be printed to stdout.
import urlJoin from "url-join";

const robotsTxt: string = (
`User-agent: *
Disallow:
${process.env.SITE_URL ? `\nSitemap: ${urlJoin(process.env.SITE_URL, "sitemap.xml")}` : ""}`);

// Print robots.txt
console.log(robotsTxt);
