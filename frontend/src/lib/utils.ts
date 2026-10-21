/**
 * Shared utility helpers for SA Healthcare frontend
 */

/**
 * Computes consistent 1-2 character initials for user avatars across the platform.
 * - For multi-word full names (e.g. "Steve Roger"): returns first and last word initials ("SR").
 * - For single-word full names (e.g. "Admin"): returns first two letters ("AD").
 * - For username only (e.g. "steve"): returns first two letters ("ST").
 * - Falls back to specified fallback character(s) (default 'U').
 */
export function getUserInitials(
  fullName?: string | null,
  username?: string | null,
  fallback = 'U'
): string {
  const cleanName = fullName?.trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length === 1) {
      return parts[0].toUpperCase();
    }
  }

  const cleanUser = username?.trim();
  if (cleanUser) {
    return cleanUser.substring(0, 2).toUpperCase();
  }

  return (fallback || 'U').substring(0, 2).toUpperCase();
}
