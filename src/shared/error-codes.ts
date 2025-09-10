export enum ErrorCodes {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_NOT_FOUND = 'AUTH_ACCOUNT_NOT_FOUND',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',

  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',

  // Sessions
  SESS_OVERLAP = 'SESS_OVERLAP',
  SESS_OUTSIDE_AVAILABILITY = 'SESS_OUTSIDE_AVAILABILITY',
  SESS_ALREADY_BOOKED = 'SESS_ALREADY_BOOKED',
  SESS_CANNOT_CANCEL = 'SESS_CANNOT_CANCEL',

  // Invoices & Payments
  INV_DUP_NUMBER = 'INV_DUP_NUMBER',
  INV_TOTALS_MISMATCH = 'INV_TOTALS_MISMATCH',
  INV_ALREADY_PAID = 'INV_ALREADY_PAID',
  PAY_INVALID_WEBHOOK = 'PAY_INVALID_WEBHOOK',
  PAY_PROCESSING_FAILED = 'PAY_PROCESSING_FAILED',

  // Passes & Milestones
  PASS_EXPIRED = 'PASS_EXPIRED',
  PASS_ALREADY_REDEEMED = 'PASS_ALREADY_REDEEMED',
  PASS_INVALID_CODE = 'PASS_INVALID_CODE',
  MILESTONE_ALREADY_ACHIEVED = 'MILESTONE_ALREADY_ACHIEVED',
  GIFT_ALREADY_SENT = 'GIFT_ALREADY_SENT',

  // External Services
  CALENDAR_SYNC_FAILED = 'CALENDAR_SYNC_FAILED',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  SMS_SEND_FAILED = 'SMS_SEND_FAILED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

export const ErrorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCodes.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this action',
  [ErrorCodes.AUTH_ACCOUNT_LOCKED]: 'Account is locked due to multiple failed attempts',
  [ErrorCodes.AUTH_ACCOUNT_NOT_FOUND]: 'Account not found',

  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: 'Invalid format',
  [ErrorCodes.VALIDATION_OUT_OF_RANGE]: 'Value is out of allowed range',

  [ErrorCodes.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCodes.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCodes.RESOURCE_CONFLICT]: 'Resource conflict',
  [ErrorCodes.RESOURCE_UNAVAILABLE]: 'Resource is currently unavailable',

  [ErrorCodes.SESS_OVERLAP]: 'Session time overlaps with existing session',
  [ErrorCodes.SESS_OUTSIDE_AVAILABILITY]: 'Session time is outside coach availability',
  [ErrorCodes.SESS_ALREADY_BOOKED]: 'Session is already booked',
  [ErrorCodes.SESS_CANNOT_CANCEL]: 'Session cannot be cancelled',

  [ErrorCodes.INV_DUP_NUMBER]: 'Invoice number already exists',
  [ErrorCodes.INV_TOTALS_MISMATCH]: 'Invoice totals do not match',
  [ErrorCodes.INV_ALREADY_PAID]: 'Invoice is already paid',
  [ErrorCodes.PAY_INVALID_WEBHOOK]: 'Invalid payment webhook signature',
  [ErrorCodes.PAY_PROCESSING_FAILED]: 'Payment processing failed',

  [ErrorCodes.PASS_EXPIRED]: 'Pass has expired',
  [ErrorCodes.PASS_ALREADY_REDEEMED]: 'Pass has already been redeemed',
  [ErrorCodes.PASS_INVALID_CODE]: 'Invalid pass code',
  [ErrorCodes.MILESTONE_ALREADY_ACHIEVED]: 'Milestone already achieved',
  [ErrorCodes.GIFT_ALREADY_SENT]: 'Gift already sent for this milestone',

  [ErrorCodes.CALENDAR_SYNC_FAILED]: 'Calendar synchronization failed',
  [ErrorCodes.EMAIL_SEND_FAILED]: 'Failed to send email',
  [ErrorCodes.SMS_SEND_FAILED]: 'Failed to send SMS',
  [ErrorCodes.FILE_UPLOAD_FAILED]: 'File upload failed',

  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCodes.MAINTENANCE_MODE]: 'System is in maintenance mode',
};
