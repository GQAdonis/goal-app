# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Create .env file with CLAUDE_API_KEY
RUN echo "CLAUDE_API_KEY=$CLAUDE_API_KEY" > .env

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]