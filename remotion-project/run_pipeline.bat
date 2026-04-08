@echo off
title Zero-Touch Video Rendering Pipeline
color 0A
echo =======================================================
echo     ZERO-TOUCH VIDEO PIPELINE E RENDERIZADOR REMOTION  
echo =======================================================
echo.
echo Preparando variaveis de ambiente...
set PATH=%USERPROFILE%\.local\bin;%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin;%PATH%
echo Iniciando script principal...
echo.

node scripts\multicam_pipeline.mjs src\videos\A001_08302308_C004.mov src\videos\B001_09112131_C002.mov
echo.
echo =======================================================
echo O PROCESSO FOI TOTALMENTE CONCLUIDO!
echo Verifique a exportacao final e os captions na pasta public/ e no seu Desktop.
echo =======================================================
pause
