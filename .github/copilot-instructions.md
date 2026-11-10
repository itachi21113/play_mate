# Play-Mate Full-Stack Architecture & Copilot Rules

## Tech Stack

- Backend: FastAPI, SQLModel (SQLite `sqlite:///./playmate.db` by default, configurable via `DATABASE_URL`), PyJWT, and `bcrypt` (`import bcrypt` directly, never use `passlib`).
- Frontend: Static HTML + CSS + React + htm (no build step) in `frontend/`[cite: 1].
- Server: FastAPI serves API routes under `/api/*` and WebSockets under `/ws/*`, and mounts `frontend/` at `/` using `StaticFiles(directory="frontend", html=True)` at the very bottom of `backend/main.py`.

## STRICT FRONTEND RULES

1. DO NOT modify any HTML, CSS, or vendor JS files in `frontend/`.
2. Only modify `frontend/js/data.js` (and `frontend/js/forms.js`, `frontend/js/edit-profile.js`, `frontend/js/messages.js` when wiring async API/WebSocket calls).
3. Synchronous React Render Requirement: Components in `components.js`, `tournaments.js`, `profile.js`, and `game-details.js` call `PM.users()`, `PM.currentUser()`, `PM.tournaments()`, `PM.slotsLeft()`, and `PM.isRegistered()` synchronously during render[cite: 1]. Therefore, `frontend/js/data.js` MUST keep an in-memory cache (backed by `localStorage` fallback + `/api/bootstrap` sync on load) and dispatch `window.dispatchEvent(new Event("pmchange"))` whenever an API call mutates data so `PMC.useStore()` triggers a React re-render[cite: 1].

## Exact JSON Contracts Expected by Frontend

- `POST /api/auth/register`: Expects `{ fullName, username, email, phone, password }`[cite: 1]. Returns `{ ok: true, token: "...", user: {...} }` or `{ ok: false, errors: { username?: "...", email?: "...", phone?: "..." } }`[cite: 1].
- `POST /api/auth/login`: Expects `{ ident, password }` (where `ident` matches username OR email case-insensitively)[cite: 1]. Returns `{ ok: true, token: "...", user: {...} }` or `{ ok: false, error: "..." }`[cite: 1].
- `PUT /api/users/me`: Authenticated via `Authorization: Bearer <token>`. Updates `{ fullName, username, email, phone, bio, favGame, avatar }`[cite: 1]. Returns `{ ok: true, user: {...} }` or `{ ok: false, errors: {...} }`[cite: 1].
- `Tournament` JSON shape: `{ id, name, game, date, time, fee, prize, max, taken, unit, status, host, hostUsername, desc }`[cite: 1].
- `POST /api/tournaments/{id}/register`: Authenticated. Checks `status == "upcoming"`, `taken < max`, and prevents duplicate registration[cite: 1]. Returns `{ ok: true, message: "..." }` or `{ ok: false, login?: true, message: "..." }`[cite: 1].
- Role-Based Auth: Users have `role` ("player" | "admin"). Demo user `rahul_gamer` (`demo@playmate.com` / `Demo@123`) has role `"admin"`[cite: 1]. Only `tournament.hostUsername == current_user.username` or `current_user.role == "admin"` can update/delete a tournament.
