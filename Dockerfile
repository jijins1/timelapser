FROM node:16-alpine

WORKDIR /usr/src/app

## following 3 lines are for installing ffmepg
RUN apk update
RUN apk add
RUN apk add ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci --only=production
# If you are building your code for production

# RUN npm ci --only=production

# Bundle app source
COPY app.js .

CMD [ "node", "app.js" ]
