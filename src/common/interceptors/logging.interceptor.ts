import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate or use existing trace ID
    const traceId = request.headers['x-trace-id'] as string || uuidv4();
    request.headers['x-trace-id'] = traceId;
    response.setHeader('x-trace-id', traceId);

    const { method, url, body, query, params } = request;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip;

    const startTime = Date.now();

    // Log request
    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      {
        traceId,
        method,
        url,
        body: this.sanitizeBody(body),
        query,
        params,
        userAgent,
        ip,
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const responseSize = this.getResponseSize(data);
          
          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${response.statusCode} (${duration}ms)`,
            {
              traceId,
              method,
              url,
              statusCode: response.statusCode,
              duration,
              responseSize,
            },
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          this.logger.error(
            `Request Error: ${method} ${url} - ${error.status || 500} (${duration}ms)`,
            {
              traceId,
              method,
              url,
              statusCode: error.status || 500,
              duration,
              error: error.message,
            },
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getResponseSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
