"use client";

import { useState } from "react";
import { CreateOrderWizard } from "@/components/CreateOrderWizard";
import { Button } from "@/components/ui";
import type { Part, Task } from "@/lib/types";

export function CreatePartOrderForm({
  part,
  onCreated,
}: {
  part: Part;
  onCreated?: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Auftrag zum Bauteil</Button>;
  }

  return (
    <CreateOrderWizard
      part={part}
      title="Auftrag zum Bauteil einstellen"
      onCancel={() => setOpen(false)}
      onCreated={(t) => {
        setOpen(false);
        onCreated?.(t);
      }}
    />
  );
}
