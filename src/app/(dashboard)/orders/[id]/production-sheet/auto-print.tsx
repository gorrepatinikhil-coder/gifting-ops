"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AutoPrint({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (auto && typeof window !== "undefined") {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [auto]);

  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="w-3.5 h-3.5" />
      Print / Save PDF
    </Button>
  );
}
