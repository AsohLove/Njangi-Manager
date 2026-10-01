FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

RUN npm ci

COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

RUN npx prisma generate --config prisma7.config.ts
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && npm run start:prod"]