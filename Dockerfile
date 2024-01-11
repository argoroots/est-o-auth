FROM node:20-alpine
WORKDIR /usr/src/est-o-auth
COPY ./package*.json ./
RUN npm ci --silent
COPY ./ ./
RUN npm run build
CMD npm run start
