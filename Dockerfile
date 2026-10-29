FROM dhi.io/node:26.12.1-alpine3.24-sfw-dev AS base

FROM base AS ci-dependencies
WORKDIR /app

COPY .husky ./ci-deps/.husky
COPY .npmrc ./ci-deps
COPY package*.json ./ci-deps

FROM ci-dependencies AS node-dependencies
WORKDIR /app
COPY --from=ci-dependencies /app/ci-deps ./

RUN npm ci --omit=dev

FROM node-dependencies AS build-dependencies
WORKDIR /app
COPY --from=ci-dependencies /app/ci-deps ./
COPY --from=node-dependencies /app/node_modules ./node_modules

RUN npm ci

FROM build-dependencies AS build
WORKDIR /app
COPY --from=build-dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build:production

FROM base AS botge
WORKDIR /app
LABEL org.opencontainers.image.authors="Mrewy" \
  org.opencontainers.image.base.digest="sha256:b228ab773f21720bf849f294b9ccfc4dea65b90cfe7f22bd4d5e10c7f48c859e" \
  org.opencontainers.image.base.name="dhi.io/node:26.12.1-alpine3.24-sfw-dev" \
  org.opencontainers.image.description="Search emotes, clips, use zero-width emotes and other such commands." \
  org.opencontainers.image.documentation="https://github.com/MrewyOrg/Botge/tree/main/docs" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.source="https://github.com/MrewyOrg/Botge" \
  org.opencontainers.image.title="Botge" \
  org.opencontainers.image.vendor="MrewyOrg"

RUN apk upgrade --no-cache \
  && apk add --no-cache ffmpeg

COPY --from=node-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY docs ./docs
COPY LICENSE.txt botge*.config.json node.config.json README.md ./

USER node

VOLUME ["/app/data"]

CMD ["node", "--experimental-default-config-file", "--title", "botge", "dist/index.js"]
