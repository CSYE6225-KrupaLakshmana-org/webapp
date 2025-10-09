# webapp
## Setup Script
Run on Ubuntu 24.04:
```
DB_PASS='Your@ss' sudo ./scripts/setup.sh
```
## Cloud Native Webapp (API-only)

## What this is:
A backend-only REST API built with Node.js and PostgreSQL. It exposes user and product endpoints (no UI) and follows the Fall 2025 A2 Swagger spec. All write operations accept JSON only. Some endpoints are public; others require authentication.

## Key features:

Health check endpoint for service readiness

User accounts: create, get self, update self

Products: create, get (public), replace, patch, delete

Authentication: Basic Auth (username + password on every protected request)

Security: passwords hashed with BCrypt; passwords never returned in responses

Validation: usernames must be valid emails; system audit fields are read-only

Status codes: 200/201/204 happy paths; 400/401/403/404/409/415 error handling

What you need before you start

A recent Node.js runtime (v20 or newer recommended)

A local PostgreSQL server (v14+), with the SQL command-line client available

The ability to create two local databases (one for development, one for tests)

## Configuration (environment)

The app is configured via environment variables. You’ll point it at your local PostgreSQL databases and choose the port it listens on. For tests, use a separate test database. You don’t need any UI-related settings because this is strictly an API.

At minimum you will provide:

The HTTP port to listen on for local development

A development database URL (for normal usage)

A test database URL (for the automated test suite)

## Database setup

Create your development database, then enable the UUID extension.

Create your test database, also enable the UUID extension.

Apply the schema in sql/schema.sql to both databases.

This creates the users and products tables, plus the required indexes and constraints.

(If you’re ever unsure, describe the schema: users have names, email username, bcrypt password hash, and audit timestamps; products have name, description, sku, manufacturer, quantity, owner id, and audit timestamps. sku + owner is unique; quantity can’t be negative.)

## Running the API locally

Ensure PostgreSQL is running and your development database is reachable.

Start the server using your project’s start script.

When it’s running, open your REST client and call the health endpoint to confirm you get an HTTP 200.

If the server refuses to start, it’s usually a database connection issue. Double-check your database URL, that the database exists, and that the UUID extension was enabled before applying the schema.

Using the API with Postman (or any REST client)

## Environment variables you’ll use in Postman:

base_url set to your local server (for example, http://localhost:3000
)

You don’t need to store a token because authentication is Basic (username/password on each protected request)

Auth mode for protected endpoints:
Set Authorization type to Basic Auth, and provide the created user’s email as the username and their password as the password. (No sessions, no JWT.)

## Manual flow:

Call the health endpoint (should return 200).

Create a user account (returns 201 and the new user id). Usernames must be valid emails.

Get the user by id (requires Basic Auth for that same user; returns 200).

Update the user (requires Basic Auth; returns 204 and no body).

Create a product (requires Basic Auth; returns 201 and the product id).

Get the product by id (public; returns 200).

Replace the product (requires Basic Auth and JSON; returns 204).

Patch the product (requires Basic Auth and JSON; returns 204).

Delete the product (requires Basic Auth; returns 204).

## Important behaviors to know:

JSON is required on POST/PUT/PATCH. If the content type isn’t JSON, the API returns 415.

If you try to act as a different user, the API returns 403.

If you omit or provide wrong Basic credentials, the API returns 401.

Immutable fields like audit timestamps, ids, and username are rejected on updates with a 400.

Duplicate user emails and duplicate product SKU per owner are rejected with a 409.

## Automated tests (integration)

A full set of integration tests exists and runs against the test database. These tests cover positive paths, negative validations, auth/authorization, and edge cases. They also verify the correct status codes and that passwords are never leaked in any response.

To run them locally, use your project’s test script with your test database configured and the schema applied. The test suite truncates the test tables between tests.

## Continuous Integration (GitHub Actions)

A CI workflow is included that:

Checks out the repo on pull requests to the main branch

Spins up a disposable PostgreSQL service

Applies the schema

Installs dependencies and runs the automated tests

Fails the PR if any tests fail

Use branch protection to require the CI check to pass before merging.

Troubleshooting quick tips

401 on a protected endpoint: provide Basic Auth with the correct email and password.

403 when getting a user: you can only fetch your own user record.

415 on POST/PUT/PATCH: set Content-Type to application/json and send valid JSON.

409 when creating resources: email already used for a user, or SKU already used by the same owner.

DB connection errors: verify the database exists, the URL is correct, the UUID extension is enabled, and the schema has been applied.

## What this app deliberately does not include

Any HTML pages, forms, or UI components

Any session management or JWT usage (Basic Auth is used for protected endpoints)

Any return of password hashes or sensitive fields in responses
