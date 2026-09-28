"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectDetailView } from "@/components/ProjectDetailView";
import { projectPath } from "@/lib/nav";

/**
 * Legacy-Route für Seed-IDs (generateStaticParams).
 * Neue IDs → Soft-Redirect auf /projects/view/?id=
 * (auf GH Pages greift für unbekannte IDs zusätzlich public/404.html)
 */
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    if (id) router.replace(projectPath(id));
  }, [id, router]);

  if (!id) return null;
  return <ProjectDetailView projectId={id} />;
}
