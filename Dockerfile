FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy compiled JavaScript
COPY dist/ ./dist/

# Expose SSE port
EXPOSE 3000

# Default to SSE mode for Docker
CMD ["node", "dist/server-sse.js"]
