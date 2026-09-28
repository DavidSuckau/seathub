"use client";

import { useParams } from "next/navigation";
import { LopDetailView } from "@/components/LopDetailView";

/** Seed-LOPs: vorgerenderte /lops/[id]/ – neue IDs nutzen /lops/view/?id= */
export default function LopDetailPage() {
  const params = useParams<{ id: string }>();
  return <LopDetailView lopId={params.id} />;
}
