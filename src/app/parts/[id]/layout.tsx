import { seedStaticParams } from "@/lib/static-params";

export function generateStaticParams() {
  return seedStaticParams().parts;
}

export default function PartIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
