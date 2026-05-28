# SprintOS Security Measures

## Authentication
- **JWT Authentication**: Full JSON Web Token authentication system. Access tokens expire in 15 minutes, and refresh tokens expire in 7 days.
- **Refresh Tokens & Rotation**: Refresh tokens are stored in the database as SHA-256 hashes. Upon renewal, the refresh token is rotated. If a compromised refresh token is reused, all user sessions are immediately revoked (token abuse detection).
- **Secure Cookies**: Both tokens are delivered and managed via secure, HTTP-only, `sameSite: "strict"` cookies. The frontend cannot access tokens via JavaScript, mitigating XSS extraction threats.

## Authorization
- **Role-Based Access Control (RBAC)**: Fine-grained middlewares (`requireAuth`, `requireRole`, `requirePermission`) restrict actions by user role:
  - `ADMIN`: Full organizational audit, monitoring, and management.
  - `PRODUCT_MANAGER`: Sprint, task, and team management permissions.
  - `DEVELOPER`: Task management within assigned bounds.
  - `MARKETING`: Campaign task handling.
- **Route Guards**: Frontend React router utilizes `ProtectedRoute` and `RoleProtectedRoute` to restrict view access by active session and allowed roles.

## Password Security
- **Bcrypt Hashing**: Password storage is secured using `bcryptjs` salting and hashing. Plaintext passwords are never logged, stored, or exposed.
- **Complexity Enforcement**: Password complexity rules require a minimum of 8 characters, containing at least one uppercase letter, one lowercase letter, one digit, and one special character. Applied to seed scripts and member onboarding.

## API Protection
- **Rate Limiting**: Configured `express-rate-limit` to guard endpoints.
  - Login/Auth Refresh APIs: Maximum of 5 requests per 15 minutes.
  - General API requests: Maximum of 100 requests per 15 minutes.
- **Zod Schema Validation**: Request payloads (`req.body`, `req.params`, `req.query`) are validated against strict Zod schemas for login, onboarding, task creation, comment addition, and blocker resolution before executing controller logic.
- **Helmet**: Express app is hardened with the `helmet` package to prevent security vulnerabilities.

## Session Security
- **Session Tracking**: Sessions are tracked in the `UserSession` table, linking device metadata (OS and Browser parsed from User-Agent) and request IP address.
- **Inactivity Timeout**: An inactivity watcher monitors mouse, keyboard, and visibility activities on the client. Shows a warning dialog at 25 minutes of inactivity, and performs an automatic secure logout at 30 minutes of inactivity, revoking the session.

## Monitoring
- **Audit Logs**: Sensitives changes (member creation, sprint modifications, task deletions, blocker resolution) are tracked via `SecurityAuditLog`.
- **Login History**: Tracks login success, failed attempts, and locks accounts temporarily if brute-forced.
- **Suspicious Login Detection**: Audits logins from new IP addresses, logins from unknown devices, and excessive failed login limits.

## Security Headers
- **Content Security Policy (CSP)**: Restricts scripts, styles, images, and fonts to trusted domains and local servers.
- **HSTS**: Enforces HTTPS connections globally with preloading.
- **Frameguard**: Prevents clickjacking by denying iframe rendering.
- **MIME Sniffing**: Blocks MIME type sniffing attacks.
