import { seedStaticParams } from "@/lib/static-params";

export function generateStaticParams() {
  return seedStaticParams().projects;
}

export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
