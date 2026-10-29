# Stage 1: Build the React application using Node.js 24.
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests before application files to improve build caching.
COPY package.json package-lock.json ./

# Install exact dependencies from the lockfile.
RUN npm ci

# Copy the application source code.
COPY . .

# Compile TypeScript and build production assets.
RUN npm run build


# Stage 2: Serve static files with unprivileged Nginx.
FROM nginxinc/nginx-unprivileged:stable-alpine

# Replace the default Nginx virtual host configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled React application.
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Document the non-privileged HTTP port.
EXPOSE 8080

# Start Nginx in the foreground.
CMD ["nginx", "-g", "daemon off;"]