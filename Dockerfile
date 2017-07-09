FROM node:8-alpine

# Install libvips
RUN apk add --update git python

# Install some global utility tools
RUN yarn global add forever

# Bundle app source
COPY . /data

# Install app dependencies
RUN cd /data && \
    yarn

# Define working directory.
WORKDIR /data

# Define default command.
CMD ["forever", "build/boot.js"]
