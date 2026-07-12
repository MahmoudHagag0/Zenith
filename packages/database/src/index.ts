import { Prisma, PrismaClient } from '@prisma/client';

export { Prisma, PrismaClient };

export async function checkDatabaseConnection(client: PrismaClient): Promise<boolean> {
  await client.$queryRaw`SELECT 1`;
  return true;
}
