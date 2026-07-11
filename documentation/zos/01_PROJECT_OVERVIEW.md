# 01_PROJECT_OVERVIEW

**Document ID:** ZOS-001\
**Version:** 1.0.0\
**Status:** Approved\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Executive Summary

Zenith is an AI-assisted, enterprise-grade platform built with an
architecture-first approach. The project emphasizes long-term
maintainability, modularity, and predictable engineering execution
rather than rapid feature delivery.

# Objectives

-   Build a scalable platform.
-   Keep architecture independent from implementation.
-   Enable multiple AI implementation agents to work safely.
-   Maintain a single source of truth through ZOS.

# Core Principles

1.  Architecture First
2.  Modular Monorepo
3.  AI-Assisted Engineering
4.  Documentation Driven
5.  No Unauthorized Architecture Changes

# Repository Overview

-   apps/api --- NestJS backend
-   apps/web --- Next.js frontend
-   packages/database --- Prisma layer
-   packages/validation --- Shared validation
-   packages/tooling --- Shared tooling configuration
-   packages/types --- Shared types
-   packages/utils --- Shared utilities

# Current Architecture

-   Monorepo: Turborepo + pnpm
-   Backend: NestJS
-   Frontend: Next.js
-   ORM: Prisma
-   Database: PostgreSQL
-   Language: TypeScript

# Engineering Model

Architecture Team → Approves architecture and sprint scope.

Implementation AI → Executes only approved work.

ZOS → Stores project knowledge and engineering rules.

# Success Criteria

The project is considered successful when it remains: - Scalable -
Maintainable - Well documented - Architecture compliant - AI friendly

# Related Documents

-   00_README.md
-   05_ARCHITECTURE.md
-   09_PROJECT_BRAIN.md
-   10_AI_ENGINEER_GUIDE.md
