import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// For serverless environments, create a new client per request
export function createPrismaClient() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('Creating Prisma client with URL:', dbUrl ? 'set' : 'not set');
  return new PrismaClient({
    log: ['error', 'warn', 'query'],
    datasources: {
      db: {
        url: dbUrl + "?prepareThreshold=0",
      },
    },
  });
}