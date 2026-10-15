import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const requiredVariables = ['DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_USER'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(`Database migration requires: ${missingVariables.join(', ')}.`);
}

const databaseUrl = new URL(
  `postgresql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT ?? '5432'}/${encodeURIComponent(process.env.DB_NAME)}`,
);
databaseUrl.searchParams.set('schema', 'public');

const prismaCli = fileURLToPath(
  new URL('../node_modules/prisma/build/index.js', import.meta.url),
);
const migration = spawnSync(
  process.execPath,
  [prismaCli, 'migrate', 'deploy'],
  {
    env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
    stdio: 'inherit',
  },
);

if (migration.error) {
  throw migration.error;
}

process.exitCode = migration.status ?? 1;
