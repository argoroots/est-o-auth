FROM node:18-alpine
WORKDIR /usr/src/est-o-auth
COPY ./package*.json ./
RUN npm ci --silent
COPY ./ ./
CMD npm run build
