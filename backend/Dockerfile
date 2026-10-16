FROM node:22.23.3-alpine3.24 AS deps
WORKDIR /app/backend
ENV DATABASE_URL=postgresql://ci_user:ci_password@localhost:5432/ci_validation?schema=public
RUN apk upgrade --no-cache
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx prisma generate && npm run build

FROM node:22.23.3-alpine3.24 AS runner
WORKDIR /app/backend
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production
ENV APP_PORT=4000
COPY --from=deps --chown=node:node /app/backend .
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/auth/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
EXPOSE 4000
CMD ["node", "dist/main.js"]
