import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Converte qualquer erro no formato padrão:
 * { message, path, timestamp, details? }
 */
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
        // erros do ValidationPipe
        message = 'Erro de validação';
        details = raw.message;
      } else {
        message = String(raw.message ?? exception.message);
      }
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
