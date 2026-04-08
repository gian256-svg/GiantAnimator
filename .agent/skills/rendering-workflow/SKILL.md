---
name: rendering-workflow
description: Como funciona o pipeline de renderização do GiantAnimator. Usar quando trabalhar com render.ts, componentes Remotion, novos tipos de gráfico ou problemas de processamento de arquivos.
metadata:
  author: gianluca
  version: "1.0"
---

# Rendering Workflow

## Pipeline Completo
Imagem no input/ ↓ chokidar detecta (+ fs.watch + polling como fallback) ↓ addToQueue() — verifica extensão, evita duplicatas ↓ waitFileStable() — aguarda arquivo parar de crescer (500ms interval) ↓ renderFromImage() — chama Remotion bundler + renderer ↓ Vídeo .mp4 em shared/output/ ↓ Imagem movida para shared/processed/

## Extensões Suportadas
`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.gif`, `.tiff`

## Regras do Remotion
- Cada tipo de gráfico = um componente separado em `remotion-project/src/`
- Props sempre tipadas com TypeScript interfaces
- Nunca alterar `remotion.config.ts` sem confirmar
- Paleta de cores e fontes centralizadas em tema

## Problemas Conhecidos e Soluções
Ver `.agent/knowledge/known-issues.md`
