import { PrismaClient } from '@prisma/client';

export { PrismaClient };

export async function checkDatabaseConnection(client: PrismaClient): Promise<boolean> {
  await client.$queryRaw`SELECT 1`;
  return true;
}
