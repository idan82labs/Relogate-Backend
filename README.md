# Relogate Backend

Node.js + Express + TypeScript backend API for the Relogate platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Language**: TypeScript 5 (strict mode)
- **Database**: Supabase (PostgreSQL + Auth)
- **Validation**: Zod
- **Logging**: Pino

## Quick Start

### Prerequisites

- Node.js 20 or higher
- npm
- Supabase project (get credentials from dashboard)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/v1/health` - API health status

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user (protected)

## Scripts

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Build TypeScript to dist/
npm run start     # Run production build
npm run lint      # Run ESLint
npm run typecheck # Type check without emitting
npm run test      # Run tests
```

## Project Structure

```
src/
├── config/         # Configuration (env, logger)
├── lib/            # Shared utilities (supabase, errors)
├── middleware/     # Express middleware
├── modules/        # Feature modules
│   └── auth/       # Authentication module
├── routes/         # Route aggregator
├── types/          # Global TypeScript types
├── app.ts          # Express app setup
└── server.ts       # Entry point
```

## Environment Variables

See `.env.example` for all configuration options.

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |

## Security Notes

- **NEVER** commit `.env` files
- **NEVER** expose `SUPABASE_SERVICE_KEY` to frontend
- All passwords are hashed by Supabase Auth (bcrypt)
- JWT tokens are managed by Supabase Auth

## License

UNLICENSED - Private
