/**
 * Server-side session helpers for GiftingOps pages.
 *
 * Use these in async server components (page.tsx) to get the current user
 * and perform permission checks without duplicating boilerplate.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, type Module } from "@/lib/permissions";

// ─── Get current session (or redirect to /login) ──────────────────────────────

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

// ─── Get current user (or redirect) ──────────────────────────────────────────

export async function getCurrentUser() {
  const session = await requireSession();
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

// ─── Require session + module permission ──────────────────────────────────────

export async function requirePermission(module: Module) {
  const session = await requireSession();
  const { role } = session.user;

  if (!hasPermission(role, module)) {
    // Return null — let the page render AccessDenied
    return { session, hasAccess: false } as const;
  }

  return { session, hasAccess: true } as const;
}

// ─── Type for current user prop passed to client components ──────────────────

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};
