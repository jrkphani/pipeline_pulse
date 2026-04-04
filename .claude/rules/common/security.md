# Security Rules — Pipeline Pulse

## Non-Negotiable Rules

These are blockers in code review:

1. **JWT in httpOnly cookies only** — never localStorage, sessionStorage, or JS-accessible storage
2. **No hardcoded secrets** — all credentials via environment variables
3. **No AG Grid Enterprise** — Community Edition only (prevents license key exposure)
4. **All API routes authenticated** — except `/auth/login`, `/auth/refresh`, `/health`
5. **Input validation on all mutations** — Pydantic schemas on every POST/PUT/PATCH
6. **No wildcard CORS in production** — explicit `allowed_origins` list

## Token Management

```python
# Correct: httpOnly cookie
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,       # HTTPS only
    samesite="lax",
    max_age=900,       # 15 minutes
)
```

```typescript
// Correct: credentials: 'include' for cookie-based auth
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // sends cookies automatically
});
```

## Singapore PDPA Compliance

Pipeline data contains PII (contact names, emails, company data):
- Never log full opportunity records
- Contact emails masked in logs: `j***@company.com`
- Audit trail for data access (temporal snapshots serve this purpose)
- Data retention: follow 1CloudHub policy

## Secrets Scanning

Before any commit, verify no secrets in:
- Source code
- Test fixtures
- `.env.example` files (use placeholder values only)
- Comments and documentation

Pattern to grep:
```bash
grep -rE "(api_key|secret|password|token)\s*=\s*['\"][^'\"]{8,}" --include="*.py" --include="*.ts" --include="*.tsx" .
```

## Dependency Security

- Run `pip audit` and `npm audit` before releases
- Pin major versions in requirements
- No packages from unknown sources
