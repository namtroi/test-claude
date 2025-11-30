export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, details);
    this.name = 'ValidationError';
  }
}

export class ParseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 500, details);
    this.name = 'ParseError';
  }
}
