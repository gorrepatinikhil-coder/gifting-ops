"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "right" | "left";
  className?: string;
}

export function Sheet({ open, onClose, children, side = "right", className }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-background border-border shadow-2xl",
          "transition-transform duration-300 ease-out will-change-transform",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          open
            ? "translate-x-0"
            : side === "right" ? "translate-x-full" : "-translate-x-full",
          className ?? "w-[520px] max-w-[calc(100vw-1rem)]"
        )}
      >
        {children}
      </div>
    </>
  );
}

export function SheetHeader({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-6 py-5 border-b border-border flex-shrink-0", className)}>
      <div className="flex-1 min-w-0">{children}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-base font-semibold leading-tight", className)}>{children}</h2>;
}

export function SheetDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground mt-0.5", className)}>{children}</p>;
}

export function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}

export function SheetFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex-shrink-0 px-6 py-4 border-t border-border bg-muted/20 flex items-center gap-3", className)}>
      {children}
    </div>
  );
}

export function SheetSection({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-5 border-b border-border/60 last:border-0", className)}>
      {title && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
