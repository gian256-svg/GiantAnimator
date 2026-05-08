FROM node:20-bookworm

# Chromium (headless render) + FFmpeg (video encoding)
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Wrapper que injeta --disable-dev-shm-usage (evita page crash em containers)
RUN printf '#!/bin/sh\nexec /usr/bin/chromium --disable-dev-shm-usage "$@"\n' \
    > /usr/local/bin/chromium-wrapper && chmod +x /usr/local/bin/chromium-wrapper

# Skip Remotion's own Chromium download — use system one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/local/bin/chromium-wrapper
# CI=true makes Remotion add --no-sandbox automatically (required in Docker)
ENV CI=true
ENV NODE_ENV=production

WORKDIR /app

# Dependencies (cached layer — only re-run when package files change)
COPY package*.json ./
RUN npm ci

COPY remotion-project/package*.json ./remotion-project/
RUN npm ci --prefix remotion-project

# Source
COPY . .

EXPOSE 8080

CMD ["npm", "start"]
