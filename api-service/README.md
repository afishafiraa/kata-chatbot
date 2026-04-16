# API Service

This service supports the Kata Platform chatbot by:

- saving registered users to MySQL
- retrieving detailed Pokemon information from PokeAPI
- returning JSON responses that fit Kata Sync API usage

It works for:

- local development with `npm run dev`
- deployment to Vercel as an Express app

Live deployment:

- API base URL: [https://kata-chatbot.vercel.app](https://kata-chatbot.vercel.app)

## Endpoints

### `GET /health`

Health check.

### `GET /`

Simple status route for easier Vercel verification.

### `POST /api/register`

Save or update a registered user.

Example request:

```json
{
  "telegramUserId": "123456789",
  "telegramSenderName": "ash_k",
  "fullName": "Ash Ketchum",
  "channelType": "telegram"
}
```

### `POST /api/pokemon/query`

Accept a free-text query from the bot and return a detailed Pokemon response.

Example request:

```json
{
  "query": "tell me about pikachu"
}
```

### `GET /api/users`

List registered users so you can inspect who used the chatbot.

Optional query params:

- `today=true`

## Local setup

### 1. Create `.env`

Copy `.env.example` to `.env`.

`docker compose` and the Node.js app both read their MySQL settings from this file, so put your real local credentials there instead of hardcoding them in `docker-compose.yml`.

### 2. Start MySQL and Adminer

```bash
docker compose up -d
```

This starts:

- MySQL on `localhost:3306`
- Adminer on [http://localhost:8090](http://localhost:8090)

### 3. Install dependencies

```bash
npm install
```

### 4. Run the API

```bash
npm run dev
```

The API will run on:

```text
http://localhost:3300
```

This local URL is only for testing on your own machine.

If you want file watching during development, you can try:

```bash
npm run dev:watch
```

If `dev:watch` fails with too many open files on your machine, keep using `npm run dev`.

### 5. Test the registration API before connecting Kata

Kata's API action expects HTTP `200` and a JSON body. Test the registration endpoint first:

```bash
curl -X POST http://localhost:3300/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "telegramUserId": "123456789",
    "telegramSenderName": "ash_k",
    "fullName": "Ash Ketchum",
    "channelType": "telegram"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Registration saved for Ash Ketchum. You can ask for Pokemon information now.",
  "user": {
    "telegramUserId": "123456789",
    "fullName": "Ash Ketchum"
  }
}
```

After that, test the Pokemon endpoint:

```bash
curl -X POST http://localhost:3300/api/pokemon/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tell me about pikachu"
  }'
```

## Deploy to Vercel

This API can be deployed to Vercel using Vercel's current Express support.

Official references:

- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [GitHub Actions with Vercel](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)

This project also includes:

- [`vercel.json`](/Users/gaogao/Documents/New%20project/api-service/vercel.json)
- [`api/index.js`](/Users/gaogao/Documents/New%20project/api-service/api/index.js)

That follows Vercel's documented Express pattern of routing incoming requests to an API entrypoint, which is useful when a deployment completes successfully but otherwise serves `404`.

### Project root

Deploy [`api-service/`](/Users/gaogao/Documents/New%20project/api-service) as its own Vercel project.

If you import the whole repository into Vercel, set:

- `Root Directory` = `api-service`

### Database requirement

Your local Docker MySQL is only for local development.

Inference from Vercel's serverless model:

- Vercel can host this Node.js API
- Vercel cannot connect to a MySQL container running only on your laptop
- so production needs a public MySQL database

Examples:

- Railway MySQL
- Aiven for MySQL
- PlanetScale
- MySQL on a VPS

### Environment variables in Vercel

Set these in `Project Settings > Environment Variables`:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Optional:

- `PORT`

### GitHub Actions secrets vs Vercel environment variables

These are two different systems.

- GitHub Actions secrets are available only while the GitHub workflow is running
- Vercel environment variables live in the Vercel project and are available to the deployed Functions

If you use Vercel's built-in Git integration, GitHub Actions secrets are not automatically passed to Vercel.

If you use GitHub Actions to deploy to Vercel, you can pass secrets during deploy using the Vercel CLI. This repository includes an example workflow in [`.github/workflows/vercel-production.yml`](/Users/gaogao/Documents/New%20project/.github/workflows/vercel-production.yml).

Recommended GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Important:

- if you later redeploy from the Vercel dashboard directly, those GitHub-only secrets will not be reused automatically
- for long-term stability, I recommend also storing the same `MYSQL_*` values in the Vercel project settings
- use one deployment path consistently: either Vercel Git integration or GitHub Actions, to avoid duplicate deployments

### Deploy from the dashboard

1. Push the project to GitHub.
2. Open [https://vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Set `Root Directory` to `api-service`.
5. Add the environment variables.
6. Deploy.

This is the simplest option if you want Vercel to manage deployments directly.

### Deploy from the CLI

Run this from inside [`api-service/`](/Users/gaogao/Documents/New%20project/api-service):

```bash
vercel
```

For a production deployment:

```bash
vercel --prod
```

### Deploy from GitHub Actions

This repository includes a production workflow:

- [`.github/workflows/vercel-production.yml`](/Users/gaogao/Documents/New%20project/.github/workflows/vercel-production.yml)

It follows Vercel's GitHub Actions guidance by using:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

and passes the `MYSQL_*` values from GitHub secrets to the production deployment.

### Verify the Vercel deployment

Open:

- `https://kata-chatbot.vercel.app/`
- `https://kata-chatbot.vercel.app/health`

Then test the registration endpoint:

```bash
curl -X POST https://kata-chatbot.vercel.app/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "telegramUserId": "123456789",
    "telegramSenderName": "ash_k",
    "fullName": "Ash Ketchum",
    "channelType": "telegram"
  }'
```

Use the deployed Vercel URL in Kata:

- `https://kata-chatbot.vercel.app/api/register`
- `https://kata-chatbot.vercel.app/api/pokemon/query`

## Deployment suggestions

You can deploy this API to:

- Vercel
- Render
- Railway
- Fly.io
- a VPS with Docker

Make sure the final base URL is public because Kata Platform Sync API must call it.

`localhost` will not work in Kata Platform.

Why:

- `http://localhost:3000` means "this same machine"
- when Kata Platform calls your API, it runs from Kata's servers, not from your laptop
- so Kata's `localhost` is not your local computer

For Kata testing, use one of these:

- deploy the API to Render, Railway, Fly.io, or a VPS
- or expose your local server temporarily with a public tunnel such as `ngrok` or `cloudflared`

Example:

- local API: `http://localhost:3000`
- tunnel/public URL: `https://abc123.ngrok-free.app`
- Kata API URL: `https://abc123.ngrok-free.app/api/register`

## How to connect it to Kata Platform

In your API actions, use:

- `POST https://kata-chatbot.vercel.app/api/register`
- `POST https://kata-chatbot.vercel.app/api/pokemon/query`

Both endpoints return HTTP `200` and JSON to align with Kata's documented API action expectations.
