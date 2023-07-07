FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --only=production
COPY . .
CMD [ "npm", "run", "deploy" ]