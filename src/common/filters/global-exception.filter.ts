import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes, ErrorMessages } from '../../shared/error-codes';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate trace ID for this request
    const traceId = request.headers['x-trace-id'] as string || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
    let message = ErrorMessages[ErrorCodes.INTERNAL_SERVER_ERROR];
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        errorCode = responseObj.errorCode || this.getErrorCodeFromStatus(status);
        message = responseObj.message || exception.message;
        details = responseObj.details;
      } else {
        message = exception.message;
        errorCode = this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
    }

    // Log the error
    this.logger.error(
      `Error ${errorCode}: ${message}`,
      {
        traceId,
        url: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        details,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    );

    // Send standardized error response
    const errorResponse = {
      ok: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): ErrorCodes {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.AUTH_TOKEN_INVALID;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCodes.RESOURCE_CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCodes.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCodes.RATE_LIMIT_EXCEEDED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCodes.SERVICE_UNAVAILABLE;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
