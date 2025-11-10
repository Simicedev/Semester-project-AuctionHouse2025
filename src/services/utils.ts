export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://v2.api.noroff.dev"
export const NOROFF_API_KEY = import.meta.env.VITE_NOROFF_API_KEY ?? "";

/**
 * Safely create a DOM element from an HTML template string.
 * @param {string} template - HTML string to convert to an element
 * @returns {HTMLElement | null} The first HTMLElement from the template, or null on failure
 * Example:
 *   const el = createHTML(`<div class="card">Hello</div>`);
 *   if (el) root.replaceChildren(el);
 */
export function createHTML(template: string): HTMLElement | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.trim(), "text/html");
    return (doc.body.firstElementChild as HTMLElement) ?? null;
  } catch {
    return null;
  }
}
