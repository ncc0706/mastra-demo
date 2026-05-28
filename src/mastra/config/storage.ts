import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

export const mastraDbPath = path.join(projectRoot, 'mastra.db');

export const libsqlStore = new LibSQLStore({
  id: 'mastra-storage',
  url: `file:${mastraDbPath.replace(/\\/g, '/')}`,
});

export async function createMastraStorage() {
  const memoryStore = await libsqlStore.getStore('memory');
  const observabilityStore = await new DuckDBStore().getStore('observability');

  return new MastraCompositeStore({
    id: 'composite-storage',
    default: libsqlStore,
    domains: {
      ...(memoryStore ? { memory: memoryStore } : {}),
      ...(observabilityStore ? { observability: observabilityStore } : {}),
    },
  });
}
