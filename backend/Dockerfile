FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create directories for database and exports
RUN mkdir -p database exports

EXPOSE 3001

CMD ["node", "src/server.js"]
