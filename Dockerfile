# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time env variables (overridden via --build-arg or .env)
ARG VITE_API_BASE_URL
ARG VITE_DEFAULT_TENANT_ID
ARG VITE_DEFAULT_USER_ID
ARG VITE_DEFAULT_WORKSPACE_ID
ARG VITE_DEFAULT_API_VERSION=1.1

RUN npm run build

# Stage 2: Serve with lightweight nginx
FROM nginx:stable-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]