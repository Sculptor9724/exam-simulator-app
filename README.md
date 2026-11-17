# API Key Server

An Express API for exam-related tools. It generates examiner questions, grades
exam transcripts, prepares project-defense questions from PDFs or GitHub
repositories, and issues short-lived Gemini Live API tokens.

## Requirements

- Node.js (the version selected for this project is recorded in `.nvmrc`)
- npm
- API credentials and service configuration for the features you want to use

## Run locally

```bash
npm install
cp .env.example .env
```

Add your credentials to `.env`. Do not commit this file or put credentials in
client-side code. Start the server with:

```bash
npm run dev
```

The server listens on port `3002` by default. Use `npm start` to run it without
the development file watcher. Set `PORT` to change the port.

## Configuration

| Variable | Required for | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Gemini endpoints | Google Gemini API key |
| `GEMINI_MODEL` | Optional | Gemini model name; defaults to `gemini-3.8-flash` |
| `GITHUB_API_KEY` | GitHub repository input | GitHub token used to read repository contents |
| `SUPABASE_URL` | Authenticated routes and account deletion | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Authenticated routes and account deletion | Supabase publishable key used to validate access tokens |
| `SUPABASE_SECRET_KEY` | Account deletion | Backend-only Supabase secret key; never expose it to clients |
| `DATABASE_URL` | `/can-connect` | PostgreSQL connection string |
| `PORT` | Optional | HTTP port; defaults to `3002` |
| `NODE_ENV` | Optional | Set to `development` for local work and `production` when deployed |
| `JSON_BODY_LIMIT` | Optional | Maximum JSON request size; defaults to `10mb` |
| `FORM_BODY_LIMIT` | Optional | Maximum URL-encoded request size; defaults to `10mb` |
| `DISABLE_AUTH` | Local development only | Set to `true` to bypass auth outside production; never enable in production |

Some endpoints require a database table named `exam_logs`.
`/can-connect` reads it to enforce the daily exam limit.

## API

Protected endpoints require a Supabase access token in the `Authorization`
header using the Bearer scheme. Authentication is enforced on these routes:

| Method and path | Description |
| --- | --- |
| `GET /auth-token` | Creates a short-lived Gemini Live API token |
| `GET /can-connect` | Returns whether exam generation is currently allowed |
| `POST /get-examiner-questions` | Generates a student exam task |
| `POST /get-grade-and-feedback` | Extracts a grade and feedback from an examiner transcript |
| `POST /project-defense` | Generates project-defense questions using a GitHub repository and/or PDF files |

### Generate an examiner task

`POST /get-examiner-questions` accepts JSON. `learning_goals`, `title`, and
`duration` are required; the remaining fields are optional.

```json
{
  "learning_goals": "Understand the system architecture",
  "title": "Software architecture",
  "duration": 30,
  "description": "An oral examination about the submitted project",
  "typical_questions": "Discuss design trade-offs",
  "examples": "Example task text",
  "task_generation_instructions": "Keep the task focused"
}
```

### Grade a transcript

`POST /get-grade-and-feedback` accepts JSON with a required `text` transcript.
An optional `exam` object can include `title`, `description`,
`learning_goals`, and `grade_criteria`.

```json
{
  "text": "The student explained the design clearly. I would give a grade of 10.",
  "exam": {
    "title": "Software architecture",
    "learning_goals": "Explain architectural decisions"
  }
}
```

### Generate project-defense questions

`POST /project-defense` uses `multipart/form-data`. Include `learning_goals`
and a `duration` from 1 to 240 minutes. Supply at least one PDF using the
`files` field, a GitHub repository URL in `repoUrl`, or both. Optional text
fields include `typical_questions`, `description`, `grade_criteria`, and
`feedback`. The endpoint accepts up to 10 uploaded files.

### Delete the authenticated account

`DELETE /api/me` requires a Supabase bearer access token. It deletes the account
belonging to that token; it does not accept a user ID from the caller. Call it
only after your client has confirmed the user's intent.

## Authentication and CORS

The browser CORS allowlist is configured in `index.js`. If your frontend uses a
different origin, add it there before making browser requests. Requests without
an `Origin` header are allowed for non-browser clients.

`DISABLE_AUTH=true` bypasses route authentication only when `NODE_ENV` is not
`production`. Do not use this setting in a deployed production environment.

## Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

Some tests make live requests to GitHub and require network access and a
working GitHub token. The Gemini-dependent tests also need `GEMINI_API_KEY`.

## Deployment

The repository includes Vercel configuration in `vercel.json`. Configure the
required environment variables in the deployment platform; do not upload or
commit your local `.env` file. Ensure the database tables and CORS origins
required by your deployment are configured.

## License

This project is released under the MIT License. See [LICENSE](./LICENSE).
