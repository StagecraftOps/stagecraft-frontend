# Stage 1: Install dependencies
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copy package files — use install if no lockfile exists yet
COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Stage 2: Build the application
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set env for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
# Empty string = relative URLs — frontend and API share the same NLB domain
# so /api/v1/... routes to the API service via kGateway path-based routing
ENV NEXT_PUBLIC_API_URL ""

# Build the Next.js application
RUN npm run build

# Stage 3: Production runtime
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
