"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLogsButton({ logs }: { logs: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied" : "Copy logs"}
    </Button>
  );
}
