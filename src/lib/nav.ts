/**
 * Hard navigations (window.location) müssen den GitHub-Pages-basePath kennen.
 * Next <Link> / router.push machen das automatisch – window.location nicht.
 */
export function withBasePath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!path.startsWith("/")) return `${base}/${path}`;
  if (!base) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

/** Client-Navigation inkl. basePath (Pages-Deploy). */
export function navigate(path: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(withBasePath(path));
}
