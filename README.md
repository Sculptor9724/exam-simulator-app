# AI Voice Exam

A modern application that helps students prepare for oral exams by simulating realistic exam environments using AI-powered examiners.

## Features

- **Dynamic Exam Environments**: Practice with various exam types including standard and Github repository-based exams
- **Customizable Examiners**: Choose friendly, strict, or other examiner personalities 
- **Real-time Feedback**: Get immediate evaluation of your performance
- **Adjustable Duration**: Set custom time limits for your practice sessions
- **Countdown Timer**: Visual tracking of your remaining exam time
- **Learning Goal Assessment**: Customize which competencies you want to be evaluated on
- **Multiple Grading Systems**: Support for 7-point scale, pass/fail, and more

## Setup

### Prerequisites
- Node.js 20 or later (tested with Node 22.10.0)
- npm (tested with npm 11.1.0; use the committed package-lock.json)
- Chrome browser (recommended for optimal experience)

### Getting Started

1. Check out this repository and install the locked frontend dependencies:
   ```sh
   npm ci
   ```
2. Follow [database setup](docs/database-setup.md) to start a separate local
   Supabase instance and apply the migrations.
3. Copy `.env.example` to `.env.local` and fill in your local Supabase URL and
   anon/publishable key from `supabase status`. Set `REACT_APP_API_URL` to your
   AI backend's URL (see [AI backend](#ai-backend)); it must be `https://`, or
   `http://` only for localhost, with no credentials, query, or fragment.
4. Start the frontend:
   ```sh
   npm start
   ```
5. Open the URL printed by the development server (normally http://localhost:3000).

AI sessions additionally require the separate `api-key-server` backend (see
[AI backend](#ai-backend)). Database setup alone does not configure the voice
integration.

## AI backend

The AI features use a separate backend, [`api-key-server`](https://github.com/Sculptor9724/api-key-server),
which lives in its own repository and is not part of this one.

- **Location:** https://github.com/Sculptor9724/api-key-server
- **License:** MIT, Copyright (c) 2025 EK - Erhvervsakademi København (see its `LICENSE`)
- **Role:** Express API for examiner questions, grading, project defense, and
  Gemini Live tokens. Keeps AI-provider keys on the server.
- **Local run:** follow that repository's README; it listens on port 3002 by default.

`REACT_APP_API_URL` is required: the app throws at startup if it is missing.
During local development use `http://127.0.0.1:3002` (the backend's default
port). Deployed backends must use HTTPS. Never put AI-provider keys in frontend
environment variables.

## Usage
1. From the dashboard, select an exam type or create a new custom exam
2. Configure exam settings (duration, examiner type, learning goals)
3. Start the exam and practice answering questions
4. Receive feedback and a grade at the end of your session
5. Review your performance and try again to improve

## Database setup

Follow [database setup](docs/database-setup.md) for a new local database.
Do not push the reconstructed baseline to an existing database.

## Deploy
`npm run deploy`

## Structure
Application source code is in the `src` folder.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Licensing and release status

Original AI Voice Exam code is licensed under the [MIT license](LICENSE), with EK
(Erhvervsakademi København) as copyright holder.
Google-derived files and local adaptations remain **Apache-2.0**. This is a
combination of licenses (`MIT AND Apache-2.0`), not permission to choose either
license for every file. See [the exact file inventory](THIRD_PARTY_NOTICES.md)
and [the full Apache license](LICENSES/Apache-2.0.txt).

The hosted service and third-party services are separate from the code license;
self-hosting requires your own setup.
Build distributions must retain the generated `licenses/` directory.

Copy `.env.example` to `.env.local` and configure your own Supabase instance;
the original production database is not a development default. Set
`REACT_APP_API_URL` to your separate backend URL; there is no hosted API fallback.

## Known limitations

Dependency-security findings remain unresolved. Full Supabase authentication and
backend/voice integration have not been verified for a fresh installation.
Developers should review dependencies and test their deployment before hosting it.
