# AI Workflow

This project now has a compact context workflow inspired by the screenshot.

## Start Every Session

1. Read `AGENTS.md`.
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/ai-snapshot.ps1
```

3. Decide the smallest source area to inspect:

- Public invitation: `frontend/index.html`, `frontend/script.js`, `frontend/js/public/`, `frontend/js/shared/`, `frontend/style.css`
- Admin panel: `frontend/admin.html`, `frontend/admin.js`, `frontend/js/admin/`, `frontend/admin.css`
- Apps Script backend: `backend-gas/Code.gs`
- Vercel handlers: `api/share.js`, `api/music.js`, `vercel.json`
- Data schema: `frontend/js/shared/schema/`, `frontend/js/shared/config-normalizer.js`, `backend-gas/Code.gs`

## Token-Saving Rules

- Use the snapshot script before reading large files.
- Use targeted searches for functions and IDs instead of opening all of `script.js`, `admin.js`, or `Code.gs`.
- Avoid reading static assets, generated archives, and SVG logo catalogs unless the task is about those assets.
- Summarize what changed in `AGENTS.md` when architecture, deploy steps, or file ownership changes.
- If adding a new recurring workflow, add it to the repo-local skill at `.codex/skills/wedding-invitation-workflow/SKILL.md`.

## Local Skill

The repo includes a local skill:

```text
.codex/skills/wedding-invitation-workflow/SKILL.md
```

Use it for future tasks about this project. It tells the agent to start from compact context, preserve the existing no-build static architecture, and validate according to the current repo constraints.

## Technology Notes

- Keep the frontend dependency-free unless there is a clear reason to add a build system.
- Keep Google Apps Script logic compatible with Apps Script services such as `SpreadsheetApp`, `DriveApp`, `PropertiesService`, `Utilities`, and `ContentService`.
- Keep Vercel handlers focused on server-only concerns: share metadata and audio proxying.
- If a new library is proposed, document why it is worth the extra setup cost and how it affects GitHub Pages/Vercel deployment.

