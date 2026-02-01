# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source files first
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install all dependencies and build
RUN npm ci

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only (skip prepare script)
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Expose SSE port
EXPOSE 3000

# Default to SSE mode for Docker
CMD ["node", "dist/server-sse.js"]
