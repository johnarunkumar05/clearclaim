# ClearClaim — Insurance Claim Processing System (MERN)

A full-stack MERN application (MongoDB, Express, React, Node.js) that streamlines
insurance claim submission, document verification, multi-stage approval, and
settlement tracking — with a full audit trail on every claim.

## Workflow

```
submitted → under_review → verified → approved → settled
               ↑    ↓ (documents_pending)         ↘ rejected
```

1. **Policyholder** files a claim and uploads supporting documents (ID proof,
   policy copy, bills, photos, etc.).
2. **Verifier** picks up the claim, checks each document, and either marks it
   `verified` (forwarded to approval) or `documents_pending` (kicked back to
   the policyholder for more evidence).
3. **Approver** reviews verified claims and either `approves` (with a final
   payout amount) or `rejects` (with a reason).
4. **Finance** initiates a settlement for approved claims and marks it
   `completed` once funds are disbursed, which closes the claim as `settled`.
5. Every transition is appended to the claim's **audit trail** (timeline), so
   anyone with access can see exactly what happened, when, and by whom.

Roles: `policyholder`, `verifier`, `approver`, `finance`, `admin` (admin can
do everything, useful for support/oversight).

## Project structure

```
insurance-claim-system/
  backend/     Express + MongoDB API (JWT auth, role-based access, file uploads)
  frontend/    React app (React Router, Axios, Context-based auth)
```

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

### 1. Backend

```bash
cd backend
cp .env.example .env     # then edit MONGO_URI / JWT_SECRET as needed
npm install
npm run dev               # starts on http://localhost:5000
```

Optional — seed demo accounts for every role (all use password `password123`):

```bash
node seed.js
```

This creates:
| Role         | Email                  |
|--------------|------------------------|
| Policyholder | policyholder@demo.com  |
| Verifier     | verifier@demo.com      |
| Approver     | approver@demo.com      |
| Finance      | finance@demo.com       |
| Admin        | admin@demo.com         |

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # points to http://localhost:5000/api by default
npm install
npm start                  # starts on http://localhost:3000
```

Open http://localhost:3000, log in as `policyholder@demo.com` to file a
claim and upload documents, then switch users (in another browser/incognito
window) to walk it through verification → approval → settlement.

## API overview

| Method | Endpoint                              | Access                | Purpose                          |
|--------|----------------------------------------|------------------------|-----------------------------------|
| POST   | /api/auth/register                    | public                 | Register a policyholder account   |
| POST   | /api/auth/login                       | public                 | Log in, receive JWT               |
| GET    | /api/auth/me                          | authenticated          | Current user profile              |
| POST   | /api/claims                           | policyholder           | Submit a new claim                |
| GET    | /api/claims                           | authenticated          | List claims (role-filtered)       |
| GET    | /api/claims/:id                       | authenticated          | Claim detail + documents          |
| PATCH  | /api/claims/:id/start-review          | verifier, admin        | Move claim into review            |
| PATCH  | /api/claims/:id/verify                | verifier, admin        | Mark verified / documents_pending |
| PATCH  | /api/claims/:id/approve               | approver, admin        | Approve or reject a verified claim|
| GET    | /api/claims/stats/summary             | authenticated          | Dashboard counts                  |
| POST   | /api/documents/:claimId               | owner / staff          | Upload a document (multipart)     |
| GET    | /api/documents/:claimId               | authenticated          | List documents for a claim        |
| GET    | /api/documents/file/:id               | authenticated          | Download a document               |
| PATCH  | /api/documents/:id/verify              | verifier, admin        | Verify/reject a document          |
| POST   | /api/settlements/:claimId              | finance, admin         | Start a settlement for an approved claim |
| PATCH  | /api/settlements/:id/complete          | finance, admin         | Mark settlement completed → claim settled |
| GET    | /api/settlements                       | finance, admin, approver| List settlements                 |

## Notes on security & production readiness

- Passwords are hashed with bcrypt; auth uses JWT bearer tokens.
- Staff roles (verifier/approver/finance/admin) are **not** self-registerable
  via the public endpoint — provision them via `seed.js` or directly in the
  database/an admin tool, to keep the approval chain trustworthy.
- File uploads are restricted by type (PDF/JPG/PNG/DOC/DOCX) and size (10MB).
- This is a learning/reference build: before production use, add rate
  limiting, request validation (e.g. Joi/Zod), HTTPS, virus scanning on
  uploads, and move file storage to S3/Cloud Storage instead of local disk.
