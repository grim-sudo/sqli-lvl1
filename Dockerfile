# ── Stage 1: Build Vite frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Builds into /build/frontend/dist (vite.config outDir: 'dist')
RUN npm run build

# ── Stage 2: Production API server ───────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL description="MeridianHR — SQL Injection Training Lab 1 (Easy)"

# Native build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/server.js   ./
COPY backend/setup-db.js ./

# Copy compiled frontend assets → served as static files by Express
COPY --from=frontend-build /build/frontend/dist ./public

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=80 \
    DB_PATH=/app/data/meridianhr.db \
    STATIC_DIR=/app/public \
    NODE_ENV=production \
    FLAG=MCG{placeholder_flag_not_set}

VOLUME ["/app/data"]
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
