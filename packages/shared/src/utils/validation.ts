/**
 * Validation utilities
 */

/**
 * Redact sensitive headers before storing
 */
export const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'api-key',
  'access-token'
];

/**
 * Redact sensitive fields from request/response bodies
 */
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'ssn',
  'credit_card',
  'api_key',
  'private_key'
];

/**
 * Redact sensitive data from headers
 */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_HEADERS.includes(keyLower)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redact sensitive fields from object recursively
 */
export function redactSensitiveFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_FIELDS.includes(keyLower)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveFields(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Validate that confidence score is in valid range
 */
export function isValidConfidenceScore(score: number): boolean {
  return score >= 0 && score <= 1;
}

/**
 * Validate HTTP method
 */
export function isValidHttpMethod(method: string): boolean {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  return validMethods.includes(method.toUpperCase());
}
