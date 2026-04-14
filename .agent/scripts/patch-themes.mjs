/**
 * patch-themes-v2.mjs
 * 
 * Versão 2 - mais agressiva: substitui TODOS os Theme.chartColors e 
 * Theme.colors.background restantes, adicionando prop theme e resolveTheme
 * onde necessário.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const SRC = 'remotion-project/src';
const SKIP = ['.bak.tsx', '.preview.tsx'];

let patched = 0, skipped = 0;

function shouldSkip(filePath) {
  const base = basename(filePath);
  if (SKIP.some(s => base.endsWith(s))) return true;
  const src = readFileSync(filePath, 'utf8');
  if (src.length < 250) return true; // stub
  return false;
}

function patchFile(filePath) {
  if (shouldSkip(filePath)) {
    console.log(`  ⏭  Skipping: ${basename(filePath)}`);
    skipped++;
    return;
  }

  let src = readFileSync(filePath, 'utf8');
  const original = src;

  // ── 1. Ensure resolveTheme is imported ──────────────────────────────────────
  if (!src.includes('resolveTheme')) {
    src = src
      .replace(/import \{ Theme \} from ['"]\.\.\/theme['"]/g,
        `import { Theme, resolveTheme } from '../theme'`)
      .replace(/import \{ Theme \} from ['"]\.\/theme['"]/g,
        `import { Theme, resolveTheme } from './theme'`)
      .replace(/import \{ Theme, THEME \} from ['"]\.\.\/theme['"]/g,
        `import { Theme, THEME, resolveTheme } from '../theme'`);
  }

  // ── 2. Ensure `theme` prop exists in the component interface ────────────────
  // Add theme?: string to interface if not present
  if (!src.includes("theme?: string") && !src.includes("theme: string")) {
    // Try to add to the props interface (after last prop)
    src = src.replace(
      /(interface \w+Props \{[^}]*)(})/,
      (match, body, closing) => {
        if (body.includes('theme')) return match;
        return body + `  theme?: string;\n  backgroundColor?: string;\n  colors?: string[];\n  textColor?: string;\n` + closing;
      }
    );
  }

  // ── 3. Ensure `theme` is destructured in the component function ─────────────
  if (!src.includes('theme =') && !src.includes("theme,")) {
    // Add theme destructuring - look for common patterns at start of component
    src = src.replace(
      /\(\{\s*\n([\s\S]*?)(backgroundColor[^=]*=\s*Theme\.colors\.background)/,
      (match, before, bgLine) => {
        return `({\n` + before + `  theme = 'dark',\n  ` + bgLine;
      }
    );
    // Simpler fallback: add theme near other destructuring
    if (!src.includes('theme =')) {
      src = src.replace(
        /\(\{(\s*\n\s*data\s*[=,])/,
        `({\n  theme = 'dark',$1`
      );
    }
  }

  // ── 4. Inject `const T = resolveTheme(theme ?? 'dark')` after useCurrentFrame ──
  if (!src.includes('const T = resolveTheme')) {
    // Try after useVideoConfig
    const injected = src.replace(
      /(const \{ width, height(?:, fps)? \} = useVideoConfig\(\);)/,
      `$1\n  const T = resolveTheme(theme ?? 'dark');`
    );
    if (injected !== src) {
      src = injected;
    } else {
      // Try after useCurrentFrame
      const injected2 = src.replace(
        /(const frame = useCurrentFrame\(\);)/,
        `$1\n  const T = resolveTheme(theme ?? 'dark');`
      );
      if (injected2 !== src) {
        src = injected2;
      } else {
        // For components without hooks, inject at top of function body
        src = src.replace(
          /(export const \w+ = \(.*?\) => \{)/,
          `$1\n  const T = resolveTheme(theme ?? 'dark');`
        );
        // Try arrow function with props destruction
        src = src.replace(
          /(export const \w+: React\.FC<\w+> = \(\{[\s\S]*?\}\) => \{)/,
          (match) => {
            if (match.includes('resolveTheme')) return match;
            return match + '\n  const T = resolveTheme(theme ?? \'dark\');';
          }
        );
      }
    }
  }

  // ── 5. Replace ALL Theme.chartColors references with T.colors ────────────────
  src = src.replace(/Theme\.chartColors\[/g, 'T.colors[');
  src = src.replace(/Theme\.chartColors\.length/g, 'T.colors.length');
  // Handle Theme.chartColors[0] direct
  src = src.replace(/Theme\.chartColors\[0\]/g, 'T.colors[0]');

  // ── 6. Replace Theme.colors.background with T.background ──────────────────
  src = src.replace(/Theme\.colors\.background/g, 'T.background');

  // ── 7. Replace Theme.colors.text (non-Muted, non-Secondary) ─────────────────
  src = src.replace(/Theme\.colors\.textSecondary/g, 'T.textMuted');
  src = src.replace(/Theme\.colors\.textMuted/g, 'T.textMuted');
  src = src.replace(/Theme\.colors\.text\b(?!ured|Muted|Secondary|Color)/g, 'T.text');

  // ── 8. Replace Theme.colors.grid ────────────────────────────────────────────
  src = src.replace(/Theme\.colors\.grid/g, 'T.grid');

  // ── 9. Replace backgroundColor = Theme.colors.background (prop default) ──────
  // Already replaced in step 6, but handle the prop default pattern specially
  src = src.replace(
    /backgroundColor = T\.background,/g,
    `backgroundColor,`
  );

  // ── 10. Ensure backgroundColor fallback in JSX ────────────────────────────────
  // Where backgroundColor is used as JSX prop: {{ backgroundColor }} --> {{ backgroundColor: backgroundColor ?? T.background }}
  // Only where it's used bare (not already with T.background)
  if (src.includes('backgroundColor ?? T.background') || src.includes('backgroundColor: T.background')) {
    // already handled
  } else if (src.includes('backgroundColor,') && !src.includes('backgroundColor =')) {
    // There are bare usages - replace in style objects
    src = src.replace(
      /\{\{ backgroundColor(?!\s*[?:=])/g,
      '{{ backgroundColor: backgroundColor ?? T.background'
    );
    src = src.replace(
      /backgroundColor: backgroundColor(?!\s*\?\?)/g,
      'backgroundColor: backgroundColor ?? T.background'
    );
  }

  if (src !== original) {
    writeFileSync(filePath, src, 'utf8');
    console.log(`  ✅ Patched: ${basename(filePath)}`);
    patched++;
  } else {
    console.log(`  ℹ️  Clean: ${basename(filePath)}`);
    skipped++;
  }
}

function walkDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'previews') {
        walkDir(full);
      }
    } else if ((extname(full) === '.tsx' || extname(full) === '.ts') && !full.includes('theme.ts')) {
      patchFile(full);
    }
  }
}

console.log('🎨 GiantAnimator — Theme Patch v2 (Full Coverage)\n');
walkDir(SRC);
console.log(`\n✨ Done! Patched: ${patched} | Skipped/Clean: ${skipped}`);
