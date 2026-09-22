import type { NextConfig } from "next";

/**
 * GitHub Pages: Projektseite unter https://<user>.github.io/<repo>/
 * Lokal und `next dev` ohne basePath.
 */
const isGhPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "seathub";
const basePath = isGhPages ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath
    ? {
        basePath,
        assetPrefix: `${basePath}/`,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
