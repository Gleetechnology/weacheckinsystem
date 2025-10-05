import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// For serverless environments, create a new client per request
export function createPrismaClient() {
  console.log('Creating Prisma client with DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  return new PrismaClient({
    log: ['error', 'warn', 'query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}