"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Sun, Moon, Menu, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@prisma/client";

/** Matches the sidebar section + item labels for consistent breadcrumb-style titles */
const PAGE_TITLES: Record<string, { title: string; section: string; description?: string }> = {
  "/dashboard":     { title: "Operations Hub",        section: "Command Center",   description: "Live operational overview" },
  "/leads":         { title: "Leads & Enquiries",     section: "Sales & CRM",      description: "Prospect pipeline" },
  "/quotations":    { title: "Quotations",            section: "Sales & CRM",      description: "Proposals & approvals" },
  "/samples":       { title: "Sample Requests",       section: "Sales & CRM",      description: "In-progress samples" },
  "/orders":        { title: "All Orders",            section: "Order Management", description: "Full order pipeline" },
  "/production":    { title: "Production Planning",   section: "Production",       description: "Batches & schedule" },
  "/packing":       { title: "Packing",               section: "Production",       description: "Box & gift assembly" },
  "/qc":            { title: "QC Inspection",         section: "Production",       description: "Quality checks" },
  "/dispatch":      { title: "Dispatch & Delivery",   section: "Production",       description: "Shipments & tracking" },
  "/inventory":     { title: "Inventory & Store",     section: "Procurement",      description: "Stock levels & alerts" },
  "/vendors":       { title: "Vendors & POs",         section: "Procurement",      description: "Purchase orders" },
  "/payments":      { title: "Payments",              section: "Finance",          description: "Collections & dues" },
  "/accounts":      { title: "Accounts & Billing",   section: "Finance",          description: "P&L & reconciliation" },
  "/reports":       { title: "Reports & MIS",         section: "Insights",         description: "Analytics & exports" },
  "/feedback":      { title: "Client Feedback",       section: "Insights",         description: "Reviews & NPS" },
  "/notifications": { title: "Notifications",         section: "System",           description: "Alerts & updates" },
  "/settings":      { title: "Settings",              section: "System",           description: "Roles & configuration" },
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname       = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const user = session?.user;
  const role = ((user as any)?.role as Role) ?? "SALES";
  const displayName    = user?.name ?? "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const pageKey = Object.keys(PAGE_TITLES).find((key) =>
    pathname === key || pathname.startsWith(key + "/")
  );
  const page = pageKey ? PAGE_TITLES[pageKey] : { title: "GiftingOps", section: "", description: undefined };

  return (
    <header className="h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3 px-4 sticky top-0 z-40 flex-shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title — desktop */}
      <div className="flex-1 min-w-0 hidden md:block">
        <div className="flex items-baseline gap-1.5">
          {page.section && (
            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider hidden lg:inline">
              {page.section} /
            </span>
          )}
          <h1 className="text-sm font-semibold leading-none text-foreground">{page.title}</h1>
        </div>
        {page.description && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{page.description}</p>
        )}
      </div>

      {/* Page title — mobile */}
      <div className="flex-1 md:hidden">
        <h1 className="text-sm font-semibold">{page.title}</h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search orders, leads..."
            className="pl-8 h-8 w-56 text-xs bg-muted/40 border-transparent focus:border-border focus:bg-background transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground" asChild>
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
            {/* Static dot — sidebar has live count from /api/nav/counts */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 border border-background" />
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-muted transition-colors ml-0.5 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">{displayInitial}</span>
              </div>
              <span className="hidden sm:inline text-xs font-medium text-foreground max-w-[100px] truncate">
                {displayName.split(" ")[0]}
              </span>
              <ChevronDown className="hidden sm:inline w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {ROLE_LABELS[role]}
              </span>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="text-sm cursor-pointer">Profile settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-sm cursor-pointer">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
