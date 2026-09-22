"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Home = Einstieg in den rollenbasierten Arbeitsplatz */
export default function HomePage() {
  const router = useRouter();
  const { state, hydrated } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    switch (state.demoRole) {
      case "extern":
        router.replace("/external");
        break;
      case "manager":
        router.replace("/management");
        break;
      default:
        router.replace("/dashboard");
    }
  }, [hydrated, state.demoRole, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-[var(--ink-muted)]">SeatHub wird geladen…</p>
    </div>
  );
}
