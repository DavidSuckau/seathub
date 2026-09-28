"use client";

import { useParams } from "next/navigation";
import { ProjectDetailView } from "@/components/ProjectDetailView";

/** Seed-Projekte: vorgerenderte /projects/[id]/ – neue IDs nutzen /projects/view/?id= */
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  return <ProjectDetailView projectId={params.id} />;
}
