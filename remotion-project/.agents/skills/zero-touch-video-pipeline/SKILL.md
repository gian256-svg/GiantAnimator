---
name: zero-touch-video-pipeline
description: A complete SOP for zero-touch multicam syncing, cutting, Auphonic processing, and stylish Remotion captioning.
---

# Zero-Touch Video Editing Pipeline

When the user asks to process a new video (or multiple camera angles) in the "zero-touch" style, execute this SOP.

## Standard Operating Procedure (SOP)

### 1. Project Preparation
1. Verify the user has provided the input video file(s). If it's a multicam setup, ensure you have Cam A and Cam B. If only one video is provided, the pipeline can still process it (though multicam cuts will just cut to the same camera, effectively acting as a jump-cut remover).
2. Ensure the required tools are installed on the user's system: `ffmpeg` and `uvx` (for `openai-whisper`). Run `ffmpeg -version` to verify.
3. Ensure `.env` has `AUPHONIC_API_KEY`. If not, ask the user or warn them that the Auphonic enhancement step will be skipped.
4. Set up the Remotion environment for the subtitles:
   - Ensure `@remotion/google-fonts` is installed (`npm i @remotion/google-fonts`).
   - Copy `.agents/skills/zero-touch-video-pipeline/examples/CaptionEngine.tsx` into the project's `src/` folder.
   - Register `CaptionEngine` inside the project's `Root.tsx` with a dynamic `calculateMetadata` block that uses the timestamp `props` to dictate duration length.

### 2. Pipeline Execution
1. The core zero-touch logic resides in `.agents/skills/zero-touch-video-pipeline/scripts/multicam_pipeline.mjs`.
2. In the terminal, execute the script via Node.js parsing the two cameras:
   ```bash
   node .agents/skills/zero-touch-video-pipeline/scripts/multicam_pipeline.mjs "src/videos/CamA.mov" "src/videos/CamB.mov"
   ```
3. The pipeline will autonomously:
   - Extract raw audio for AI analysis
   - Transcribe the audio precisely via Whisper (`tiny` model with word-level JSON timestamps)
   - Identify the "clean take" sequence (trimming pre-recording chatter and false starts)
   - Analytically bounce between Cam A and Cam B on pauses > 4 seconds
   - Request the Auphonic API for broadcast-grade Audio (16 LUFS, Semantic Denoising)
   - Dump aligned `captions.json` timestamps mathematically synced to the cuts
   - Generate a heavily compressed proxy in `public/`
   - Automatically trigger `<Series>` `npx remotion render CaptionEngine output.mp4 --codec h264` saving the captioned masterpiece directly directly to the user's Desktop.

### 3. Caption Engine Style Specifications (Auto-Injected)
The `CaptionEngine.tsx` has been rigorously and strictly configured to use:
- Font: Inter (via `@remotion/google-fonts`)
- Word chunking: Exactly 4 words per frame section.
- Highlighting: Neon Green `#BFF549` glowing (`0 0 40px rgba(...)`) and scaled by `1.1`.
- Past wording: `#FFFFFF`. Future wording: `rgba(255,255,255,0.5)`.
- Semantic Cleanup: Javascript Regex logic strictly removes trailing punctuation `. , ! ?` to keep visual blocks neat while natively retaining semantic contractions (e.g. `don't`).
- Gradient Backdrop: A bottom 40% `rgba(0,0,0,0.85)` gradient for pristine contrast matching `paddingBottom: 120px`.

Never alter this visual style or script execution unless explicitly requested by the user. The prime directive of this skill is total broadcast-grade consistency and zero human involvement.
