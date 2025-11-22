/**
 * Exchange error types
 * Distinguishes between network, authentication, and business logic errors
 */

/**
 * Base error class for exchange operations
 */
export class ExchangeError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "ExchangeError";
    Object.setPrototypeOf(this, ExchangeError.prototype);
  }
}

/**
 * Network-related errors (timeouts, connection issues, etc.)
 */
export class NetworkError extends ExchangeError {
  constructor(message: string, cause?: Error) {
    super(message, "NETWORK_ERROR", cause);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication/authorization errors (invalid API keys, permissions, etc.)
 */
export class AuthenticationError extends ExchangeError {
  constructor(message: string, cause?: Error) {
    super(message, "AUTH_ERROR", cause);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Business logic errors (insufficient balance, invalid order parameters, etc.)
 */
export class BusinessError extends ExchangeError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, code, cause);
    this.name = "BusinessError";
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends ExchangeError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    cause?: Error
  ) {
    super(message, "RATE_LIMIT_ERROR", cause);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Order rejection errors
 */
export class OrderRejectedError extends BusinessError {
  constructor(
    message: string,
    public readonly orderId?: string,
    cause?: Error
  ) {
    super(message, "ORDER_REJECTED", cause);
    this.name = "OrderRejectedError";
    Object.setPrototypeOf(this, OrderRejectedError.prototype);
  }
}
