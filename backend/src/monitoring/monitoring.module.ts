import { Module } from '@nestjs/common';
import { HttpMetricsInterceptor } from './http-metrics.interceptor.js';
import { MetricsController } from './metrics.controller.js';

@Module({
  controllers: [MetricsController],
  providers: [HttpMetricsInterceptor],
  exports: [HttpMetricsInterceptor],
})
export class MonitoringModule {}
