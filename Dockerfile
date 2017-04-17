FROM alpine:edge

# Install libvips
RUN apk add --update git nodejs nodejs-npm python

# Install some global utility tools
RUN npm config set production; npm install -g forever

# Bundle app source
COPY . /data

# Install app dependencies
RUN cd /data && \
    npm install --no-optional && \
    npm dedupe

# Define working directory.
WORKDIR /data

# Define default command.
CMD ["forever", "build/boot.js"]
