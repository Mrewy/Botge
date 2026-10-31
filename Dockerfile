# check=error=true

FROM dhi.io/node@sha256:457e77bf0857229659361c243dadfef8a67720ec7d0b8d195bb6940cdf4541a3 AS base

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

RUN apk upgrade --no-cache \
  && apk add --no-cache ffmpeg

COPY --from=node-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY docs ./docs
COPY LICENSE.txt botge*.config.json node.config.json README.md ./

USER node

VOLUME ["/app/data"]

CMD ["node", "--experimental-default-config-file", "--title", "botge", "dist/index.js"]
