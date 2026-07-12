# 19_ONBOARDING_GUIDE

**Document ID:** ZOS-019
**Version:** 1.0.0
**Status:** Approved
**Owner:** Architecture Team

------------------------------------------------------------------------

# Purpose

This document defines the procedure for integrating a new contributor — human or AI — into the Zenith project. It does not restate engineering rules, architecture, or workflow; it points to where each is defined and specifies the order in which they must be read.

# Audience

- New human engineers joining the project.
- New AI implementation agents beginning a session on the project (see also `documentation/ai/AI_BOOTSTRAP.md` for the AI-specific mechanical boot sequence).

# Onboarding Steps

## Step 1 — Understand ZOS Itself

Read `00_README.md` to understand what ZOS is, its structure, and its source-of-truth hierarchy.

## Step 2 — Understand the Project

Read, in order: `01_PROJECT_OVERVIEW.md`, `02_PRODUCT_VISION.md`, `03_BUSINESS_GOALS.md`.

## Step 3 — Understand the Technical Foundation

Read, in order: `04_TECH_STACK.md`, `05_ARCHITECTURE.md`, `13_FOLDER_STRUCTURE.md`.

## Step 4 — Understand the Rules

Read, in order: `06_PROJECT_CONSTITUTION.md`, `07_ENGINEERING_WORKFLOW.md`, `10_AI_ENGINEER_GUIDE.md`.

## Step 5 — Understand Current State

Read `09_PROJECT_BRAIN.md` for live project status, and `08_ROADMAP.md` for direction. For AI agents, `documentation/ai/PROJECT_STATE.md` provides an operational-layer summary that points into these same documents.

## Step 6 — Understand Standards

Read, as relevant to the work: `14_DEPENDENCY_POLICY.md`, `15_CODING_STANDARDS.md`, `16_NAMING_CONVENTIONS.md`, `17_RELEASE_PROCESS.md`.

## Step 7 — Understand Terminology

Read `18_PROJECT_GLOSSARY.md` for standardized terms used throughout the other documents.

## Step 8 — Understand How Work Begins

No implementation work — by a human or an AI — begins without an approved Sprint Brief following `SPRINT_BRIEF_TEMPLATE.md`, per Constitution Rule 2.

# AI-Specific Note

AI implementation agents should treat this onboarding sequence as satisfied by following `documentation/ai/AI_BOOTSTRAP.md`, which operationalizes the same reading order together with repository initialization and stop conditions specific to automated sessions.

# Related Documents

- `00_README.md`
- `06_PROJECT_CONSTITUTION.md`
- `10_AI_ENGINEER_GUIDE.md`
- `SPRINT_BRIEF_TEMPLATE.md`
- `documentation/ai/AI_BOOTSTRAP.md`
