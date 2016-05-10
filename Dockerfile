FROM node:4-slim

COPY . /eventwitter
RUN cd /eventwitter && npm install

WORKDIR /eventwitter
ENTRYPOINT ["node", "index.js"]



