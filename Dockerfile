# syntax = docker/dockerfile:1

ARG NODE_VERSION=18.16.0
FROM node:${NODE_VERSION}-slim as base

LABEL andasy_launch_runtime="NodeJS"

WORKDIR /app
ENV NODE_ENV=production


# Build stage
FROM base as build

RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential 

# ✅ FIXED HERE
COPY --link package.json package-lock.json ./
RUN npm install

COPY --link . .
RUN npm run build
RUN npm prune --production


# Final stage
FROM base
COPY --from=build /app /app

EXPOSE 9000
CMD ["npm", "run", "start"]