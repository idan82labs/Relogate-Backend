# API Design Rules

## RESTful Conventions
- Use nouns for resources: `/users`, `/questionnaires`
- Use HTTP methods correctly:
  - GET: Read (no body)
  - POST: Create
  - PUT: Full update
  - PATCH: Partial update
  - DELETE: Remove
- Use plural nouns: `/users` not `/user`

## Route Structure
```
GET    /api/v1/resource         # List
POST   /api/v1/resource         # Create
GET    /api/v1/resource/:id     # Get one
PUT    /api/v1/resource/:id     # Replace
PATCH  /api/v1/resource/:id     # Update
DELETE /api/v1/resource/:id     # Delete
```

## Response Format
Always return consistent JSON:
```typescript
// Success
{ success: true, data: T }

// Success with pagination
{ success: true, data: T[], pagination: { page, limit, total } }

// Error
{ success: false, error: string, code?: string }
```

## Status Codes
- 200: Success
- 201: Created
- 204: No Content (successful DELETE)
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Versioning
- Prefix all routes with `/api/v1/`
- Increment version for breaking changes

## Validation
- Validate all input at route level using Zod middleware
- Return 400 with field-level errors for validation failures

## Current API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Health | `/api/v1/health` | API health check |
| Auth | `/api/v1/auth` | Authentication (register, login, etc.) |
| Questionnaire | `/api/v1/questionnaire` | User questionnaire CRUD |
| Countries | `/api/v1/countries` | Country catalog (public) |
| Reports | `/api/v1/reports` | User reports |
| Notifications | `/api/v1/notifications` | User notifications |
| Blog | `/api/v1/blog` | Blog posts (public) |
| Press | `/api/v1/press` | Press articles (public) |
| Payments | `/api/v1/payments` | Stripe payment integration |
| Upload | `/api/v1/upload` | File uploads (admin) |
| Admin | `/api/v1/admin/*` | Admin management |

See `README.md` for complete endpoint documentation.
