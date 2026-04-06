const sanitizeHtml = require('sanitize-html');

// Strips all HTML tags and attributes — plain text only
function sanitize(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

module.exports = sanitize;