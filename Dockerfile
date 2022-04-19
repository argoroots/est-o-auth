FROM node:16-alpine AS build-web
WORKDIR /usr/src/est-o-auth/web
COPY ./web/package*.json ./
RUN npm ci --silent
COPY ./web ./
RUN npm run build

FROM node:16-alpine AS serve-api
WORKDIR /usr/src/est-o-auth/api
COPY ./api/package*.json ./
RUN npm ci --silent --production
COPY ./api ./
COPY --from=build-web /usr/src/est-o-auth/web/dist ./public
CMD npm run start
