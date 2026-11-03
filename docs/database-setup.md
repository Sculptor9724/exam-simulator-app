# Database setup

AI Voice Exam uses Supabase for authentication and PostgreSQL for application data.
This guide sets up a new local development database using the migrations in
`supabase/migrations/`. No users or teaching material are seeded.

## Prerequisites

- Docker, running locally
- Supabase CLI (the configuration was generated with version 2.40.7)
- Node.js 20 or later and npm
- PostgreSQL client `psql`, if you want to run the database tests

Run the commands below from the repository root.

## 1. Start Supabase

```sh
supabase start
supabase status
```

Supabase starts the local services and applies the migrations when creating the
local database. The repository configures these endpoints:

| Service | Address |
| --- | --- |
| API | http://127.0.0.1:54321 |
| PostgreSQL | 127.0.0.1:54322 |
| Studio | http://127.0.0.1:54323 |
| Test email inbox | http://127.0.0.1:54324 |

To recreate the local database and replay all migrations:

```sh
supabase db reset --local
```

**Resetting deletes existing data in this local development database.** Use it
only when you are ready to discard that data. Seeding is disabled.

## 2. Configure the frontend

Copy the example configuration if you do not already have `.env.local`:

```sh
cp .env.example .env.local
```

Set the following values in `.env.local`:

```dotenv
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=your-local-anon-or-publishable-key
REACT_APP_API_URL=http://127.0.0.1:3002
```

Use the local anon/publishable key reported by `supabase status`. Frontend
configuration is visible in the browser, so never use a service-role key or an
AI-provider secret here. Keep `.env.local` out of version control.

Set `REACT_APP_API_URL` to the address of your separately configured AI backend,
the [`api-key-server`](https://github.com/Sculptor9724/api-key-server) repository.
Port 3002 is that backend's default; this repository's database setup does not
start it. Voice sessions require the backend and its provider configuration.

Install dependencies and start the frontend:

```sh
npm ci
npm start
```

Open http://localhost:3000. Restart the frontend after changing environment values.
Missing Supabase or backend configuration prevents the app from starting correctly.

## 3. Allow your development account to sign up

Open Studio at http://127.0.0.1:54323 and run this in its SQL editor, replacing the
example address with the email you will use:

```sql
insert into public.signup_allowed_emails (email)
values ('developer@example.invalid')
on conflict do nothing;
```

Sign up through the frontend, then open the local test email inbox at
http://127.0.0.1:54324 to follow the confirmation link. Email confirmation is
enabled. Account creation automatically creates the associated application profile.

The database enforces the email allowlist, including for accounts created through
administrative tools. Add each email before creating its account; an empty
allowlist rejects all new accounts. Matching ignores case and surrounding spaces.

The default authentication redirects use localhost port 3000. If you change the
frontend address, update `auth.site_url` and `auth.additional_redirect_urls` in
`supabase/config.toml` and restart the local Supabase services.

## 4. Run the database tests

With the local services running:

```sh
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -v ON_ERROR_STOP=1 -f supabase/tests/fresh-install.sql
```

This connection uses local development credentials. Run the tests only against
this disposable local database, never production.

The tests create synthetic accounts and exercise profile creation, signup
allowlisting, class joining, exam/result access, ownership restrictions and
account-deletion cascades. Test writes run in a transaction and are rolled back.
They do not test browser interactions, email delivery or AI voice sessions.

## Access control

Row-level security limits application data access. To join a class, the frontend
looks up its join code, gets or creates the signed-in user's profile, checks for
an existing membership and inserts the membership directly.

Authenticated users can read class records for joining. Membership insert policies
check profile ownership; they do not independently enforce possession of a join
code. A developer needing private class discovery or database-enforced join-code
verification should review this flow before hosting it.

Profile role and `is_student` values are user-supplied product fields. Do not use
them as proof of administrative privileges in a backend or deployment.

## Existing or hosted databases

The migrations provide a complete schema for a new database. Do not apply the
initial migration chain directly to a populated database with an existing schema.
Compare its schema and migration history first, then test an upgrade plan on a
disposable copy before applying changes.

For a hosted installation, configure authentication URLs, email delivery,
frontend environment values and the separate AI backend for that environment.
The local settings in this guide are intended for development.

The migration chain and SQL tests have been checked in an isolated PostgreSQL
environment. Full Supabase authentication, email and backend/voice integration
still require verification for your installation.
