"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  CreditCard, ChefHat, Warehouse, Truck, ClipboardCheck,
  Star, Bell, BarChart3, Settings, Building2,
  PackageCheck, FlaskConical, Gift, LogOut, ChevronLeft,
  ChevronRight, AlertTriangle, Factory, Boxes, TrendingUp,
  Banknote, MessagesSquare, ShieldCheck, ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hasPermission, ROLE_LABELS, type Module } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { signOut } from "next-auth/react";

interface NavItem {
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  module: Module | null;
  adminOnly?: boolean;
  countKey?: string; // key into NavCounts
}

interface NavSection {
  title: string;
  accent: string;       // Tailwind color token for dot + active glow
  dotClass: string;     // color for the section indicator dot
  items: NavItem[];
}

// Live counts returned by /api/nav/counts
export interface NavCounts {
  leads?: number;
  quotations?: number;
  orders?: number;
  production?: number;
  packing?: number;
  qc?: number;
  dispatch?: number;
  inventory?: number;
  payments?: number;
  notifications?: number;
  samples?: number;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Command Center",
    accent: "brand",
    dotClass: "bg-brand-400",
    items: [
      {
        label: "Operations Hub",
        sublabel: "Live overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        module: null,
      },
    ],
  },
  {
    title: "Sales & CRM",
    accent: "blue",
    dotClass: "bg-blue-400",
    items: [
      {
        label: "Leads & Enquiries",
        sublabel: "New prospects",
        href: "/leads",
        icon: Users,
        module: "leads",
        countKey: "leads",
      },
      {
        label: "Quotations",
        sublabel: "Proposals & approvals",
        href: "/quotations",
        icon: FileText,
        module: "quotations",
        countKey: "quotations",
      },
      {
        label: "Sample Requests",
        sublabel: "In progress samples",
        href: "/samples",
        icon: FlaskConical,
        module: "samples",
        countKey: "samples",
      },
    ],
  },
  {
    title: "Order Management",
    accent: "violet",
    dotClass: "bg-violet-400",
    items: [
      {
        label: "All Orders",
        sublabel: "Full order pipeline",
        href: "/orders",
        icon: ShoppingCart,
        module: "orders",
        countKey: "orders",
      },
    ],
  },
  {
    title: "Production",
    accent: "orange",
    dotClass: "bg-orange-400",
    items: [
      {
        label: "Production Planning",
        sublabel: "Batches & schedule",
        href: "/production",
        icon: Factory,
        module: "production",
        countKey: "production",
      },
      {
        label: "Packing",
        sublabel: "Box & gift assembly",
        href: "/packing",
        icon: Boxes,
        module: "packing",
        countKey: "packing",
      },
      {
        label: "QC Inspection",
        sublabel: "Quality checks",
        href: "/qc",
        icon: ShieldCheck,
        module: "qc",
        countKey: "qc",
      },
      {
        label: "Dispatch & Delivery",
        sublabel: "Shipments & tracking",
        href: "/dispatch",
        icon: Truck,
        module: "dispatch",
        countKey: "dispatch",
      },
    ],
  },
  {
    title: "Procurement",
    accent: "teal",
    dotClass: "bg-teal-400",
    items: [
      {
        label: "Inventory & Store",
        sublabel: "Stock levels & alerts",
        href: "/inventory",
        icon: Warehouse,
        module: "inventory",
        countKey: "inventory",
      },
      {
        label: "Vendors & POs",
        sublabel: "Purchase orders",
        href: "/vendors",
        icon: Building2,
        module: "vendors",
      },
    ],
  },
  {
    title: "Finance",
    accent: "emerald",
    dotClass: "bg-emerald-400",
    items: [
      {
        label: "Payments",
        sublabel: "Collections & dues",
        href: "/payments",
        icon: Banknote,
        module: "payments",
        countKey: "payments",
      },
      {
        label: "Accounts & Billing",
        sublabel: "P&L, reconciliation",
        href: "/accounts",
        icon: BarChart3,
        module: "accounts",
      },
    ],
  },
  {
    title: "Insights",
    accent: "purple",
    dotClass: "bg-purple-400",
    items: [
      {
        label: "Reports & MIS",
        sublabel: "Analytics & exports",
        href: "/reports",
        icon: TrendingUp,
        module: "reports",
      },
      {
        label: "Client Feedback",
        sublabel: "Reviews & NPS",
        href: "/feedback",
        icon: MessagesSquare,
        module: "feedback",
      },
    ],
  },
  {
    title: "System",
    accent: "gray",
    dotClass: "bg-slate-400",
    items: [
      {
        label: "Notifications",
        sublabel: "Alerts & updates",
        href: "/notifications",
        icon: Bell,
        module: "notifications",
        countKey: "notifications",
      },
      {
        label: "Settings",
        sublabel: "Roles & config",
        href: "/settings",
        icon: Settings,
        module: null,
        adminOnly: true,
      },
    ],
  },
];

function isItemVisible(item: NavItem, role: Role): boolean {
  if (item.adminOnly) return ["ADMIN", "OWNER"].includes(role);
  if (item.module === null) return true;
  return hasPermission(role, item.module as Module);
}

// Hook: fetch live nav counts every 60 s
function useNavCounts(): NavCounts {
  const [counts, setCounts] = useState<NavCounts>({});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/nav/counts", { cache: "no-store" });
        if (res.ok && active) setCounts(await res.json());
      } catch {
        // silently skip
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return counts;
}

export function Sidebar({
  collapsed = false,
  onToggle,
  currentUser,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  currentUser?: { name: string; role: Role; email: string };
}) {
  const pathname = usePathname();
  const counts   = useNavCounts();
  const role: Role = currentUser?.role ?? "SALES";

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isItemVisible(item, role)),
  })).filter((s) => s.items.length > 0);

  const displayName    = currentUser?.name ?? "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  // Which section is currently active?
  const activeSectionTitle = visibleSections.find((s) =>
    s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.title;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar transition-all duration-200 border-r border-sidebar-border",
          collapsed ? "w-[60px]" : "w-[236px]"
        )}
      >
        {/* ─── Logo ─── */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border flex-shrink-0",
          collapsed ? "h-14 justify-center px-0" : "h-14 gap-3 px-4"
        )}>
          <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center shadow-sm shadow-brand-500/40">
            <Gift className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground font-bold text-sm leading-none tracking-tight">GiftingOps</p>
              <p className="text-sidebar-foreground/40 text-[10px] mt-0.5 tracking-wider uppercase">Command Center</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onToggle}
              className="w-5 h-5 rounded flex items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ─── Nav ─── */}
        <ScrollArea className="flex-1">
          <nav className="py-3 px-2 space-y-1">
            {visibleSections.map((section, sIdx) => {
              const isActiveSection = section.title === activeSectionTitle;
              return (
                <div key={section.title}>
                  {/* Section separator for all but first */}
                  {sIdx > 0 && !collapsed && (
                    <div className="mx-2.5 my-2 border-t border-sidebar-border/50" />
                  )}
                  {sIdx > 0 && collapsed && (
                    <div className="my-2 border-t border-sidebar-border/40" />
                  )}

                  {/* Section header */}
                  {!collapsed && (
                    <div className="flex items-center gap-1.5 px-2.5 mb-1 mt-0.5">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all",
                        section.dotClass,
                        isActiveSection ? "opacity-100 shadow-sm" : "opacity-40"
                      )} />
                      <p className={cn(
                        "text-[10px] font-semibold uppercase tracking-[0.08em] select-none transition-colors",
                        isActiveSection
                          ? "text-sidebar-foreground/70"
                          : "text-sidebar-foreground/30"
                      )}>
                        {section.title}
                      </p>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon     = item.icon;
                      const count    = item.countKey ? (counts[item.countKey as keyof NavCounts] ?? 0) : 0;
                      const hasAlert = count > 0;

                      const linkContent = (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md text-sm font-medium transition-all duration-100 group relative",
                            collapsed ? "w-9 h-9 justify-center mx-auto" : "px-2.5 py-2 h-auto min-h-[36px]",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          {/* Icon */}
                          <Icon className={cn(
                            "flex-shrink-0 transition-colors",
                            collapsed ? "w-4 h-4" : "w-3.5 h-3.5",
                            isActive ? "text-white" : ""
                          )} />

                          {/* Label + sublabel */}
                          {!collapsed && (
                            <div className="flex-1 min-w-0 py-0.5">
                              <p className="truncate text-[13px] leading-none font-medium">
                                {item.label}
                              </p>
                              {item.sublabel && (
                                <p className={cn(
                                  "text-[10px] mt-0.5 truncate leading-none font-normal",
                                  isActive ? "text-white/60" : "text-sidebar-foreground/35"
                                )}>
                                  {item.sublabel}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Count badge (expanded) */}
                          {!collapsed && hasAlert && (
                            <span className={cn(
                              "flex-shrink-0 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-semibold flex items-center justify-center px-1",
                              isActive ? "bg-white/25" : "bg-brand-500"
                            )}>
                              {count > 99 ? "99+" : count}
                            </span>
                          )}

                          {/* Count dot (collapsed) */}
                          {collapsed && hasAlert && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-500 border border-sidebar text-white text-[8px] font-bold flex items-center justify-center">
                              {count > 9 ? "9+" : count}
                            </span>
                          )}
                        </Link>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium text-xs">
                              <div>
                                <p>{item.label}</p>
                                {hasAlert && (
                                  <p className="text-brand-400 text-[10px]">{count} pending</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return linkContent;
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* ─── Footer ─── */}
        <div className="border-t border-sidebar-border p-2 flex-shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggle}
                    className="w-9 h-9 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Expand sidebar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 rounded-md bg-brand-500/20 flex items-center justify-center cursor-default">
                    <span className="text-brand-300 text-xs font-bold">{displayInitial}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <p>{displayName}</p>
                  <p className="text-muted-foreground">{ROLE_LABELS[role]}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-9 h-9 rounded-md text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Sign out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="px-1">
              <div className="flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group cursor-default">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-300 text-xs font-bold">{displayInitial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sidebar-foreground text-[13px] font-medium truncate leading-none">
                    {displayName}
                  </p>
                  <p className="text-sidebar-foreground/35 text-[10px] mt-0.5 truncate">
                    {ROLE_LABELS[role]}
                  </p>
                </div>
                <button
                  className="text-sidebar-foreground/30 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  title="Sign out"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
