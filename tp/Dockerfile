FROM node:7
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . /app
EXPOSE 4004
CMD [ "node", "index.js" ]