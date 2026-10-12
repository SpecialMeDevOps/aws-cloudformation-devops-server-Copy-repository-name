FROM node:20-alpine AS deps
WORKDIR /app/backend
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
ENV APP_PORT=4000
COPY --from=deps /app/backend .
EXPOSE 4000
CMD ["node", "dist/main.js"]
