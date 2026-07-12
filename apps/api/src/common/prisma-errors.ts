import { Prisma } from '@zenith/database';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const RECORD_NOT_FOUND = 'P2025';
const FOREIGN_KEY_CONSTRAINT_VIOLATION = 'P2003';

export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION;
}

export function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND;
}

export function isForeignKeyConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === FOREIGN_KEY_CONSTRAINT_VIOLATION
  );
}
