FROM node:25.9.0-alpine AS base

FROM base AS ci-dependencies
WORKDIR /app

COPY .husky ./ci-deps/.husky
COPY .npmrc ./ci-deps
COPY package*.json ./ci-deps

FROM ci-dependencies AS node-dependencies
WORKDIR /app
COPY --from=ci-dependencies /app/ci-deps ./

RUN npm ci --omit=dev --strict-peer-deps=true

FROM node-dependencies AS build-dependencies
WORKDIR /app
COPY --from=ci-dependencies /app/ci-deps ./
COPY --from=node-dependencies /app/node_modules ./node_modules

RUN npm ci --strict-peer-deps=true

FROM build-dependencies AS build
WORKDIR /app
COPY --from=build-dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build:production

FROM base AS node
WORKDIR /app
LABEL org.opencontainers.image.title="Botge" \
  org.opencontainers.image.version="2.9.0" \
  org.opencontainers.image.description="Search emotes, clips, use zero-width emotes and other such commands." \
  org.opencontainers.image.source="https://github.com/Mrewy/Botge" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.authors="Mrewy" \
  org.opencontainers.image.documentation="https://github.com/Mrewy/Botge/tree/main/docs"

RUN apk add --no-cache ffmpeg
COPY --from=node-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY docs ./docs
COPY LICENSE.txt README.md ./

USER node

VOLUME ["/app/data", "/app/tmp"]

CMD ["node", "dist/index.js"]
