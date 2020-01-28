FROM node:10.17.0 as node

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN NODE_ENV=production npm install

# Bundle app source
COPY ./dist /usr/src/app/src
COPY ./src/protoFiles /usr/src/app/src/protoFiles
COPY ./src/swagger.json /usr/src/app/src/swagger.json

# Make the app available on port
EXPOSE 3500
CMD [ "node", "./src/index.compiled.js" ]
