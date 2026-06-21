/**
 * Server action results use UPPER_SNAKE_CASE error codes only.
 * User-facing copy lives in next-intl (`errors.actions.*`).
 */

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "UNKNOWN"
  | "AUTH_FAILED"
  | "INVALID_CREDENTIALS"
  | "SIGN_IN_FAILED"
  | "SIGN_UP_FAILED"
  | "EMAIL_ALREADY_EXISTS"
  | "BUSINESS_NOT_FOUND"
  | "BUSINESS_NOT_ACTIVE"
  | "INVALID_PHONE"
  | "BRANCH_NOT_FOUND"
  | "BRANCH_NAME_REQUIRED"
  | "ADD_BRANCH_FAILED"
  | "UPDATE_BRANCH_FAILED"
  | "SET_PRIMARY_BRANCH_FAILED"
  | "DEACTIVATE_BRANCH_FAILED"
  | "MERCHANT_UPDATE_FAILED"
  | "REJECTION_REASON_REQUIRED"
  | "LOYALTY_CARD_NAME_INVALID"
  | "LOYALTY_CARD_DESCRIPTION_INVALID"
  | "LOYALTY_CARD_COLOR_INVALID"
  | "LOYALTY_CARD_STAMP_TARGET_INVALID"
  | "LOYALTY_CARD_MIN_SPEND_INVALID"
  | "LOYALTY_CARD_CURRENCY_INVALID"
  | "LOYALTY_CARD_REWARD_TYPE_INVALID"
  | "LOYALTY_CARD_REWARD_VALUE_REQUIRED"
  | "LOYALTY_CARD_REWARD_DESCRIPTION_REQUIRED"
  | "LOYALTY_CARD_SAVE_FAILED"
  | "LOGO_FILE_REQUIRED"
  | "LOGO_FILE_TOO_LARGE"
  | "LOGO_FILE_TYPE_INVALID"
  | "LOGO_UPLOAD_FAILED"
  | "REDEMPTION_CODE_INVALID"
  | "REDEMPTION_NOT_FOUND"
  | "REDEMPTION_LOOKUP_FAILED"
  | "REDEMPTION_ALREADY_COMPLETED"
  | "REDEMPTION_CONFIRM_FAILED"
  | "STAMP_QUEUE_LOAD_FAILED"
  | "STAMP_NOT_FOUND"
  | "STAMP_EXPIRED"
  | "STAMP_NOT_PENDING"
  | "STAMP_APPROVE_FAILED"
  | "STAMP_REJECT_REASON_TOO_LONG"
  | "STAMP_REJECT_FAILED"
  | "DEMO_DEV_ONLY"
  | "DEMO_LOYALTY_CARD_REQUIRED"
  | "DEMO_SEED_FAILED"
  | "DEMO_NO_REDEMPTION_CODE"
  | "DEMO_REDEMPTION_CREATE_FAILED"
  | "ANALYTICS_LOAD_FAILED";

export type ActionError = {
  code: ActionErrorCode;
  params?: Record<string, string | number>;
};

export type ActionFailure = { error: ActionError };

export type ActionSuccess<T extends object = object> = T & {
  error?: never;
  warning?: ActionError;
};

export type ActionResult<T extends object = object> =
  | ActionFailure
  | ActionSuccess<T>;

export function fail(
  code: ActionErrorCode,
  params?: Record<string, string | number>,
): ActionFailure {
  return params ? { error: { code, params } } : { error: { code } };
}

export function isActionFailure(
  result: ActionResult | null | undefined,
): result is ActionFailure {
  return Boolean(result && "error" in result && result.error);
}

export function mapAuthErrorCode(message: string): ActionErrorCode {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "INVALID_CREDENTIALS";
  }
  if (lower.includes("already") && lower.includes("registered")) {
    return "EMAIL_ALREADY_EXISTS";
  }
  if (lower.includes("already") && lower.includes("exists")) {
    return "EMAIL_ALREADY_EXISTS";
  }
  return "AUTH_FAILED";
}

export function logActionFailure(context: string, err: unknown): void {
  console.error(`[action:${context}]`, err);
}
