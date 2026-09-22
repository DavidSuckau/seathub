"use client";

import { useState } from "react";
import { CreateOrderWizard } from "@/components/CreateOrderWizard";
import { Button, Modal } from "@/components/ui";
import type { Part, Task } from "@/lib/types";

export function CreatePartOrderForm({
  part,
  onCreated,
}: {
  part: Part;
  onCreated?: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Auftrag zum Bauteil</Button>
      {open ? (
        <Modal
          title={`Auftrag · ${part.partNumber}`}
          size="xl"
          onClose={() => setOpen(false)}
        >
          <CreateOrderWizard
            part={part}
            embedded
            onCancel={() => setOpen(false)}
            onCreated={(t) => {
              setOpen(false);
              onCreated?.(t);
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}
