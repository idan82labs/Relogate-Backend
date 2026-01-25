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

## Stripe Testing (Local Development)

To test Stripe payments locally, you need to forward webhook events to your local server using the Stripe CLI.

### 1. Install Stripe CLI

```bash
# Option A: Run the setup script (auto-installs if missing)
./scripts/stripe-setup.sh

# Option B: Manual installation (Linux)
curl -sL https://github.com/stripe/stripe-cli/releases/download/v1.21.0/stripe_1.21.0_linux_x86_64.tar.gz -o stripe.tar.gz
tar -xzf stripe.tar.gz
mkdir -p ~/.local/bin
mv stripe ~/.local/bin/
export PATH="$HOME/.local/bin:$PATH"

# Option C: macOS
brew install stripe/stripe-cli/stripe
```

### 2. Authenticate with Stripe

```bash
stripe login
```

This opens a browser to authenticate with your Stripe account.

### 3. Get Test API Keys

1. Go to [Stripe Test API Keys](https://dashboard.stripe.com/test/apikeys)
2. Copy your test keys and add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

### 4. Start Webhook Listener

In a separate terminal, run:

```bash
# Option A: Use the helper script
./scripts/stripe-webhook.sh

# Option B: Run directly
stripe listen --forward-to localhost:3001/api/v1/payments/webhook
```

The CLI will display a webhook signing secret (starts with `whsec_`). Copy it to your `.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 5. Test the Integration

With both the backend server (`npm run dev`) and webhook listener running:

1. Create a payment through the API
2. Watch the webhook listener terminal for incoming events
3. Check server logs for payment processing

### Test Card Numbers

| Card Number | Scenario |
|-------------|----------|
| `4242424242424242` | Successful payment |
| `4000000000000002` | Card declined |
| `4000000000009995` | Insufficient funds |

Use any future expiry date and any 3-digit CVC.

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
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) | For payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) | For payments |

## Security Notes

- **NEVER** commit `.env` files
- **NEVER** expose `SUPABASE_SERVICE_KEY` to frontend
- All passwords are hashed by Supabase Auth (bcrypt)
- JWT tokens are managed by Supabase Auth

## License

UNLICENSED - Private
