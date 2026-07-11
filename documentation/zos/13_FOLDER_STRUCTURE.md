# 13_FOLDER_STRUCTURE

**Document ID:** ZOS-013\
**Version:** 1.0.0\
**Status:** Approved\
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This document defines the official repository layout for Zenith. The
folder structure is part of the project architecture and must remain
consistent across all development.

# Repository Layout

    /
    ├── apps/
    │   ├── api/
    │   └── web/
    ├── packages/
    │   ├── database/
    │   ├── validation/
    │   ├── types/
    │   ├── utils/
    │   └── tooling/
    ├── documentation/
    │   └── zos/
    ├── scripts/
    ├── .github/
    └── package.json

# Folder Responsibilities

## apps/

Contains deployable applications only.

-   **apps/api** --- NestJS backend.
-   **apps/web** --- Next.js frontend.

## packages/

Contains reusable libraries shared across applications.

Rules: - Packages must be framework-independent where practical. -
Shared code belongs here rather than inside applications.

## documentation/

Project documentation, including the ZOS knowledge system.

## scripts/

Automation, maintenance, and developer tooling scripts.

## .github/

CI/CD workflows, templates, and repository automation.

# Structure Rules

-   Do not create top-level folders without Architecture Team approval.
-   Prefer extending existing packages over creating new ones.
-   Avoid circular dependencies between packages.
-   Applications may depend on packages; packages must never depend on
    applications.

# Naming Rules

-   Folder names use lowercase.
-   Use kebab-case for multi-word names.
-   Keep names descriptive and consistent.

# Change Control

Any structural change requires: 1. Architecture review. 2. ADR approval
(if architectural). 3. Documentation update.

# Related Documents

-   05_ARCHITECTURE.md
-   04_TECH_STACK.md
-   14_DEPENDENCY_POLICY.md
