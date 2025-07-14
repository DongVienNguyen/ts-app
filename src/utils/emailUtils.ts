/**
 * Formats an email address according to the application's specific rules.
 * - If the input contains '@', it's considered a full email and returned as is.
 * - Otherwise, '.hvu@vietcombank.com.vn' is appended.
 * @param emailOrUsername The raw email or username string.
 * @returns A formatted, valid email address, or an empty string if the input is falsy.
 */
export const formatEmail = (emailOrUsername: string | null | undefined): string => {
  if (!emailOrUsername) {
    return '';
  }
  // Trim whitespace to avoid issues
  const trimmedInput = emailOrUsername.trim();
  if (trimmedInput.includes('@')) {
    return trimmedInput;
  }
  return `${trimmedInput}.hvu@vietcombank.com.vn`;
};