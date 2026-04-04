# syntax = docker/dockerfile:1

ARG NODE_VERSION=18.16.0
FROM node:${NODE_VERSION}-slim as base

LABEL andasy_launch_runtime="NodeJS"

WORKDIR /app

ENV NODE_ENV=production

FROM base as build

RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

COPY --link package.json package-lock.json ./
RUN npm install --production=false

COPY --link . .

RUN npm run build

RUN npm prune --production

FROM base

COPY --from=build /app /app

EXPOSE 9000

CMD [ "npm", "run", "start" ]
