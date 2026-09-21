import { seedStaticParams } from "@/lib/static-params";

export function generateStaticParams() {
  return seedStaticParams().tasks;
}

export default function TaskIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
