FROM node:0.10

RUN cd /tmp && \
    wget --quiet https://github.com/makerslocal/eventwitter/archive/master.tar.gz -O eventwitter.tar.gz && \
    tar -zxf eventwitter.tar.gz && \
    cd eventwitter-master && \
    npm install

WORKDIR /tmp/eventwitter-master
ENTRYPOINT ["node", "index.js"]



