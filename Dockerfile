FROM node:22.23.3-alpine3.24 AS deps
WORKDIR /app
RUN npm install --global npm@11.18.0 \
    && test "$(npm --version)" = "11.18.0" \
    && node -e "if (require('/usr/local/lib/node_modules/npm/node_modules/tar/package.json').version !== '7.5.19') process.exit(1)"
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.23.3-alpine3.24 AS runner
WORKDIR /app
RUN npm install --global npm@11.18.0 \
    && test "$(npm --version)" = "11.18.0" \
    && node -e "if (require('/usr/local/lib/node_modules/npm/node_modules/tar/package.json').version !== '7.5.19') process.exit(1)"
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=deps --chown=node:node /app .
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
EXPOSE 3000
CMD ["npm", "run", "start"]
