FROM node:16.18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk --no-cache add curl

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

CMD npm run start
