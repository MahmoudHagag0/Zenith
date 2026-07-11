# 04_TECH_STACK

**Document ID:** ZOS-004\
**Version:** 1.0.0\
**Status:** Approved\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This document defines the official technology stack approved for the
Zenith project. No technology may be introduced without Architecture
Team approval.

# Core Technologies

  Layer             Technology          Purpose
  ----------------- ------------------- -------------------------------------
  Monorepo          Turborepo           Build orchestration
  Package Manager   pnpm                Workspace management
  Language          TypeScript          Shared language across all packages
  Backend           NestJS              API framework
  Frontend          Next.js             Web application
  Database          PostgreSQL          Primary relational database
  ORM               Prisma              Database access layer
  Validation        Zod                 Shared validation schemas
  API Docs          Swagger / OpenAPI   API documentation
  Logging           Pino                Structured logging
  Testing           Jest                Unit and integration testing

# Shared Packages

-   @zenith/database
-   @zenith/validation
-   @zenith/types
-   @zenith/utils
-   @zenith/tooling

# Engineering Rules

-   Use TypeScript everywhere.
-   Reuse shared packages before creating new utilities.
-   Do not introduce new frameworks without ADR approval.
-   Keep dependencies minimal.
-   Prefer official libraries over community alternatives.

# Dependency Policy

New runtime dependencies require: 1. Engineering justification. 2.
Architecture approval. 3. Documentation update.

# Related Documents

-   05_ARCHITECTURE.md
-   14_DEPENDENCY_POLICY.md
-   15_CODING_STANDARDS.md
