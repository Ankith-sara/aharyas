/**
 * Strip malicious script tags, event handlers, javascript URIs, and dangerous attributes from HTML strings.
 * Safe for rich text fields like product descriptions.
 */
export const sanitizeHtml = (html) => {
    if (typeof html !== 'string') return html;
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
        .replace(/\son\w+\s*=\s*[^>\s]+/gi, '')
        .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"')
        .replace(/src\s*=\s*(['"])javascript:.*?\1/gi, 'src=""');
};

/**
 * Strip all HTML tags entirely for plain text inputs (names, titles, labels, addresses).
 */
export const sanitizeString = (val) => {
    if (typeof val !== 'string') return val;
    return val.trim().replace(/<[^>]*>/g, '');
};
