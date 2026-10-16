FROM node:24.16.0-bookworm-slim@sha256:2c87ef9bd3c6a3bd4b472b4bec2ce9d16354b0c574f736c476489d09f560a203 AS build
ENV PUPPETEER_SKIP_DOWNLOAD=true NODE_CHROMIUM_SKIP_INSTALL=true NODE_OPTIONS=--max-old-space-size=2048
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean
COPY . .
ENV SITE_URL=https://check.afeiii.com PLATFORM=node ENABLE_ANALYTICS=false PUBLIC_API_TIMEOUT_LIMIT=45000
RUN yarn test:public && yarn lint && yarn build

FROM node:24.16.0-bookworm-slim@sha256:2c87ef9bd3c6a3bd4b472b4bec2ce9d16354b0c574f736c476489d09f560a203
ENV NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true NODE_CHROMIUM_SKIP_INSTALL=true
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends chromium tini ca-certificates fonts-noto-cjk && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --network-timeout 100000 && yarn cache clean
COPY --from=build /app/dist ./dist
COPY api ./api
COPY public ./public
COPY server.js healthcheck.js site-config.json package.json ./
RUN node --input-type=module -e "await import('/app/dist/server/entry.mjs');"
ARG REVISION=unknown
ENV BUILD_REVISION=$REVISION CHROME_PATH=/usr/bin/chromium PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
LABEL org.opencontainers.image.source="https://github.com/bigzhihui/web-check" org.opencontainers.image.licenses="MIT" org.opencontainers.image.revision=$REVISION
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=8s --start-period=30s --retries=3 CMD ["node", "healthcheck.js"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
