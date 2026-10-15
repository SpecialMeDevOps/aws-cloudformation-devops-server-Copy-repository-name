import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize, Observable } from 'rxjs';
import {
  httpRequestDurationSeconds,
  httpRequestsTotal,
} from './metrics.registry.js';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const route = request.route?.path;
    const routeLabel = typeof route === 'string' ? route : 'unmatched';
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        if (routeLabel === '/metrics') {
          return;
        }

        const labels = {
          method: request.method,
          route: routeLabel,
          status_code: String(response.statusCode),
        };
        const durationSeconds =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

        httpRequestsTotal.inc(labels);
        httpRequestDurationSeconds.observe(labels, durationSeconds);
      }),
    );
  }
}
