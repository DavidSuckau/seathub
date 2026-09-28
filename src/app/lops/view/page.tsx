"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LopDetailView } from "@/components/LopDetailView";
import { Button, Panel } from "@/components/ui";

function LopViewInner() {
  const search = useSearchParams();
  const id = search.get("id");

  if (!id) {
    return (
      <Panel>
        <p className="text-sm text-[var(--ink-muted)]">Kein LOP gewählt.</p>
        <Link href="/lops/" className="mt-3 inline-block">
          <Button variant="secondary">Zur LOP-Liste</Button>
        </Link>
      </Panel>
    );
  }

  return <LopDetailView lopId={id} />;
}

export default function LopViewPage() {
  return (
    <Suspense
      fallback={
        <Panel>
          <p className="text-sm text-[var(--ink-muted)]">LOP wird geladen…</p>
        </Panel>
      }
    >
      <LopViewInner />
    </Suspense>
  );
}
