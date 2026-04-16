import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeDatabase, listUsers, upsertUser } from './db.js';
import { getPokemonResponse } from './pokemon.js';

const app = express();
app.use(express.json());

const config = {
  port: Number(process.env.PORT || 3300),
  db: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'kata_user',
    password: process.env.MYSQL_PASSWORD || 'kata_pass',
    database: process.env.MYSQL_DATABASE || 'kata_pokemon_bot'
  }
};

let initializationPromise;

function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase(config.db);
  }

  return initializationPromise;
}

app.get('/', (_request, response) => {
  response.json({
    success: true,
    message: 'Kata Pokemon API is running.',
    endpoints: [
      '/health',
      '/api/register',
      '/api/pokemon/query',
      '/api/users'
    ]
  });
});

app.get('/health', (_request, response) => {
  response.json({ success: true });
});

app.post('/api/register', async (request, response) => {
  try {
    await ensureInitialized();

    const telegramUserId = String(request.body.telegramUserId || '').trim();
    const telegramSenderName = String(request.body.telegramSenderName || '').trim();
    const fullName = String(request.body.fullName || '').trim();
    const channelType = String(request.body.channelType || 'telegram').trim();

    if (!fullName) {
      return response.status(200).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    // Fall back to sender name when channel metadata does not expose a stable ID.
    const effectiveTelegramUserId = telegramUserId || telegramSenderName || `guest-${Date.now()}`;

    const user = await upsertUser(config.db, {
      telegramUserId: effectiveTelegramUserId,
      telegramSenderName: telegramSenderName || null,
      fullName,
      channelType
    });

    return response.status(200).json({
      success: true,
      message: `Registration saved for ${user.fullName}. You can ask for Pokemon information now.`,
      user
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      message: 'Registration failed because the database is unavailable.',
      error: error.message
    });
  }
});

app.post('/api/pokemon/query', async (request, response) => {
  const query = String(request.body.query || '').trim();

  if (!query) {
    return response.status(200).json({
      success: false,
      message: 'Pokemon query is required.'
    });
  }

  const result = await getPokemonResponse(query);
  return response.status(200).json(result);
});

app.get('/api/users', async (request, response) => {
  try {
    await ensureInitialized();

    const todayOnly = String(request.query.today || '').toLowerCase() === 'true';
    const users = await listUsers(config.db, todayOnly);

    return response.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: error.message
    });
  }
});

async function start() {
  app.listen(config.port, () => {
    console.log(`API service listening on http://localhost:${config.port}`);
  });

  // Warm up the DB connection without blocking startup.
  ensureInitialized().catch((error) => {
    console.error('Database initialization failed:', error.message);
  });
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  start().catch((error) => {
    console.error('Failed to start API service:', error);
    process.exit(1);
  });
}

export default app;
