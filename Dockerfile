FROM node:17-slim

RUN apt-get update \
  && apt-get install -y sox libsox-fmt-mp3

WORKDIR /radio

COPY package.json .

RUN yarn

COPY . .

USER node

CMD yarn start-watch