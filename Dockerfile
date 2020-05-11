FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY ./src ./src

EXPOSE 3000
CMD [ "npm", "start" ]