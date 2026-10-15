FROM node:22.23.3-alpine3.24 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.23.3-alpine3.24 AS runner
WORKDIR /app
RUN mkdir -p /tmp/npm-clean \
    && npm pack --silent --pack-destination /tmp/npm-clean npm@11.18.0 >/dev/null \
    && tar -xzf /tmp/npm-clean/npm-11.18.0.tgz -C /tmp/npm-clean \
    && test "$(node -p "require('/tmp/npm-clean/package/node_modules/tar/package.json').version")" = "7.5.19" \
    && rm -rf /usr/local/lib/node_modules/npm \
    && mv /tmp/npm-clean/package /usr/local/lib/node_modules/npm \
    && rm -rf /tmp/npm-clean \
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
