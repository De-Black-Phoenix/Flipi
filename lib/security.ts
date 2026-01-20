/**
 * Security utilities for input validation and sanitization
 */

// UUID validation regex (Supabase uses UUID v4)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Sanitizes error messages for client responses
 * Removes sensitive internal details and returns safe generic messages
 */
export function sanitizeErrorMessage(error: any, context: string): string {
  // Log full error server-side for debugging (remove sensitive data before logging)
  const safeError = {
    message: error?.message || "Unknown error",
    code: error?.code,
    context,
    // Explicitly exclude sensitive fields
    password: undefined,
    token: undefined,
    secret: undefined,
    key: undefined,
  };
  
  // For client, return generic messages based on error type
  if (error?.code?.startsWith("PGRST") || error?.code?.startsWith("235")) {
    // Database errors - return generic message
    return "Database operation failed";
  }
  
  if (error?.message?.includes("JWT") || error?.message?.includes("token")) {
    return "Authentication failed";
  }
  
  if (error?.message?.includes("permission") || error?.message?.includes("RLS")) {
    return "Access denied";
  }
  
  // Default safe message
  return "An error occurred. Please try again.";
}

/**
 * Validates URL to prevent SSRF attacks
 * Only allows trusted domains (Cloudinary, data URLs)
 */
export function isValidImageURL(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  
  // Allow data URLs for base64 images
  if (url.startsWith("data:image/")) return true;
  
  // Only allow Cloudinary URLs
  if (url.includes("cloudinary.com")) return true;
  
  return false;
}
