# Agent Guide

Read this first before changing the project. Keep command output compact and inspect only the files needed for the current task.

## Project

This is a digital wedding invitation app in Indonesian.

- `frontend/` contains the public invitation page, admin panel, styles, modules, and static assets.
- `api/` contains Vercel serverless handlers for share metadata and Google Drive music proxying.
- `backend-gas/Code.gs` contains the Google Apps Script backend for RSVP, guests, config, Drive uploads, and admin actions.
- `vercel.json` routes `/` to `/api/share` and redirects `/admin` to `frontend/admin.html`.
- `undangan digital.zip` is a large untracked archive. Ignore it unless the user explicitly asks about it.

## Runtime Model

- Public page: `frontend/index.html` loads `frontend/config.js` and `frontend/script.js`.
- Admin page: `frontend/admin.html` loads `frontend/admin.js` plus modules under `frontend/js/admin/`.
- Shared frontend logic lives under `frontend/js/shared/`.
- Backend state lives in Google Sheets through Apps Script sheets named `RSVP`, `Guests`, and `Config`.
- Server-side share previews and music proxying run on Vercel functions in `api/`.

## Important Files

- `frontend/config.js`: local API URL, admin base URL, and fallback `WEDDING_CONFIG`.
- `frontend/script.js`: public page orchestration, countdown, RSVP submit, wishes, gallery, gift, music, invite gate.
- `frontend/admin.js`: admin form state, preview, uploads, guest/RSVP actions, drafts, gallery/gift/music editors.
- `frontend/js/shared/config-normalizer.js`: config merge/default healing for frontend.
- `frontend/js/shared/schema/*.js`: gallery, gift, and music normalization.
- `frontend/js/public/*.js`: focused public runtimes for config fetch/cache, gallery, and music.
- `frontend/js/admin/*.js`: focused admin helpers for API calls, guests, RSVP, navigation, and UI status/toasts.
- `api/share.js`: dynamic HTML share page with Open Graph/Twitter metadata.
- `api/music.js`: music proxy for playable Google Drive audio URLs.
- `backend-gas/Code.gs`: Apps Script API. Keep ES syntax compatible with Apps Script.

## Safe Workflow

1. Run `powershell -ExecutionPolicy Bypass -File tools/ai-snapshot.ps1` for a compact project snapshot.
2. Read this file, then only the specific source files relevant to the task.
3. Prefer existing modules and schemas before adding new abstractions.
4. Keep frontend changes plain browser JavaScript, HTML, and CSS unless the user asks to introduce a build system.
5. Keep Apps Script changes self-contained in `backend-gas/Code.gs`; avoid Node-only APIs there.
6. Do not dump full large files into context. Use targeted `Select-String`, line ranges, or the snapshot script.
7. Preserve Indonesian UI copy unless the user asks for another language.

## Validation

There is no package manifest or automated test command in this repo right now.

Use lightweight checks:

- Open `frontend/index.html` and `frontend/admin.html` in a browser for static UI changes.
- For Vercel handlers, deploy/run through Vercel if the user has that environment available.
- For Apps Script changes, paste/deploy `backend-gas/Code.gs` in Apps Script and test `doGet`/`doPost` flows.
- Check for accidental syntax issues with focused reading because no bundler/test runner currently catches them.

## Deployment Notes

- `frontend/config.js` currently points to a deployed Apps Script URL.
- Apps Script admin auth must use Script Properties (`ADMIN_KEY`) rather than hardcoding secrets.
- Optional Drive uploads can use Script Properties (`DRIVE_FOLDER_ID`).
- GitHub Pages can serve `frontend/`; Vercel is used when dynamic share metadata or `/api/music` proxy is needed.

## Roadmaps

- Multi-client planning lives in `docs/MULTI_CLIENT_PLAN.md`.
- Backend Apps Script (`backend-gas/Code.gs`) and local Codex skill files are managed locally/manual-first and should not be pushed unless the user explicitly asks.
