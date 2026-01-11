# Security Rules

## Input Validation
- ALWAYS validate all user input with Zod
- Sanitize strings where appropriate
- Validate file uploads (type, size)
- Never trust client-side validation alone

## Authentication
- Use Supabase Auth for authentication
- Validate JWT tokens in middleware
- Check token expiration
- Use secure, httpOnly cookies for sessions

## Authorization
- Implement Supabase Row Level Security (RLS)
- Check user permissions in service layer
- Never expose data from other users

## Data Protection
- NEVER log passwords, tokens, or PII
- Redact sensitive fields in Pino logger config
- Use environment variables for secrets
- Never commit `.env` files

## HTTP Security
- Use Helmet middleware for security headers
- Enable CORS only for trusted origins
- Use rate limiting on sensitive endpoints
- Set secure cookie options in production

## SQL Injection Prevention
- Always use Supabase client (parameterized queries)
- Never concatenate user input into queries

## OWASP Top 10 Awareness
- XSS: Sanitize output (frontend concern mostly)
- CSRF: Use SameSite cookies, verify origin
- Injection: Parameterized queries only
- Broken Auth: Proper session management
- Sensitive Data: Encrypt at rest and in transit
