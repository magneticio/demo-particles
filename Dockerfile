FROM node:10-alpine as base

WORKDIR /app

COPY package.json .

FROM base AS build

RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production

COPY . .

FROM base AS release

ENV NODE_ENV=production

COPY --from=build /app .

EXPOSE 5000
ENTRYPOINT [ "node", "index.js" ]