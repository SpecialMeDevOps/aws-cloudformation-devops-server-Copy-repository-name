import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { metricsRegistry } from './metrics.registry.js';

@Controller()
export class MetricsController {
  private readonly metricsToken: Buffer | undefined;

  constructor() {
    const tokenPath = process.env.METRICS_TOKEN_FILE;
    const token = tokenPath
      ? readFileSync(tokenPath, 'utf8').trim()
      : process.env.METRICS_TOKEN;
    if (token) {
      if (token.length < 32) {
        throw new Error('The metrics bearer token must contain at least 32 characters.');
      }
      this.metricsToken = Buffer.from(token);
    }
  }

  @Get('metrics')
  async getMetrics(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    if (!this.metricsToken) {
      throw new NotFoundException();
    }

    const token = authorization?.startsWith('Bearer ')
      ? Buffer.from(authorization.slice('Bearer '.length))
      : Buffer.alloc(0);
    if (
      token.length !== this.metricsToken.length ||
      !timingSafeEqual(token, this.metricsToken)
    ) {
      throw new UnauthorizedException();
    }

    response
      .status(200)
      .type(metricsRegistry.contentType)
      .send(await metricsRegistry.metrics());
  }
}
