# GiantAnimator — Claude Instructions

## Stack
- Node.js/TypeScript server (`server/`) + Remotion 4.0.446 React renderer (`remotion-project/src/`)
- Gemini Vision AI → JSON chart props → Remotion render → MP4/MOV output
- Supabase for job/training history

## Caveman mode
- Terse responses. No intro phrases. No summaries after edits.
- Show results, not process.
- 3–5 words is enough if it covers it.

## Key paths
- `server/index.ts` — main pipeline, render logic, `finishJobRendering()`
- `server/prompts/imageAnalyzer.ts` — Gemini vision prompt
- `remotion-project/src/charts/` — chart components
- `remotion-project/src/theme.ts` — `resolveTheme()`, color palette
- `remotion-project/src/layout/DynamicBackground.tsx` — returns `null` when `backgroundType === 'transparent'`
- `.agent/knowledge/active-vision-rules.md` — AI extraction rules (do not break)
- `.agent/knowledge/error-log.md` — critical bugs log (update when fixing significant bugs)

## Alpha export
- `codec: 'prores'`, `proResProfile: '4444'` (capital R — typo `proresProfile` silently fails)
- `pixelFormat: 'yuva444p10le'`, `imageFormat: 'png'`
- `transparentBackground` is NOT a valid Remotion API — transparency comes from `imageFormat: 'png'`
- Components: `backgroundColor: backgroundType === 'transparent' ? 'rgba(0,0,0,0)' : undefined`

## Auto-update / CI
- `electron/updater.js` — runs on every app open; fetches `version.json` from GitHub master, compares with local, downloads `zipUrl`, extracts with `Expand-Archive`, relaunches
- `.github/workflows/release.yml` — triggers on push to `server/**` or `electron/**` (NOT `version.json` or `scripts/**`)
- Workflow: bumps patch from latest GitHub Release tag → creates release → updates `version.json` → commits `[skip ci]`
- Anti-loop: `[skip ci]` in version bump commit + `paths-ignore: version.json` in trigger
- `scripts/auto-commit.ps1` — syncs static files to packaged app then git add/commit/push (Task Scheduler, every 5 min)
- Packaged app path: `GiantAnimator-win-x64/resources/app/` — completely separate from git repo; static files must be synced manually or via auto-commit script
- **If workflow fails with "release already exists"**: version.json likely still points to previous version — manually update version.json to match the existing release and push

## Rules
- Never invent label names ("Série 1", "Item 1") — extraction fail
- `seriesColors` only (never `colors` as root alias)
- Stacked HBar: extract individual segment width, not cumulative position; use `xMax` not `yMax`
- ProRes profile: `proResProfile` with capital R
