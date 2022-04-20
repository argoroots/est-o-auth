FROM node:16-alpine
WORKDIR /usr/src/est-o-auth
COPY ./package*.json ./
RUN npm ci --silent --production
COPY ./ ./
CMD npm run start
