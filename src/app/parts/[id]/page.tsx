"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PartDetailView } from "@/components/PartDetailView";
import { partPath } from "@/lib/nav";

/**
 * Legacy-Route für Seed-IDs (generateStaticParams).
 * Neue IDs → Soft-Redirect auf /parts/view/?id=
 */
function PartByIdInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const stand = search.get("stand") ?? undefined;

  useEffect(() => {
    if (id) router.replace(partPath(id, stand ? { stand } : undefined));
  }, [id, stand, router]);

  if (!id) return null;
  return <PartDetailView partId={id} />;
}

export default function PartByIdPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--ink-muted)]">Bauteil wird geladen…</div>}>
      <PartByIdInner />
    </Suspense>
  );
}
