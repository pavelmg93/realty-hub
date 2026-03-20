FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 py3-pip postgresql-client

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
