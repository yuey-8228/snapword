/**
 * Resolve a path to a file in /public against the app's base URL.
 *
 * Vite rewrites asset paths in index.html, but NOT string paths built at
 * runtime in JSX (e.g. `src="/elements/x.png"`). Under GitHub Pages the app is
 * served from /snapword/, so those bare-absolute paths 404. Wrap them with
 * asset() so they resolve correctly in both dev ('/') and Pages ('/snapword/').
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL; // '/' in dev, '/snapword/' on Pages
  return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}
