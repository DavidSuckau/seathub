/**
 * Hard navigations (window.location) müssen den GitHub-Pages-basePath kennen.
 * Next <Link> / router.push machen das automatisch – window.location nicht.
 */
export function withBasePath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  let p = path.startsWith("/") ? path : `/${path}`;
  if (base && !(p === base || p.startsWith(`${base}/`))) {
    p = `${base}${p}`;
  }
  return ensureTrailingSlash(p);
}

/** Static export mit trailingSlash: true → Ordner-URLs brauchen Slash */
function ensureTrailingSlash(path: string): string {
  const q = path.indexOf("?");
  const pathname = q >= 0 ? path.slice(0, q) : path;
  const query = q >= 0 ? path.slice(q) : "";
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return path;
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return `${withSlash}${query}`;
}

/**
 * Auftragsdetail immer über stabile Static-URL (funktioniert auch für
 * neu angelegte IDs ohne generateStaticParams / GH Pages).
 */
export function taskPath(taskId: string): string {
  return `/tasks/view/?id=${encodeURIComponent(taskId)}`;
}

/** Bauteildetail – stabil für neu angelegte IDs auf GitHub Pages. */
export function partPath(
  partId: string,
  opts?: { stand?: string; tab?: string },
): string {
  const q = new URLSearchParams({ id: partId });
  if (opts?.stand) q.set("stand", opts.stand);
  if (opts?.tab) q.set("tab", opts.tab);
  return `/parts/view/?${q.toString()}`;
}

/** Projektdetail – stabil für neu angelegte IDs auf GitHub Pages. */
export function projectPath(projectId: string): string {
  return `/projects/view/?id=${encodeURIComponent(projectId)}`;
}

/** LOP-Detail – stabil für neu angelegte IDs auf GitHub Pages. */
export function lopPath(lopId: string): string {
  return `/lops/view/?id=${encodeURIComponent(lopId)}`;
}

/** Client-Navigation inkl. basePath (Pages-Deploy). */
export function navigate(path: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(withBasePath(path));
}

export function navigateToTask(taskId: string): void {
  navigate(taskPath(taskId));
}

export function navigateToPart(
  partId: string,
  opts?: { stand?: string; tab?: string },
): void {
  navigate(partPath(partId, opts));
}

export function navigateToProject(projectId: string): void {
  navigate(projectPath(projectId));
}

export function navigateToLop(lopId: string): void {
  navigate(lopPath(lopId));
}
