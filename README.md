# CPA Client Portal

A client-only web app: sign in with email + a one-time code, view your open
work (everything not marked Done), submit a new request, and upload
documents. Talks directly to Monday.com — no Make.com involved.

This is **not** for CPAs or internal staff — it only exposes a client's own
records, scoped by the email they sign in with.

## How it works

- **Auth**: client enters their email + password → server looks up the
  matching row on the *Client Directory* board by Contact Email → checks
  the password against that row's "Portal Access Code" column → signs a
  session cookie (JWT). No separate database — Monday.com itself is the
  only store. (This started as an email + one-time-code flow via Resend,
  but was switched to a static password for reliable testing with the
  fake demo domains used in this dataset — real email delivery to made-up
  addresses was never going to work. Swap back to a one-time code +
  real email provider before handling real clients.)
- **Open work**: reads the *Task Schedule* board, filtered to items linked
  to this client whose Status isn't "Done".
- **New request**: creates a new item on *Task Schedule*, linked to the
  client, and assigns the next Active CPA using the same rotation-order
  logic used elsewhere in this system (reads the CPA Capacity Register's
  Rotation Order + the Task Rotation Control pointer, same as the Make
  scenario).
- **Document upload**: uploads directly to a file column on the client's
  own Client Directory item.

## Test accounts

Only 30 of the 200 demo clients are wired up for portal login (to avoid
repeatedly touching all 200 records during testing). Each has a **unique**
password. Passwords are stored **hashed** (scrypt, per-password random
salt, timing-safe comparison) in the "Portal Access Code" column — Monday
itself never holds a plaintext password. The plaintext list is only in
your hands (see the credentials table shared separately), never in the
codebase or in Monday.

All 50 demo tasks are linked to these 30 clients, so every test account
has visible open work.

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. In Vercel: **New Project → Import** that repo.
3. Under **Environment Variables**, add both from `.env.example`:
   - `MONDAY_API_TOKEN` — a Monday.com API token for the
     `yu7alss-team-company` account (Admin → API, or Developers → My
     Access Tokens). Keep this secret — never put it in client-side code.
   - `SESSION_SECRET` — any long random string. Generate one with
     `openssl rand -base64 32`.
4. Click **Deploy**.

That's it — no database, no separate backend to stand up.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the four values
npm run dev
```

## Board / column reference

| Board | ID |
|---|---|
| CPA Capacity Register | 5101973727 |
| Client Directory | 5101973728 |
| Task Schedule | 5101973730 |
| Task Rotation Control | 5101983486 |

Column IDs are centralized in `lib/monday.ts` — if a column is renamed or
recreated in Monday (which changes its ID), update the constant there.

## Security notes

- The Monday API token only ever lives server-side (API routes / server
  components). It is never sent to the browser.
- Sessions are signed, httpOnly, secure cookies — not readable or
  forgeable from client-side JS.
- The one-time code is single-use (cleared on successful verification) and
  expires after 10 minutes.
- The "request code" endpoint always responds identically whether or not
  the email matches a client, so the portal never reveals which emails are
  registered.
- Built on Next.js 15.5.9 (patched against the Dec 2025 RSC/middleware
  CVEs). Keep an eye on `nextjs.org/blog` for future security releases and
  upgrade promptly.

## Known limitations (by design, for now)

- A client sees ALL of their linked tasks in one list — no pagination.
  Fine at current volumes; revisit if a single client accumulates
  hundreds of tasks.
- Document uploads go to a single shared "Client Documents" file column,
  not tied to a specific task or request.
- No rate limiting on the code-request endpoint. Low risk at current
  scale, but add one (e.g. Vercel's built-in rate limiting, or Upstash)
  before wider rollout.
