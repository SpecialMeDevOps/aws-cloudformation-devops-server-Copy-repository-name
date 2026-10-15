import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const url = process.env.DATABASE_URL ?? buildDatabaseUrlFromParts();
    super(url ? { datasources: { db: { url } } } : {});
  }

  async onModuleInit() {
    await this.$connect();
  }
}

function buildDatabaseUrlFromParts(): string | undefined {
  const { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_PASSWORD || !DB_USER) {
    return undefined;
  }

  const username = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);
  const database = encodeURIComponent(DB_NAME);
  const port = DB_PORT ?? '5432';

  return `postgresql://${username}:${password}@${DB_HOST}:${port}/${database}?schema=public`;
}
