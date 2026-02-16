# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
# Copy package files first for caching
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Build (output usually to dist)
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app/backend

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Create data directory for SQLite persistence
RUN mkdir -p data

# Copy frontend build artifacts to backend/public
COPY --from=frontend-build /app/frontend/dist ./public

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
