import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/errors.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      const raw = typeof res === 'string' ? { message: res } : (res as Record<string, unknown>);
      if (Array.isArray(raw.message)) {
        message = 'Erro de validação';
        details = raw.message;
      } else {
        message = String(raw.message ?? exception.message);
      }
    } else if (exception instanceof DomainError) {
      status = domainErrorStatus(exception);
      message = exception.message;
    } else if (isUniqueViolation(exception)) {
      status = HttpStatus.CONFLICT;
      message = 'Registro duplicado';
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({
      message,
      ...(details !== undefined && { details }),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'SQLITE_CONSTRAINT_UNIQUE' || code === '23505';
}

function domainErrorStatus(error: DomainError): HttpStatus {
  if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictError) return HttpStatus.CONFLICT;
  if (error instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
  if (error instanceof ForbiddenError) return HttpStatus.FORBIDDEN;
  if (error instanceof ValidationError) return HttpStatus.BAD_REQUEST;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
