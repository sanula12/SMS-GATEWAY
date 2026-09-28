FROM node:22-alpine
WORKDIR /app

# Copy the Frontend package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all the source code
COPY . .

# Build the Next.js Frontend
RUN npm run build

# Open the port and Start!
EXPOSE 3000
CMD ["npm", "run", "start"]
