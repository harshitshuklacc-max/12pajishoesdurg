"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" className="print:hidden" onClick={() => window.print()}>
      Print invoice
    </Button>
  );
}
