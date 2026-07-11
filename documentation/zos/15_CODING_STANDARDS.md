15_CODING_STANDARDS

Document ID: ZOS-015

Version: 1.0.0

Status: Approved

Owner: Architecture Team

Purpose

This document defines the official coding standards for the Zenith project. These standards ensure that every contributor—human or AI—produces code that is consistent, maintainable, secure, and aligned with the project architecture.

These rules are mandatory for every application, package, module, and future contribution.

Core Principles

Every line of code should satisfy the following principles:

Readability over cleverness.

Simplicity over unnecessary abstraction.

Maintainability over short-term optimization.

Explicit behavior over hidden behavior.

Reusability over duplication.

Consistency across the entire repository.

General Coding Rules

Single Responsibility

Each file, class, and function should have one clear responsibility.

Avoid large "God Objects" or multi-purpose classes.

Keep Functions Small

Functions should:

Perform one logical task.

Be easy to test.

Avoid excessive nesting.

Return predictable results.

Avoid Code Duplication

Before writing new code:

Search existing packages.

Search utilities.

Search shared components.

Duplicate logic should be extracted into shared packages whenever appropriate.

TypeScript Standards

Mandatory:

Strict TypeScript mode.

Explicit typing for public APIs.

No implicit any.

Prefer readonly where applicable.

Prefer immutable data.

Avoid:

any

@ts-ignore

Unnecessary type assertions

Naming Standards

Item

Convention

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case

Folders

lowercase / kebab-case

Names must describe intent rather than implementation.

File Organization

Recommended order:

Imports

Constants

Types

Interfaces

Class

Private helpers

Exports

Import Rules

Imports should be grouped as:

Node.js

Third-party libraries

Internal packages

Relative imports

Avoid circular imports.

Error Handling

Required:

Throw meaningful exceptions.

Never silently ignore failures.

Never expose internal implementation details.

Use centralized exception handling.

Logging Standards

Use structured logging only.

Never log:

Passwords

Secrets

Tokens

Database credentials

Personal data

Always use the correct log level:

Trace

Debug

Info

Warn

Error

Fatal

Validation

All external input must be validated.

Never trust:

HTTP requests

Query parameters

Request body

Headers

Environment variables

External APIs

Comments

Write comments only when necessary.

Good comments explain:

Why

Bad comments explain:

What

The code itself should explain "what".

Formatting

Formatting is enforced automatically.

Do not manually fight the formatter.

Use:

ESLint

Prettier

Testing Expectations

New code should be:

Testable

Deterministic

Independent

Free from hidden side effects

Performance

Optimize only after measuring.

Prefer:

Clear code

Predictable code

Maintainable code

Premature optimization is discouraged.

Security Rules

Never:

Commit secrets.

Hardcode credentials.

Trust client input.

Disable validation.

Disable authentication checks.

Always follow the project's approved security policies.

AI-Specific Rules

AI implementation agents must:

Follow these standards automatically.

Never generate code that violates architecture.

Never introduce inconsistent coding styles.

Prefer existing project conventions over personal preferences.

Code Review Checklist

Before considering work complete:

Architecture respected.

Types are correct.

No duplicated logic.

Naming follows standards.

Validation implemented.

Errors handled.

Logging appropriate.

Documentation updated (if required).

No unauthorized dependencies.

No security concerns.

Enforcement

These standards apply to:

Backend

Frontend

Shared Packages

Infrastructure

Tooling

Future modules

Exceptions require explicit Architecture Team approval.

Related Documents

05_ARCHITECTURE.md

06_PROJECT_CONSTITUTION.md

10_AI_ENGINEER_GUIDE.md

14_DEPENDENCY_POLICY.md

16_NAMING_CONVENTIONS.md