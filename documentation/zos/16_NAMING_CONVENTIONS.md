16_NAMING_CONVENTIONS

Document ID: ZOS-016

Version: 1.0.0

Status: Approved

Owner: Architecture Team

Purpose

This document defines the official naming conventions used throughout the Zenith project. Consistent naming improves readability, maintainability, onboarding, and AI-assisted development.

These conventions are mandatory for all applications, shared packages, infrastructure, documentation, and future modules.

General Principles

A good name should be:

Clear

Descriptive

Consistent

Predictable

Technology-independent whenever possible

Avoid abbreviations unless they are industry standard.

Example:

Good

user-service

authentication-controller

create-user.dto.ts

Bad

usr

svc

ctrl1

newFile.ts

Repository

Repository name

zenith

Documentation

documentation/

Knowledge System

documentation/zos/

Applications

Applications use lowercase.

apps/api

apps/web

Future examples

apps/admin

apps/mobile

apps/worker

Packages

All shared packages follow:

@zenith/package-name

Examples

@zenith/database

@zenith/validation

@zenith/config

@zenith/logger

@zenith/types

@zenith/utils

Folders

Folders use:

kebab-case

Examples

user-management

authentication

health-check

shared-components

Never use:

UserManagement

user_management

User_Management

Files

Files use:

kebab-case

Examples

user.service.ts

user.controller.ts

create-user.dto.ts

auth.guard.ts

Classes

Classes use:

PascalCase

Examples

UserService

AuthController

JwtStrategy

DatabaseModule

Interfaces

Interfaces use PascalCase.

Do not prefix interfaces with "I".

Correct

User

AuthPayload

PaginationOptions

Avoid

IUser

IAuth

Types

Types use PascalCase.

UserRole

ApiResponse

JwtPayload

Enums

Enums use PascalCase.

Members use UPPER_SNAKE_CASE when appropriate.

Example

enum UserStatus {

ACTIVE,

INACTIVE,

SUSPENDED

}

Variables

Variables use

camelCase

Examples

userId

refreshToken

currentUser

databaseClient

Constants

Constants use

UPPER_SNAKE_CASE

Examples

MAX_LOGIN_ATTEMPTS

DEFAULT_PAGE_SIZE

JWT_EXPIRATION

Functions

Functions use

camelCase

Examples

createUser()

findUser()

generateToken()

validateRequest()

Function names should begin with a verb whenever possible.

DTOs

Suffix

Dto

Examples

CreateUserDto

LoginDto

UpdateProfileDto

Entities

Suffix

Entity

Examples

UserEntity

RoleEntity

PermissionEntity

Controllers

Suffix

Controller

Examples

AuthController

UserController

HealthController

Services

Suffix

Service

Examples

UserService

TokenService

AuthenticationService

Modules

Suffix

Module

Examples

AuthModule

DatabaseModule

HealthModule

Guards

Suffix

Guard

Examples

JwtGuard

RolesGuard

Interceptors

Suffix

Interceptor

Examples

RequestIdInterceptor

LoggingInterceptor

Filters

Suffix

Filter

Examples

HttpExceptionFilter

ValidationFilter

Environment Variables

Environment variables use

UPPER_SNAKE_CASE

Examples

DATABASE_URL

JWT_SECRET

API_PREFIX

NODE_ENV

Branch Names

Use

feature/

bugfix/

hotfix/

release/

docs/

refactor/

Examples

feature/authentication

feature/prisma-models

bugfix/login-validation

docs/zos-update

Commits

Recommended format

feat:

fix:

refactor:

docs:

test:

build:

ci:

perf:

style:

chore:

Examples

feat(auth): implement JWT authentication



fix(api): resolve validation issue



docs(zos): update architecture documentation

Database

Tables

snake_case

Columns

snake_case

Prisma models

PascalCase

Example

User

Role

Permission

API Routes

Use

kebab-case

Examples

/api/v1/users

/api/v1/auth/login

/api/v1/health

Avoid verbs in routes whenever possible.

Documentation

Documents use

UPPERCASE_WITH_UNDERSCORES.md

Examples

PROJECT_STATUS.md

PROJECT_HISTORY.md

CHANGELOG.md

ROADMAP.md

ZOS documents use

NN_DOCUMENT_NAME.md

Examples

05_ARCHITECTURE.md

10_AI_ENGINEER_GUIDE.md

20_AI_BOOT_SEQUENCE.md

Enforcement

These conventions are mandatory across the entire Zenith ecosystem.

Any exception requires Architecture Team approval.

Related Documents

05_ARCHITECTURE.md

06_PROJECT_CONSTITUTION.md

15_CODING_STANDARDS.md

17_RELEASE_PROCESS.md