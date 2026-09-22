"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TaskDetailView } from "@/components/TaskDetailView";
import { Button, Panel } from "@/components/ui";

function TaskViewInner() {
  const search = useSearchParams();
  const id = search.get("id");

  if (!id) {
    return (
      <Panel>
        <p className="text-sm text-[var(--muted)]">Kein Auftrag gewählt.</p>
        <Link href="/tasks/" className="mt-3 inline-block">
          <Button variant="secondary">Zur Auftragsliste</Button>
        </Link>
      </Panel>
    );
  }

  return <TaskDetailView taskId={id} />;
}

export default function TaskViewPage() {
  return (
    <Suspense
      fallback={
        <Panel>
          <p className="text-sm text-[var(--muted)]">Auftrag wird geladen…</p>
        </Panel>
      }
    >
      <TaskViewInner />
    </Suspense>
  );
}
