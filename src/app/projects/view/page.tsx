"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProjectDetailView } from "@/components/ProjectDetailView";
import { Button, Panel } from "@/components/ui";

function ProjectViewInner() {
  const search = useSearchParams();
  const id = search.get("id");

  if (!id) {
    return (
      <Panel>
        <p className="text-sm text-[var(--ink-muted)]">Kein Projekt gewählt.</p>
        <Link href="/projects/" className="mt-3 inline-block">
          <Button variant="secondary">Zu Projekten</Button>
        </Link>
      </Panel>
    );
  }

  return <ProjectDetailView projectId={id} />;
}

export default function ProjectViewPage() {
  return (
    <Suspense
      fallback={
        <Panel>
          <p className="text-sm text-[var(--ink-muted)]">Projekt wird geladen…</p>
        </Panel>
      }
    >
      <ProjectViewInner />
    </Suspense>
  );
}
