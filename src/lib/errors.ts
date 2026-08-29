/**
 * Standardised API error classes for GiftingOps
 * All API routes throw these; the withAuth wrapper catches them.
 */

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized. Please sign in.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends ApiError {
  constructor(entity = "Resource") {
    super(`${entity} not found.`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = "Validation failed.",
    public readonly details?: unknown
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class ConflictError extends ApiError {
  constructor(message = "A conflict occurred.") {
    super(message, 409, "CONFLICT");
  }
}

/** Narrows unknown catch values to ApiError */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
