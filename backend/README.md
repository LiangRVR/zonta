# Zonta Club of Naples - Backend API

RESTful API backend for the Zonta Club of Naples website.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

## API Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

## Tech Stack

- Node.js
- Express.js
- CORS
- dotenv

## Development

The API runs on port 3000 by default (configurable via `.env` file).

Use `npm run dev` for development with auto-reload.
