# Kata Platform Pokemon Chatbot Starter

This workspace gives you a starter implementation for the assignment:

- `bot.yml`: a Bot Studio source template for registration and Pokemon lookup
- `api-service/`: a simple Node.js API service with MySQL storage and PokeAPI integration
- `docs/architecture.md`: a diagram and short architecture explanation
- `docs/kata-dashboard-ui.md`: a step-by-step guide for the current Bot Studio UI

## Recommended architecture

1. Telegram user chats with your bot.
2. Kata Platform handles conversation flow and name validation.
3. Kata Platform calls your API service:
   - `POST /api/register` to save registered users in MySQL
   - `POST /api/pokemon/query` to fetch and format Pokemon data
4. The API service calls [PokeAPI](https://pokeapi.co/) for Pokemon details.

## What to build in Kata Platform

Use the Kata docs as the reference while configuring the dashboard:

- Kata Platform overview: [docs.kata.ai/kata-platform/introduction/about](https://docs.kata.ai/kata-platform/introduction/about)
- Bot Studio tutorial: [docs.kata.ai/tutorials/bot-studio](https://docs.kata.ai/tutorials/bot-studio)
- Supermodel / Kata Entity: [docs.kata.ai/kata-platform/how-to/how-to-use-super-model-to-improve-your-bot-intelligence](https://docs.kata.ai/kata-platform/how-to/how-to-use-super-model-to-improve-your-bot-intelligence)
- Sync API action: [docs.kata.ai/kata-platform/how-to/using-sync-api-to-access-third-party-application](https://docs.kata.ai/kata-platform/how-to/using-sync-api-to-access-third-party-application)
- Telegram deployment: [docs.kata.ai/kata-platform/documentation-content/start-your-first-chatbot](https://docs.kata.ai/kata-platform/documentation-content/start-your-first-chatbot)
- Bot development FAQ: [docs.kata.ai/kata-platform/faqs/bot-development-faqs](https://docs.kata.ai/kata-platform/faqs/bot-development-faqs)

## Dashboard setup checklist

### 1. Create the project

- Open [https://platform.kata.ai/](https://platform.kata.ai/)
- Create a new project, for example `pokemon-assistant`

### 2. Prepare Supermodel NLU for name validation

Follow the Supermodel guide and create:

- NLU name: `supermodel`
- Type: `NL`
- Threshold: `0.8`
- Output: `Phrase`
- Entity Name: `kata`

Then create an intent for registration name input:

- Intent name: `captureName`
- Intent type: `Text`
- Add classifier:
  - NLU: `supermodel`
  - Match with: `person`
  - Custom option:
    - `labels: true`
- Add attribute:
  - Name: `name`
  - NLU: `supermodel`
  - Path: `person`

This follows the documented Supermodel setup where `person` is the label for names.

### 3. Create the other intents

Create these intents in Bot Studio:

- `startTelegram`
  - Initial: `true`
  - Type: `Text`
  - Condition: `content == '/start'`
- `registerStatus`
  - Type: `Command`
  - Condition: `content == 'register_status'`
- `pokemonStatus`
  - Type: `Command`
  - Condition: `content == 'pokemon_status'`
- `askPokemon`
  - Type: `Text`
  - Condition: `/pokemon|info|detail|about|information/i.test(content)`
- `reenter`
  - Type: `Command`
  - Condition: `content == 'reenter'`

### 4. Build the flow

Use [`bot.yml`](/Users/gaogao/Documents/New%20project/bot.yml) as the source template. The important behavior is:

- `/start` opens the registration flow
- bot asks for the user's full name
- `captureName` only continues when Supermodel detects a `person`
- bot calls your API to save the user
- after registration, user can ask things like:
  - `pokemon pikachu`
  - `tell me about charizard`
  - `pokemon detail bulbasaur`
- bot calls your API and returns a detailed answer

If your dashboard looks like the state editor from our chat:

- each state must have at least one action before it can be saved
- only one transition may be available while creating a new state
- extra transitions are added after the state already exists on the canvas

Use [`docs/kata-dashboard-ui.md`](/Users/gaogao/Documents/New%20project/docs/kata-dashboard-ui.md) for the exact state-by-state steps for that UI.

### 5. Deploy the API service

Use the service in [`api-service/README.md`](/Users/gaogao/Documents/New%20project/api-service/README.md).

Important:

- build and run the registration API before wiring the `validateName` API action in Kata
- Kata's docs require the API action to return HTTP `200` and JSON, otherwise `$(result)` may be `null`
- Kata's docs also mention a short timeout, so use a public URL and keep responses fast

After deployment, copy the public base URL, for example:

```text
https://your-api.example.com
```

Update `bot.yml` placeholders:

- `https://YOUR_API_BASE_URL/api/register`
- `https://YOUR_API_BASE_URL/api/pokemon/query`

### 6. Deploy to Telegram

Per Kata's Telegram deployment guide:

1. In Telegram, open `@BotFather`
2. Run `/newbot`
3. Save the bot token and username
4. In Kata Platform, create a Telegram channel under `Deploy > Environment`
5. Paste the bot token
6. Copy the Kata webhook URL
7. Open:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_KATA_WEBHOOK_URL>
```

8. Test the bot in Telegram

## Submission items

After you finish deployment, your submission can be:

- Telegram Bot ID: from BotFather / your Telegram bot username
- `bot.yml`: [`bot.yml`](/Users/gaogao/Documents/New%20project/bot.yml)
- API service repository URL: push [`api-service/`](/Users/gaogao/Documents/New%20project/api-service) to GitHub
- README setup instructions: included in [`api-service/README.md`](/Users/gaogao/Documents/New%20project/api-service/README.md)
- Diagram: [`docs/architecture.md`](/Users/gaogao/Documents/New%20project/docs/architecture.md)

## Notes

- Kata's API action should return HTTP `200` with JSON so `$(result)` is available in the bot.
- Kata's docs mention API timeout constraints, so keep the Pokemon endpoint fast.
- The bot template here keeps Pokemon parsing in the API service to reduce Bot Studio complexity.
- For the current dashboard UI, treat `Intents` and `States` separately:
  - `Intents` decide what the user said
  - `Transitions` in `States` decide where the bot moves next
