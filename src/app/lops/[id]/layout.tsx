import { seedStaticParams } from "@/lib/static-params";

export function generateStaticParams() {
  return seedStaticParams().lops;
}

export default function LopIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
