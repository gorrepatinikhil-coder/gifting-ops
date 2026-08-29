import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/lib/mock-data";

interface AccessDeniedProps {
  role: Role;
  pageName?: string;
}

export function AccessDenied({ role, pageName }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <ShieldOff className="w-7 h-7 text-muted-foreground/50" />
      </div>
      <h2 className="text-lg font-semibold mb-1.5">Access Restricted</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {pageName
          ? `The ${pageName} page is not available for your role.`
          : "You don't have permission to view this page."}
        {" "}Your current role is <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-6">
        <Link href="/dashboard">← Back to Dashboard</Link>
      </Button>
    </div>
  );
}
