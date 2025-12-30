# Build stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Skip Prisma postinstall and install with retries
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm ci || npm ci || npm ci

# Now generate Prisma client with retries
RUN npx prisma generate --schema=prisma/schema.tenant.prisma || npx prisma generate --schema=prisma/schema.tenant.prisma || npx prisma generate --schema=prisma/schema.tenant.prisma

# Copy source code
COPY . .

# Build application
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy pruned node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start command with migration
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.tenant.prisma && node dist/main.js"]
