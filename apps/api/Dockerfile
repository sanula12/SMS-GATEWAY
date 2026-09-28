FROM node:22-alpine
WORKDIR /app

# Copy the API package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all the source code
COPY . .

# Build the NestJS API
RUN npm run build

# Open the port and Start!
EXPOSE 3001
CMD ["sh", "-c", "npx drizzle-kit push && node dist/src/main.js"]
