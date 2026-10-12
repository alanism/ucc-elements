/**
 * Shared String Utilities
 * Escapes HTML to protect against XSS and normalizes Vietnamese diacritics.
 */

/**
 * Escapes unsafe characters for HTML rendering.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalizes text for comparison, deduplication, and search.
 * Uses Unicode Normalization Form C (NFC) for proper Vietnamese diacritics.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ');
}
