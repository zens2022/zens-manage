# Stage 1: Build Angular App
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . ./
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default nginx files
RUN rm -rf ./*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist/zens-manage/browser ./

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
