import sanitizeHtml from "sanitize-html";

// Sanitize html, allowing <a> tag
export function sanitizeHtmlAllowingATag(dirtyHtml: string): string {
  return sanitizeHtml(dirtyHtml, {
    allowedTags: ['a'],
    allowedAttributes: {
      'a': ['href', 'target']
    },
    disallowedTagsMode: 'escape',
  });
}
