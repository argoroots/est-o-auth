FROM node:16-alpine
WORKDIR /usr/src/est-o-auth
ADD ./ ./
RUN npm ci --silent --production
CMD npm start
