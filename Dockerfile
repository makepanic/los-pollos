FROM node:8-alpine

# Install libvips
RUN apk add --update git python nginx

# Install some global utility tools
RUN yarn global add forever

# see https://github.com/gliderlabs/docker-alpine/issues/185
RUN mkdir -p /run/nginx && \
    mkdir -p /www/data

# copy nginx config
COPY nginx/nginx.conf /etc/nginx/

# Bundle app source
COPY . /data

# Install app dependencies
RUN cd /data && \
    yarn

WORKDIR /data

EXPOSE 80

CMD nginx && forever boot.js
