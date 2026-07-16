# 05_ARCHITECTURE

**Document ID:** ZOS-005\
**Version:** 1.0.0\
**Status:** Approved\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This document defines the official software architecture of Zenith. It
establishes system boundaries, responsibilities, and the rules governing
interactions between components.

# Architectural Principles

-   Architecture First
-   Modular Monorepo
-   Clear Separation of Concerns
-   Shared Packages Before Duplication
-   Documentation-Driven Engineering
-   AI-Assisted, Architecture-Controlled Development

# High-Level Structure

-   apps/api --- Backend services (NestJS)
-   apps/web --- Frontend application (Next.js)
-   packages/database --- Prisma client and database layer
-   packages/validation --- Shared validation schemas
-   packages/types --- Shared TypeScript types
-   packages/utils --- Shared utilities
-   packages/tooling --- Shared linting, formatting, and TS
    configuration

# Layer Responsibilities

## Presentation

HTTP endpoints, controllers, DTO serialization.

## Application

Business workflows and orchestration.

## Domain

Business rules and domain logic.

## Infrastructure

Database, logging, configuration, external integrations.

# Dependency Rules

-   Applications may depend on shared packages.
-   Shared packages must not depend on applications.
-   Domain logic must not depend directly on presentation.
-   Infrastructure must remain replaceable where practical.

# Architecture Governance

Only the Architecture Team may: - Change system architecture. - Approve
new frameworks. - Approve ADRs. - Modify engineering standards.

Implementation engineers execute only approved work.

# Architecture Decision Records

Every significant architectural change must be documented through an ADR
before implementation.

# Related Documents

-   04_TECH_STACK.md
-   06_PROJECT_CONSTITUTION.md
-   11_DECISION_LOG.md
-   12_ADR_INDEX.md
-   28_LIVE_DATA_BLUEPRINT.md
