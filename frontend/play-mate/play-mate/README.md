# Play-Mate (frontend only)

HTML + CSS + React (vendored in `js/vendor/`, no build step, no backend).

Run: open `index.html`, or serve the folder with VS Code Live Server / `python3 -m http.server`.

Demo login: `demo@playmate.com` / `Demo@123` (or register a new account).
All data (accounts, profile edits, tournament registrations, created tournaments, chats) is stored in the browser's localStorage.
To reset the demo, clear this site's localStorage.

Pages: index, players, search, game-details?game=<slug>, tournaments, tournament-details?id=<id>,
messages (login required), profile / profile?u=<username>, edit-profile, login, register.
