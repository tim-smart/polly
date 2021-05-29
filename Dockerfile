FROM node:14-alpine AS deps-build
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false


FROM node:14-alpine AS deps
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production


FROM node:14-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps-build /app/node_modules ./node_modules
RUN yarn build


FROM node:14-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

CMD ["node", "dist/main.js"]
