# Kata Platform Pokemon Chatbot

A Telegram chatbot that registers users and provides detailed Pokemon information.

## Project Structure

- `bot.yml` - Bot Studio flow configuration
- `api-service/` - Node.js + Express API with MySQL and PokeAPI integration
- `docs/` - Architecture and setup guides

## Live Deployment

- API: [https://kata-chatbot.vercel.app](https://kata-chatbot.vercel.app)
- Bot: [https://t.me/pokkemonTestBot](https://t.me/pokkemonTestBot)

## Architecture

1. User chats via Telegram
2. Kata Platform manages conversation flow and validates names
3. API service stores users in MySQL and fetches Pokemon data from PokeAPI

## API Endpoints

- `POST /api/register` - Save registered users
- `POST /api/pokemon/query` - Fetch Pokemon information

## Setup

### 1. Kata Platform Configuration

Create project at [platform.kata.ai](https://platform.kata.ai/)

**Supermodel NLU**:
- Name: `supermodel`, Type: `NL`, Threshold: `0.8`

**Intents**: See [docs/kata-dashboard-ui.md](docs/kata-dashboard-ui.md) for complete configuration

**Bot Flow**:
```
init → askRegistration → validateName → registrationSuccess → readyForPokemon → fetchPokemon
                              ↓                                                      ↓
                     registrationFailed                                    pokemonFound/NotFound
```

### 2. Deploy API Service

See [api-service/README.md](api-service/README.md) for:
- Local development setup
- Vercel deployment
- Environment variables

API must return HTTP 200 with JSON for Kata Platform compatibility.

### 3. Connect Telegram

1. Create bot via `@BotFather` in Telegram
2. Add bot token in Kata Platform under `Deploy > Environment`
3. Set webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<KATA_WEBHOOK>`

## References

- [Kata Platform Docs](https://docs.kata.ai)
- [Bot Studio Tutorial](https://docs.kata.ai/tutorials/bot-studio)
- [Supermodel Guide](https://docs.kata.ai/kata-platform/how-to/how-to-use-super-model-to-improve-your-bot-intelligence)
