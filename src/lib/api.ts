/**
 * API route helpers for GiftingOps.
 *
 * withAuth(handler)     — wraps a route handler; injects the session;
 *                         returns 401 if unauthenticated, 500 on unhandled errors.
 * ok(data, status?)    — 200/201 JSON response
 * err(msg, status?)    — error JSON response
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import type { Session } from "next-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthedHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>>; session: Session }
) => Promise<NextResponse>;

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 500, code?: string): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

// ─── Route wrapper ────────────────────────────────────────────────────────────

/**
 * Wraps a handler with:
 * 1. Auth check (returns 401 if no session)
 * 2. Centralised error handling (ApiError → proper status, else 500)
 */
export function withAuth(
  handler: (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>>; session: Session }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session) {
      return err("Unauthorized. Please sign in.", 401, "UNAUTHORIZED");
    }

    try {
      return await handler(req, { ...ctx, session });
    } catch (e) {
      if (e instanceof ApiError) {
        return err(e.message, e.statusCode, e.code);
      }
      // Log unexpected errors in development
      if (process.env.NODE_ENV !== "production") {
        console.error("[API Error]", e);
      }
      return err("An unexpected error occurred. Please try again.", 500, "INTERNAL_ERROR");
    }
  };
}

// ─── Role guard helper ────────────────────────────────────────────────────────

import { ForbiddenError } from "@/lib/errors";
import type { Role } from "@prisma/client";

export function requireRole(sessionRole: Role, allowed: Role[]): void {
  if (!allowed.includes(sessionRole)) {
    throw new ForbiddenError();
  }
}

// ─── Pagination helper ────────────────────────────────────────────────────────

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasMore: page * pageSize < total,
  };
}
