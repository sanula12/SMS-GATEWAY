FROM node:22-alpine
WORKDIR /app

# Copy the Docs package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all the source code
COPY . .

# Build the Astro site
RUN npm run build

# Install a lightweight static server
RUN npm install -g serve

# Open the port and serve the dist directory
EXPOSE 4321
CMD ["serve", "dist", "-p", "4321"]
