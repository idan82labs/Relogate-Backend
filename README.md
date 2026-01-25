# Relogate Backend

Node.js + Express + TypeScript backend API for the Relogate relocation assistance platform.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Scripts](#scripts)
- [Stripe Testing](#stripe-testing-local-development)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 22+ (LTS) |
| **Framework** | Express 5 |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Drizzle ORM |
| **Auth** | Supabase Auth (JWT) |
| **Validation** | Zod |
| **Logging** | Pino |
| **Payments** | Stripe |
| **Testing** | Vitest + Supertest |

## Quick Start

### Prerequisites

- Node.js 22 or higher
- npm
- Supabase project ([create one here](https://supabase.com))
- Stripe account (for payments, optional)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure `.env`** with your credentials (see [Environment Variables](#environment-variables))

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Project Structure

```
src/
├── config/              # Configuration (env, logger)
│   ├── env.ts           # Environment validation with Zod
│   └── logger.ts        # Pino logger setup
├── db/                  # Database (Drizzle ORM)
│   ├── schema/          # Table definitions
│   │   ├── users.ts
│   │   ├── questionnaires.ts
│   │   ├── countries.ts
│   │   ├── reports.ts
│   │   ├── notifications.ts
│   │   ├── blog.ts
│   │   ├── payments.ts
│   │   └── index.ts
│   └── index.ts         # Database client
├── lib/                 # Shared utilities
│   ├── errors.ts        # Custom error classes
│   ├── supabase.ts      # Supabase auth client
│   └── stripe.ts        # Stripe client & config
├── middleware/          # Express middleware
│   ├── authenticate.ts  # JWT verification
│   ├── authorize.ts     # Role-based access
│   ├── validate-request.ts
│   └── error-handler.ts
├── modules/             # Feature modules
│   ├── auth/            # Authentication
│   ├── questionnaire/   # Questionnaire CRUD
│   ├── countries/       # Country catalog
│   ├── reports/         # Report generation
│   ├── notifications/   # User notifications
│   ├── blog/            # Blog & press articles
│   ├── payments/        # Stripe payments
│   ├── upload/          # File uploads
│   └── admin/           # Admin management
├── routes/              # Route aggregator
├── types/               # Global TypeScript types
├── app.ts               # Express app setup
└── server.ts            # Entry point

drizzle/                 # Generated migrations
scripts/                 # Utility scripts
tests/                   # Test files
```

### Module Pattern

Each feature module follows this structure:
```
modules/[feature]/
├── feature.routes.ts      # Route definitions
├── feature.controller.ts  # Request handlers
├── feature.service.ts     # Business logic
├── feature.schema.ts      # Zod validation schemas
├── feature.types.ts       # TypeScript types
└── index.ts               # Module exports
```

## API Documentation

Base URL: `/api/v1`

### Response Format

All responses follow this structure:

```typescript
// Success
{ success: true, data: T }

// Success with pagination
{
  success: true,
  data: T[],
  pagination: { page: number, limit: number, total: number }
}

// Error
{ success: false, error: string, code?: string, details?: object }
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | API health status |

---

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Authenticate user |
| POST | `/auth/logout` | Public | Invalidate session |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Required | Get current user profile |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

**Register Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+972501234567"
}
```

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "firstName": "..." },
    "session": {
      "accessToken": "eyJ...",
      "refreshToken": "...",
      "expiresAt": 1234567890
    }
  }
}
```

---

### Questionnaire Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/questionnaire` | Required | Get current in-progress questionnaire or create new |
| POST | `/questionnaire` | Required | Create new questionnaire (archives existing) |
| GET | `/questionnaire/status` | Required | Check onboarding status |
| GET | `/questionnaire/version-status` | Required | Get questionnaire version + migration info |
| GET | `/questionnaire/completed` | Required | Get most recent completed questionnaire |
| GET | `/questionnaire/all` | Required | Get all questionnaires for user |
| GET | `/questionnaire/:id` | Required | Get questionnaire by ID |
| PATCH | `/questionnaire/:id` | Required | Update questionnaire responses |
| POST | `/questionnaire/:id/complete` | Required | Mark questionnaire as completed |
| DELETE | `/questionnaire/:id` | Required | Archive a questionnaire |
| POST | `/questionnaire/migrate` | Required | Initiate migration for completed questionnaire |
| POST | `/questionnaire/:id/complete-migration` | Required | Complete migration |

**Update Request (PATCH):**
```json
{
  "responses": {
    "countries": ["PT", "ES", "CY"],
    "relocationReason": "work",
    "familyStatus": "married_with_children"
  },
  "currentStep": "personal_details"
}
```

---

### Countries Endpoints

**Public Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/countries` | Public | Get all active countries |

**Admin Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/countries` | Admin | List all countries with pagination |
| GET | `/admin/countries/:countryId` | Admin | Get country by ID |
| POST | `/admin/countries` | Admin | Create new country |
| PATCH | `/admin/countries/:countryId` | Admin | Update country |
| DELETE | `/admin/countries/:countryId` | Admin | Delete country |

---

### Reports Endpoints

**User Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reports/status` | Required | Get user's report status |
| GET | `/reports` | Required | Get user's published report |
| GET | `/reports/destinations/:destinationId` | Required | Get specific destination |

**Admin Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/reports` | Admin | List all reports with pagination |
| GET | `/admin/reports/pending` | Admin | Get pending questionnaires |
| GET | `/admin/reports/questionnaire/:questionnaireId` | Admin | Get questionnaire responses |
| GET | `/admin/reports/:reportId` | Admin | Get report by ID |
| POST | `/admin/reports` | Admin | Create report for questionnaire |
| PATCH | `/admin/reports/:reportId` | Admin | Update report |
| POST | `/admin/reports/:reportId/publish` | Admin | Publish report |
| DELETE | `/admin/reports/:reportId` | Admin | Delete report |
| GET | `/admin/reports/destinations/:destinationId` | Admin | Get destination by ID |
| POST | `/admin/reports/destinations` | Admin | Create destination |
| PATCH | `/admin/reports/destinations/:destinationId` | Admin | Update destination |
| POST | `/admin/reports/destinations/:destinationId/publish` | Admin | Publish destination |
| DELETE | `/admin/reports/destinations/:destinationId` | Admin | Delete destination |

---

### Notifications Endpoints

**User Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Required | List user's notifications |
| GET | `/notifications/unread-count` | Required | Get unread count |
| POST | `/notifications/mark-read` | Required | Mark as read |
| GET | `/notifications/:notificationId` | Required | Get notification by ID |
| DELETE | `/notifications/:notificationId` | Required | Delete notification |

**Admin Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/notifications` | Admin | Create notification |
| POST | `/admin/notifications/batch` | Admin | Send to multiple users |

---

### Blog & Press Endpoints

**Public Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/blog` | Public | List published blog posts |
| GET | `/blog/pages` | Public | Get total pages count |
| GET | `/blog/slugs` | Public | Get all slugs (for SSG) |
| GET | `/blog/:slug` | Public | Get post by slug |
| GET | `/blog/:slug/related` | Public | Get related posts |
| GET | `/press` | Public | List press articles |
| GET | `/press/:slug` | Public | Get press article |
| GET | `/press/:slug/related` | Public | Get related press |

**Admin Routes:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/blog` | Admin | List all posts (incl. drafts) |
| GET | `/admin/blog/:id` | Admin | Get post by ID |
| POST | `/admin/blog` | Admin | Create post |
| PATCH | `/admin/blog/:id` | Admin | Update post |
| DELETE | `/admin/blog/:id` | Admin | Delete post |
| POST | `/admin/blog/:id/publish` | Admin | Publish post |
| POST | `/admin/blog/:id/unpublish` | Admin | Unpublish post |

---

### Payments Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/config` | Public | Get Stripe publishable key |
| POST | `/payments/webhook` | Stripe | Handle Stripe webhooks |
| POST | `/payments/checkout` | Required | Create checkout session |
| GET | `/payments` | Required | Get user's payments |
| GET | `/payments/status/:productType` | Required | Check payment status |
| GET | `/payments/:paymentId` | Required | Get payment details |
| GET | `/admin/payments` | Admin | List all payments |

**Checkout Request:**
```json
{
  "productType": "relomatch_report",
  "questionnaireId": "uuid"
}
```

---

### Upload Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload` | Admin | Upload file (multipart) |
| DELETE | `/upload` | Admin | Delete file |

---

### Admin User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/users/:userId` | Admin | Get user details |
| POST | `/admin/users` | Admin | Create user |
| PATCH | `/admin/users/:userId` | Admin | Update user |
| DELETE | `/admin/users/:userId` | Admin | Deactivate user |
| POST | `/admin/users/:userId/restore` | Admin | Restore user |
| GET | `/admin/users/:userId/payments` | Admin | Get user payments |
| GET | `/admin/questionnaires/stats` | Admin | Questionnaire statistics |
| GET | `/admin/questionnaires/outdated` | Admin | Users with outdated questionnaires |
| POST | `/admin/questionnaires/notify-outdated` | Admin | Notify outdated users |

---

## Database Schema

The application uses PostgreSQL via Supabase with Drizzle ORM.

### Entity Relationship Overview

```
┌─────────────────┐
│  user_profiles  │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬───────────────┐
    │         │              │               │
    ▼         ▼              ▼               ▼
┌─────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────┐
│payments │ │questionnaire│ │notifications │ │  (auth)  │
│         │ │_responses   │ │              │ │ Supabase │
└─────────┘ └──────┬──────┘ └──────────────┘ └──────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
┌─────────────────┐ ┌───────────────────┐
│questionnaire    │ │questionnaire      │
│_results         │ │_reports           │
└─────────────────┘ └────────┬──────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │destination_responses│
                    └────────────────────┘

┌───────────┐    ┌────────────┐
│ countries │    │ blog_posts │
└───────────┘    └────────────┘
```

### Tables

#### user_profiles

User profile information linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Links to Supabase Auth user |
| first_name | VARCHAR(100) | Required |
| last_name | VARCHAR(100) | Required |
| id_number | VARCHAR(20) | Israeli ID |
| phone | VARCHAR(20) | Phone number |
| citizenship | VARCHAR(100) | Current citizenship |
| birth_date | TIMESTAMP | Date of birth |
| preferred_language | VARCHAR(10) | Default: 'he' |
| is_active | BOOLEAN | Default: true |
| email_verified | BOOLEAN | Default: false |
| role | ENUM | 'user' or 'admin' |
| onboarding_status | ENUM | 'pending', 'in_progress', 'completed' |
| onboarding_completed_at | TIMESTAMP | When onboarding finished |
| stripe_customer_id | TEXT | Stripe customer reference |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

#### questionnaire_responses

Stores user questionnaire answers with flexible JSONB structure.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | References user_profiles |
| schema_version | INTEGER | Default: 1 (supports V1/V2) |
| responses | JSONB | Flexible answer storage |
| status | ENUM | 'in_progress', 'completed', 'archived' |
| current_step | VARCHAR(50) | Current wizard step |
| needs_update | BOOLEAN | Flag for schema updates |
| last_schema_check | TIMESTAMP | Schema version check |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |
| completed_at | TIMESTAMP | When completed |

**Responses JSONB Structure (V2):**
```json
{
  "countries": ["PT", "ES", "CY"],
  "relocationReason": "work",
  "familyStatus": "married_with_children",
  "personalDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+972501234567",
    "citizenship": "Israeli"
  }
}
```

#### questionnaire_results

Computed recommendations for completed questionnaires.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| questionnaire_id | UUID (FK) | References questionnaire_responses |
| recommendations | JSONB | Array of recommendations with scores |
| generated_at | TIMESTAMP | When generated |

#### countries

Static country catalog with detailed information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| code | VARCHAR(3) | ISO 3166-1 code (unique) |
| name | VARCHAR(100) | Hebrew name |
| english_name | VARCHAR(100) | English name |
| flag_image | VARCHAR(500) | URL to flag |
| hero_image | VARCHAR(500) | URL to banner |
| introduction | TEXT | Country overview |
| categories | JSONB | 14 category fields (visa, safety, etc.) |
| is_active | BOOLEAN | Default: true |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

#### questionnaire_reports

Report header with shared data for a questionnaire.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | References user_profiles |
| questionnaire_id | UUID (FK) | References questionnaire_responses |
| greeting | TEXT | Personalized opening message |
| profile_summary | JSONB | Extracted user profile |
| status | ENUM | 'draft' or 'published' |
| published_at | TIMESTAMP | When published |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

#### destination_responses

Individual destination recommendations within a report.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| report_id | UUID (FK) | References questionnaire_reports |
| display_order | INTEGER | Ordering of destinations |
| destination_name | VARCHAR(200) | e.g., "Portugal" |
| destination_subtitle | VARCHAR(200) | e.g., "Digital Nomad Paradise" |
| destination_image | TEXT | URL to image |
| destination_badge | VARCHAR(100) | e.g., "Recommended" |
| match_score | INTEGER | 0-100 match percentage |
| visa_type | VARCHAR(200) | e.g., "D8 Digital Nomad" |
| match_reasons | JSONB | Why this destination matches |
| narrative | JSONB | Personalized story sections |
| sections | JSONB | Flexible content sections |
| status | ENUM | 'draft' or 'published' |
| published_at | TIMESTAMP | When published |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

#### notifications

User and admin notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | Recipient user |
| type | ENUM | Notification type (see below) |
| title | VARCHAR(200) | Notification title |
| message | TEXT | Notification body |
| related_id | UUID | Links to related entity |
| is_read | BOOLEAN | Default: false |
| created_at | TIMESTAMP | Auto-generated |
| read_at | TIMESTAMP | When read |

**Notification Types:**
- `report_ready` - Report is available
- `country_response_ready` - Destination added
- `questionnaire_completed` - User completed questionnaire
- `questionnaire_updated` - Questionnaire was updated
- `questionnaire_resubmit_required` - Re-submission needed
- `questionnaire_reminder` - Reminder to complete
- `new_questionnaire_submitted` - Admin notification
- `questionnaire_update_completed` - Migration complete
- `system` - System notifications

#### blog_posts

Blog and press articles with localization support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| slug | VARCHAR(255) | URL-friendly identifier (unique) |
| content_type | ENUM | 'blog' or 'press' |
| title | JSONB | LocalizedText {he, en} |
| excerpt | JSONB | LocalizedText |
| content | JSONB | LocalizedText (Markdown) |
| meta_description | JSONB | LocalizedText |
| featured_image_url | TEXT | Image URL |
| featured_image_alt | JSONB | LocalizedText |
| category | ENUM | visa, relocation, lifestyle, etc. |
| tags | JSONB | String array |
| author | VARCHAR(255) | Default: 'Relogate' |
| status | ENUM | 'draft', 'published', 'archived' |
| display_order | INTEGER | Ordering |
| is_featured | BOOLEAN | Featured flag |
| view_count | INTEGER | Analytics |
| published_at | TIMESTAMP | When published |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

#### payments

Stripe payment records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK) | References user_profiles |
| questionnaire_response_id | UUID (FK) | References questionnaire_responses |
| stripe_customer_id | TEXT | Stripe customer |
| stripe_checkout_session_id | TEXT | Stripe session |
| stripe_payment_intent_id | TEXT | Stripe payment intent |
| amount | INTEGER | Amount in agorot |
| currency | TEXT | Default: 'ILS' |
| status | ENUM | pending, completed, failed, etc. |
| product_type | ENUM | 'relomatch_report', 'consultation' |
| product_name | TEXT | Product display name |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |
| paid_at | TIMESTAMP | When paid |
| refunded_at | TIMESTAMP | When refunded |
| metadata | TEXT | JSON for extra data |

---

## Scripts

### Development

```bash
npm run dev           # Start dev server with hot reload (tsx watch)
npm run build         # Build TypeScript to dist/
npm run start         # Run production build
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
```

### Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Vitest UI
```

### Database (Drizzle)

```bash
npm run db:generate   # Generate migrations from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:push       # Push schema directly (dev only)
npm run db:studio     # Open Drizzle Studio GUI
```

### Stripe

```bash
npm run stripe:setup    # Setup Stripe CLI
npm run stripe:webhook  # Start webhook listener
npm run stripe:login    # Login to Stripe
```

### Utilities

```bash
npm run import:articles  # Import articles from DOCX files
```

---

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
| `4000000000003220` | 3D Secure authentication |

Use any future expiry date and any 3-digit CVC.

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `LOG_LEVEL` | Pino log level | `info` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJ...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

### Payment Variables (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |

### Example `.env` File

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# CORS
CORS_ORIGIN=http://localhost:3000

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Security Notes

### Critical Rules

- **NEVER** commit `.env` files
- **NEVER** expose `SUPABASE_SERVICE_KEY` to frontend
- **NEVER** log sensitive data (passwords, tokens, PII)
- **ALWAYS** validate user input with Zod schemas
- **ALWAYS** use parameterized queries (Drizzle handles this)

### Authentication Flow

1. User registers/logs in via Supabase Auth
2. JWT tokens issued by Supabase
3. Backend validates tokens via `authenticate` middleware
4. Role-based access via `authorize` middleware

### Data Protection

- Passwords hashed by Supabase Auth (bcrypt)
- JWT tokens with short expiration
- Row Level Security (RLS) in Supabase
- Input validation on all endpoints

---

## License

UNLICENSED - Private
