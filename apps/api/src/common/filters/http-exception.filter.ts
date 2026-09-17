import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

export interface ErrorResponseBody {
  statusCode: number
  error: string
  message: string | string[]
  path: string
  timestamp: string
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const payload = exception instanceof HttpException ? exception.getResponse() : null
    const message =
      typeof payload === 'string'
        ? payload
        : ((payload as { message?: string | string[] } | null)?.message ?? 'Internal server error')
    const error =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String(payload.error)
        : (HttpStatus[status] ?? 'Error')

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    }

    response.status(status).json(body)
  }
}
