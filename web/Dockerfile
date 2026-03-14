FROM node:20-alpine

WORKDIR /app

RUN apt-get update && apt-get install -y python3 python3-pip

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

# Run npm install at startup so the node_modules volume gets deps (e.g. lucide-react)
CMD ["sh", "-c", "npm install && npm run dev"]
