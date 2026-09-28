type AuthError = { code?: string | undefined; status: number } | null;

export type AuthErrorKey =
  "generic" | "invalidCredentials" | "userExists" | "passwordTooShort" | "tooManyRequests";

/** Maps Better Auth client errors to translated message keys. */
export function authErrorKey(error: AuthError): AuthErrorKey {
  if (!error) return "generic";
  if (error.status === 429) return "tooManyRequests";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "invalidCredentials";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "userExists";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    default:
      return "generic";
  }
}
