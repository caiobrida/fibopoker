import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

function pooledConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString === undefined) {
    throw new Error('DATABASE_URL is not set');
  }

  return connectionString;
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: pooledConnectionString() }),
});
