import { NextResponse } from "next/server";

/**
 * Standard JSON success response.
 * @param {any} data
 * @param {number} [status=200]
 * @returns {NextResponse}
 */
export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard JSON error response.
 * @param {string} message
 * @param {number} [status=400]
 * @param {object} [errors]
 * @returns {NextResponse}
 */
export function errorResponse(message, status = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return NextResponse.json(body, { status });
}

/**
 * Wrap an API route handler with error handling and optional auth check.
 * @param {Function} handler - async (request, context, user) => Response
 * @param {object} [options]
 * @param {boolean} [options.requireAuth=true]
 * @param {string[]} [options.allowedRoles]
 * @returns {Function}
 */
export function withApiHandler(handler, options = {}) {
  const { requireAuth = true, allowedRoles = null } = options;

  return async (request, context) => {
    try {
      let user = null;

      if (requireAuth) {
        const { authenticateRequest } = await import("@/lib/auth");
        user = authenticateRequest(request);
        if (!user) {
          return errorResponse("Non authentifié", 401);
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return errorResponse("Accès non autorisé", 403);
        }
      }

      return await handler(request, context, user);
    } catch (error) {
      console.error("[API Error]", error);

      if (error.code === "P2025") {
        return errorResponse("Ressource non trouvée", 404);
      }

      if (error.code === "P2002") {
        return errorResponse("Cette valeur existe déjà", 409);
      }

      return errorResponse("Erreur interne du serveur", 500);
    }
  };
}
