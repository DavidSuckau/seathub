"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { TaskDetailView } from "@/components/TaskDetailView";
import { taskPath } from "@/lib/nav";

/**
 * Legacy-Route für seed-IDs (generateStaticParams).
 * Neue/dynamische IDs → Soft-Redirect auf /tasks/view/?id=
 */
export default function TaskByIdPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    if (id) router.replace(taskPath(id));
  }, [id, router]);

  if (!id) return null;
  return <TaskDetailView taskId={id} />;
}
