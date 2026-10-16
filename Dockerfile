FROM node:22.23.3-alpine3.24 AS deps
WORKDIR /app
RUN apk upgrade --no-cache
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.23.3-alpine3.24 AS runner
WORKDIR /app
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=deps --chown=node:node /app/.next/standalone ./
COPY --from=deps --chown=node:node /app/.next/static ./.next/static
COPY --from=deps --chown=node:node /app/public ./public
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
EXPOSE 3000
CMD ["node", "server.js"]
