# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild native modules for Alpine
RUN npm rebuild better-sqlite3

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy the compiled server chunks that include our db code
COPY --from=builder /app/.next/server ./.next/server

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]