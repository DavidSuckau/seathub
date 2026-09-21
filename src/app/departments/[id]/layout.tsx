import { seedStaticParams } from "@/lib/static-params";

export function generateStaticParams() {
  return seedStaticParams().departments;
}

export default function DepartmentIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
