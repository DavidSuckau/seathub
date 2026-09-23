"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PartDetailView } from "@/components/PartDetailView";
import { Button, Panel } from "@/components/ui";

function PartViewInner() {
  const search = useSearchParams();
  const id = search.get("id");

  if (!id) {
    return (
      <Panel>
        <p className="text-sm text-[var(--muted)]">Kein Bauteil gewählt.</p>
        <Link href="/projects/" className="mt-3 inline-block">
          <Button variant="secondary">Zu Projekten</Button>
        </Link>
      </Panel>
    );
  }

  return <PartDetailView partId={id} />;
}

export default function PartViewPage() {
  return (
    <Suspense
      fallback={
        <Panel>
          <p className="text-sm text-[var(--muted)]">Bauteil wird geladen…</p>
        </Panel>
      }
    >
      <PartViewInner />
    </Suspense>
  );
}
