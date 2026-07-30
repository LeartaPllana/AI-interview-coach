# AI Interview Coach

Premium React/Vite frontend with an Express API foundation for the AI Interview Coach concept.

## Included

- Responsive premium candidate workspace with light/dark mode
- Interview preparation, live text-response flow, real-time guidance shell, reports, and growth views
- React Router navigation and interaction states
- Express REST API foundation with CORS, Helmet, health check, interview creation, and report endpoint
- `.env.example` with XAMPP MySQL and AI provider configuration placeholders

## Run locally

Use Node.js 18+.

```bash
npm install
npm run dev
```

In another terminal, run the API:

```bash
npm run server
```

Before the first start, copy `.env.example` to `.env` and set your MySQL connection values. The API creates `users` and `interviews` tables automatically. To create the initial administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting it.

Open `http://localhost:5173/` to register or sign in. The root URL automatically shows authentication when no valid session exists; after sign-in, users are sent to their workspace and administrators to `/admin`. Completed practice answers are saved for signed-in users.

Open `http://localhost:5173`.

## Deploy on Netlify

The frontend and API are deployed together. Netlify routes `/api/*` requests to the `api` function before the React SPA fallback, so validation errors are always returned as JSON.

In **Site configuration → Environment variables**, add the same production values used by the API: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, and optionally `ADMIN_*`, `OPENAI_API_KEY`, and `OPENAI_MODEL`. The MySQL server must be externally reachable from Netlify; `localhost` only works during local development. For Aiven MySQL, also set `DB_SSL=true`.

## Next production steps

Connect the Express services to the normalized MySQL schema from the project blueprint, add JWT authentication and refresh tokens, replace the demo endpoints with protected MVC routes, and attach the AI provider adapter to OpenAI or Ollama.
