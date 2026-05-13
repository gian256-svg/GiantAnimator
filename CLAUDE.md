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

## Rules
- Never invent label names ("Série 1", "Item 1") — extraction fail
- `seriesColors` only (never `colors` as root alias)
- Stacked HBar: extract individual segment width, not cumulative position; use `xMax` not `yMax`
- ProRes profile: `proResProfile` with capital R
