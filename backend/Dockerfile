FROM node:22-alpine AS deps
WORKDIR /app/backend
ENV DATABASE_URL=postgresql://ci_user:ci_password@localhost:5432/ci_validation?schema=public
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
ENV APP_PORT=4000
COPY --from=deps --chown=node:node /app/backend .
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/auth/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
EXPOSE 4000
CMD ["node", "dist/main.js"]
