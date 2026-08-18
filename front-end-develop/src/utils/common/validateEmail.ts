/**
 * Validates an email address
 * @param email - The email address to validate
 * @returns boolean - true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Regular expression for basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Additional checks
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false; // RFC 5321 limit

  // Check basic format
  if (!emailRegex.test(email)) return false;

  // Check for consecutive dots
  if (email.includes("..")) return false;

  // Split local part and domain
  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const localPart = parts[0];
  const domain = parts[1];

  // Check local part length (max 64 chars per RFC)
  if (localPart.length > 64) return false;

  // Check domain has valid TLD
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return false;
  }

  return true;
}
