import type { NextConfig } from "next";

/**
 * GitHub Pages: Projektseite unter https://<user>.github.io/<repo>/
 * Lokal und `next dev` ohne basePath.
 */
const isGhPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "SeatHub";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGhPages
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
};

export default nextConfig;
